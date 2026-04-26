const mongoose = require('mongoose');
const therapyRoomConstants = require('./therapy-room.constant');

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: String,
    profileImage: String,
    role: String,
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const therapyRoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      unique: true,
      required: true,
      index: true,
      trim: true,
    },
    roomCode: {
      type: String,
      unique: true,
      required: true,
      index: true,
      trim: true,
    },
    roomLink: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hostType: {
      type: String,
      enum: Object.values(therapyRoomConstants.HOST_TYPES),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(therapyRoomConstants.ROOM_STATUS),
      default: therapyRoomConstants.ROOM_STATUS.WAITING,
      index: true,
    },
    maxParticipants: {
      type: Number,
      default: therapyRoomConstants.DEFAULTS.MAX_PARTICIPANTS,
      min: therapyRoomConstants.DEFAULTS.MAX_PARTICIPANTS_MIN,
      max: therapyRoomConstants.DEFAULTS.MAX_PARTICIPANTS_MAX,
    },
    maxActiveMics: {
      type: Number,
      default: therapyRoomConstants.DEFAULTS.MAX_ACTIVE_MICS,
    },
    participants: [participantSchema],
    analytics: {
      totalJoined: {
        type: Number,
        default: 0,
      },
      peakConcurrent: {
        type: Number,
        default: 0,
      },
      sessionDurationSeconds: {
        type: Number,
        default: 0,
      },
      _id: false,
    },
    startedAt: Date,
    endedAt: Date,
    hostDisconnectedAt: Date,
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);


const transformFn = (doc, ret) => {
  delete ret._id;
  delete ret.__v;
  
  return ret;
}
therapyRoomSchema.set('toJSON', { virtuals: true, transform: transformFn });
therapyRoomSchema.set('toObject', { virtuals: true, transform: transformFn });

module.exports = mongoose.model('TherapyRoom', therapyRoomSchema);