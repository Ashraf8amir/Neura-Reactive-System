const mongoose = require('mongoose');
const AppError = require('../../core/appError');
const { HTTP_STATUS_TEXT } = require('../../shared/constants/enums');
const User = require('../../shared/models/user.model');
const roomState = require('../../socket/namespaces/room/room.state');
const TherapyRoom = require('./therapy-room.model');
const therapyRoomConstants = require('./therapy-room.constant');
const {
  generateUniqueRoomCode,
  generateRoomId,
  buildRoomLink,
  generateAgoraToken,
} = require('./therapy-room.helper');

class TherapyRoomService {
  statuses = therapyRoomConstants.ROOM_STATUS;

  hostTypes = therapyRoomConstants.HOST_TYPES;

  toObjectId(value) {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new AppError(
        400,
        HTTP_STATUS_TEXT.BAD_REQUEST,
        "Invalid user identifier",
      );
    }
    return new mongoose.Types.ObjectId(value);
  }

  async buildParticipantSnapshot(userId, session) {
    const user = await User.findById(userId)
      .select("firstName lastName role profileImage")
      .session(session);

    if (!user) {
      throw new AppError(404, HTTP_STATUS_TEXT.NOT_FOUND, "User not found");
    }

    return {
      userId: user._id,
      name:`${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown User",
      profileImage: user.profileImage?.imageUrl || null,
      role: user.role,
      joinedAt: new Date(),
    };
  }

  resolveHostType(role) {
    if (role === this.hostTypes.DOCTOR) return this.hostTypes.DOCTOR;
    if (role === this.hostTypes.ADMIN) return this.hostTypes.ADMIN;

    throw new AppError(
      403,
      HTTP_STATUS_TEXT.FORBIDDEN,
      "Only doctors and admins can create therapy rooms",
    );
  }

  computeTokenDurationMs(room) {
    const nowMs = Date.now();
    const maxWindowMs = therapyRoomConstants.DEFAULTS.MAX_TOKEN_DURATION_MS;
    const defaultExpectedEndMs = nowMs + maxWindowMs;

    const startedAtMs = room.startedAt ? new Date(room.startedAt).getTime() : null;
    const endedAtMs = room.endedAt ? new Date(room.endedAt).getTime() : null;

    const expectedEndMs = endedAtMs || (startedAtMs ? startedAtMs + maxWindowMs : defaultExpectedEndMs);
    const remainingMs = Math.min(expectedEndMs - nowMs, maxWindowMs);

    return Math.max(remainingMs, 60 * 1000);
  }

  async createRoom(payload, authUser) {
    const session = await mongoose.startSession();

    try {
      let createdRoom = null;

      await session.withTransaction(async () => {
        const roomCode = await generateUniqueRoomCode(session);
        const roomId = generateRoomId();
        const hostType = this.resolveHostType(authUser.role);
        const maxParticipants =
          payload.maxParticipants ||
          therapyRoomConstants.DEFAULTS.MAX_PARTICIPANTS;
        const maxActiveMics =
          payload.maxActiveMics ||
          therapyRoomConstants.DEFAULTS.MAX_ACTIVE_MICS;

        if (maxActiveMics > maxParticipants) {
          throw new AppError(
            400,
            HTTP_STATUS_TEXT.BAD_REQUEST,
            "maxActiveMics cannot exceed maxParticipants",
          );
        }

        const [room] = await TherapyRoom.create(
          [
            {
              roomId,
              roomCode,
              roomLink: buildRoomLink(roomCode),
              title: payload.title,
              hostId: this.toObjectId(authUser.id),
              hostType,
              maxParticipants,
              maxActiveMics,
            },
          ],
          { session },
        );

        createdRoom = room;
      });

      return createdRoom.toObject();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        500,
        HTTP_STATUS_TEXT.ERROR,
        "Failed to create therapy room",
      );
    } finally {
      await session.endSession();
    }
  }

  async getActiveRooms() {
    const rooms = await TherapyRoom.find({
      status: { $in: [this.statuses.WAITING, this.statuses.ACTIVE] },
    }).sort({ createdAt: -1 }).lean();

    return rooms.map((room) => {
      const participantCount = roomState.hasRoom(room.roomId)
        ? roomState.getParticipants(room.roomId).length
        : room.participants.length;

      delete room.__v;  

      return {
        ...room,
        participantCount,
      };
    });
  }

  async joinRoomByCode(code, authUser) {
    const session = await mongoose.startSession();

    try {
      const joinResult = await session.withTransaction(async () => {
        const userId = this.toObjectId(authUser.id);
        const now = new Date();

        let room = await TherapyRoom.findOne({
          roomCode: code,
          status: { $in: [this.statuses.WAITING, this.statuses.ACTIVE] },
        }).session(session);

        if (!room) {
          throw new AppError(404, HTTP_STATUS_TEXT.NOT_FOUND, "Room not found or already ended");
        }

        const alreadyParticipant = room.participants.some(
          (participant) => participant.userId.toString() === authUser.id.toString() 
        );

        if (!alreadyParticipant) {
          const participant = await this.buildParticipantSnapshot(authUser.id, session);

          room = await TherapyRoom.findOneAndUpdate(
            {
              _id: room._id,
              status: { $in: [this.statuses.WAITING, this.statuses.ACTIVE] },
              participants: { $not: { $elemMatch: { userId } } },
              $expr: { $lt: [{ $size: "$participants" }, "$maxParticipants"] },
            },
            [
              {
                $set: {
                  participants: {
                    $concatArrays: ["$participants", [participant]],
                  },
                  status: this.statuses.ACTIVE,
                  startedAt: { $ifNull: ["$startedAt", now] },
                  "analytics.totalJoined": {
                    $add: ["$analytics.totalJoined", 1]
                  }
                }
              }
            ],
            { new: true, session, updatePipeline: true }
          );

          if (!room) {
            const latestRoom = await TherapyRoom.findOne({
              roomCode: code
            }).session(session);

            if (!latestRoom || latestRoom.status === this.statuses.ENDED) {
              throw new AppError( 404, HTTP_STATUS_TEXT.NOT_FOUND, "Room not found or already ended");
            }

            if (latestRoom.participants.length >= latestRoom.maxParticipants) {
              throw new AppError(409, HTTP_STATUS_TEXT.CONFLICT, "Room is full");
            }

            const isNowParticipant = latestRoom.participants.some(
              (roomParticipant) => roomParticipant.userId.toString() === authUser.id.toString()
            );

            if (!isNowParticipant) {
              throw new AppError(409, HTTP_STATUS_TEXT.CONFLICT, "Unable to join room at the moment");
            }

            room = latestRoom;
          }
        }

        return {
          room: room.toObject(),
          alreadyParticipant
        };
      });

      const tokenDurationMs = this.computeTokenDurationMs(joinResult.room);
      const agora = generateAgoraToken(
        joinResult.room.roomId,
        authUser.id,
        tokenDurationMs
      );

      return {
        ...joinResult.room,
        agoraToken: agora.token,
        uid: agora.uid
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, HTTP_STATUS_TEXT.ERROR, "Failed to join therapy room");
    } finally {
      await session.endSession();
    }
  }

  async getRoomToken(roomId, authUser) {
    const userId = this.toObjectId(authUser.id);
    const room = await TherapyRoom.findOne({
      roomId,
      status: { $in: [this.statuses.WAITING, this.statuses.ACTIVE] },
      participants: { $elemMatch: { userId } }
    })
      .select("roomId startedAt endedAt status")
      .lean();

    if (!room) {
      throw new AppError(403, HTTP_STATUS_TEXT.FORBIDDEN,"Only room participants can request room tokens");
    }

    const tokenDurationMs = this.computeTokenDurationMs(room);
    const agora = generateAgoraToken(room.roomId, authUser.id, tokenDurationMs);

    return {
      agoraToken: agora.token,
      uid: agora.uid,
      channelName: room.roomId
    };
  }

  async getRoomDetails(roomId, authUser) {
    const userId = this.toObjectId(authUser.id);
    const room = await TherapyRoom.findOne({
      roomId,
      participants: { $elemMatch: { userId } }
    }).lean();

    if (!room) {
      throw new AppError( 403, HTTP_STATUS_TEXT.FORBIDDEN, "Only room participants can view this room");
    }

    const participants = roomState.hasRoom(roomId)
      ? roomState.getParticipants(roomId)
      : room.participants.map((participant) => ({
          userId: participant.userId.toString(),
          socketId: null,
          name: participant.name || null,
          profileImage: participant.profileImage || null,
          role: participant.role || null,
          isMuted: true,
          handRaised: false,
        }));

    delete room.__v;

    return {
      ...room,
      participants,
      participantCount: participants.length,
      activeMicCount: roomState.hasRoom(roomId) ? roomState.getActiveMicCount(roomId): 0
    };
  }

  async endRoomByHost(roomId, authUser) {
    const session = await mongoose.startSession();

    try {
      const endedRoom = await session.withTransaction(async () => {
        const room = await TherapyRoom.findOne({
          roomId,
          hostId: this.toObjectId(authUser.id),
          status: { $in: [this.statuses.WAITING, this.statuses.ACTIVE] }
        }).session(session);

        if (!room) {
          throw new AppError(403, HTTP_STATUS_TEXT.FORBIDDEN, "Only the host can end this room");
        }

        const now = new Date();
        const durationSeconds = room.startedAt? Math.max(0, Math.floor((now.getTime() - room.startedAt.getTime()) / 1000)) : 0;

        const updated = await TherapyRoom.findOneAndUpdate(
          {
            _id: room._id,
            status: { $in: [this.statuses.WAITING, this.statuses.ACTIVE] }
          },
          {
            $set: {
              status: this.statuses.ENDED,
              endedAt: now,
              expiresAt: new Date(now.getTime() + therapyRoomConstants.DEFAULTS.ROOM_EXPIRY_AFTER_END_MS),
              hostDisconnectedAt: null,
              "analytics.sessionDurationSeconds": durationSeconds
            }
          },
          { new: true, session }
        );

        return updated;
      });

      return endedRoom ? endedRoom.toObject() : null;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, HTTP_STATUS_TEXT.ERROR, "Failed to end therapy room");
    } finally {
      await session.endSession();
    }
  }

  async endRoomBySystem(roomId) {
    const session = await mongoose.startSession();

    try {
      const endedRoom = await session.withTransaction(async () => {
        const room = await TherapyRoom.findOne({
          roomId,
          status: { $in: [this.statuses.WAITING, this.statuses.ACTIVE] }
        }).session(session);

        if (!room) return null;

        const now = new Date();
        const durationSeconds = room.startedAt ? Math.max(0, Math.floor((now.getTime() - room.startedAt.getTime()) / 1000)) : 0;

        return TherapyRoom.findOneAndUpdate(
          {
            _id: room._id,
            status: { $in: [this.statuses.WAITING, this.statuses.ACTIVE] }
          },
          {
            $set: {
              status: this.statuses.ENDED,
              endedAt: now,
              expiresAt: new Date(now.getTime() + therapyRoomConstants.DEFAULTS.ROOM_EXPIRY_AFTER_END_MS),
              hostDisconnectedAt: null,
              "analytics.sessionDurationSeconds": durationSeconds
            }
          },
          { new: true, session }
        );
      });

      return endedRoom ? endedRoom.toObject() : null;
    } catch (error) {
      throw new AppError(500, HTTP_STATUS_TEXT.ERROR, "Failed to end therapy room");
    } finally {
      await session.endSession();
    }
  }

  async updatePeakConcurrent(roomId, count) {
    await TherapyRoom.updateOne(
      {
        roomId,
        status: { $in: [this.statuses.WAITING, this.statuses.ACTIVE] }
      },
      { $max: { "analytics.peakConcurrent": count } }
    );
  }

  async removeParticipant(roomId, userId) {
    const normalizedUserId = this.toObjectId(userId);
    return TherapyRoom.findOneAndUpdate(
      {
        roomId,
        status: { $in: [this.statuses.WAITING, this.statuses.ACTIVE] }
      },
      { $pull: { participants: { userId: normalizedUserId } } },
      { new: true }
    ).lean();
  }

  async markHostDisconnected(roomId, disconnectedAt = new Date()) {
    await TherapyRoom.updateOne(
      {
        roomId,
        status: { $in: [this.statuses.WAITING, this.statuses.ACTIVE] },
      },
      { $set: { hostDisconnectedAt: disconnectedAt } },
    );
  }

  async clearHostDisconnected(roomId) {
    await TherapyRoom.updateOne(
      {
        roomId,
        status: { $in: [this.statuses.WAITING, this.statuses.ACTIVE] }
      },
      { $set: { hostDisconnectedAt: null } },
    );
  }

  async getRoomAccessForSocket(roomId, userId) {
    const normalizedUserId = this.toObjectId(userId);
    const room = await TherapyRoom.findOne({
      roomId,
      status: { $in: [this.statuses.WAITING, this.statuses.ACTIVE] },
      participants: { $elemMatch: { userId: normalizedUserId } }
    })
      .select("roomId status hostId maxActiveMics participants")
      .lean();

    if (!room) {
      throw new AppError(403, HTTP_STATUS_TEXT.FORBIDDEN, "Access denied to this room");
    }

    const participant = room.participants.find(
      (item) => item.userId.toString() === normalizedUserId.toString()
    );

    return {
      roomId: room.roomId,
      status: room.status,
      hostId: room.hostId?.toString(),
      maxActiveMics: room.maxActiveMics,
      participant: participant ? {
            userId: participant.userId.toString(),
            name: participant.name || null,
            profileImage: participant.profileImage || null,
            role: participant.role || null,
          } : null
    };
  }

  async getRoomRuntimeMeta(roomId) {
    return TherapyRoom.findOne({
      roomId,
      status: { $in: [this.statuses.WAITING, this.statuses.ACTIVE] },
    })
      .select("roomId status hostId maxActiveMics startedAt")
      .lean();
  }
}

module.exports = new TherapyRoomService();
