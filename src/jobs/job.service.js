const cron = require('node-cron');
const Appointment = require('../modules/appointments/appointment.model');
const User = require('../shared/models/user.model');
const { appointmentConstants } = require('../modules/appointments/appointment.constant');
const TherapyRoom = require('../modules/therapy-rooms/therapy-room.model');
const therapyRoomConstants = require('../modules/therapy-rooms/therapy-room.constant');
const roomState = require('../socket/namespaces/room/room.state');
const logger = require('../core/logger');


class JobService {
    async cancelUnconfirmedAppointments() {
        logger.info('Running Auto-Cancellation Check...');
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        try {
            const result = await Appointment.updateMany(
                {
                    status: appointmentConstants.APPOINTMENT_STATUSES.PENDING,
                    'payment.method': { $ne: appointmentConstants.PAYMENT_METHODS.CASH }, 
                    createdAt: { $lt: tenMinutesAgo } 
                },
                {
                    $set: { 
                        status: appointmentConstants.APPOINTMENT_STATUSES.CANCELLED,
                        'cancellation.cancellationReason': 'Payment timeout (Auto-cancelled)',
                        'cancellation.cancelledAt': new Date()
                    }
                }
            );
            logger.info(`Cleanup complete. Auto-cancelled ${result.modifiedCount} appointments.`);
        } catch (error) {
            logger.error('Error in auto-cancellation logic:', error);
        }
    }

    async unblockBlacklistedPatients() {
        logger.info('Running Unblock Patients job...');
        const now = new Date();
        try {
            const result = await User.updateMany(
                { 'blacklist.isBlocked': true, 'blacklist.blockedUntil': { $lte: now } },
                {
                    $set: { 'blacklist.isBlocked': false, 'blacklist.blacklistPoints': 0 },
                    $unset: { 'blacklist.blockedUntil': "" }
                }
            );
            logger.info(`Unblock job complete. Unblocked ${result.modifiedCount} patients.`);
        } catch (error) {
            logger.error('Error in unblocking patients:', error);
        }
    }

    async cleanupInactiveTherapyRooms() {
        logger.info('Running Therapy Room stale cleanup job...');

        try {
            const staleThreshold = new Date(Date.now() - 10 * 60 * 1000);

            const rooms = await TherapyRoom.find({
                status: {
                    $in: [
                        therapyRoomConstants.ROOM_STATUS.WAITING,
                        therapyRoomConstants.ROOM_STATUS.ACTIVE
                    ]
                },
                startedAt: { $lte: staleThreshold }
            }).select('_id roomId startedAt updatedAt').lean();

            const staleRooms = rooms.filter((room) => !roomState.hasRoom(room.roomId));
            if (!staleRooms.length) {
                logger.info('Therapy room cleanup complete. No stale rooms found.');
                return;
            }

            const now = new Date();
            const expiresAt = new Date(now.getTime() + therapyRoomConstants.DEFAULTS.ROOM_EXPIRY_AFTER_END_MS);

            const operations = staleRooms.map((room) => {
                const durationSeconds = room.startedAt ? Math.max(0, Math.floor((now.getTime() - room.startedAt.getTime()) / 1000)) : 0;
                return {
                    updateOne: {
                        filter: {
                            _id: room._id,
                            status: {
                                $in: [
                                    therapyRoomConstants.ROOM_STATUS.WAITING,
                                    therapyRoomConstants.ROOM_STATUS.ACTIVE
                                ]
                            }
                        },
                        update: {
                            $set: {
                                status: therapyRoomConstants.ROOM_STATUS.ENDED,
                                endedAt: now,
                                expiresAt,
                                hostDisconnectedAt: null,
                                'analytics.sessionDurationSeconds': durationSeconds
                            }
                        }
                    }
                };
            });

            const result = await TherapyRoom.bulkWrite(operations);
            logger.info(`Therapy room cleanup complete. Ended ${result.modifiedCount || 0} stale room(s).`);
        } catch (error) {
            logger.error('Error in therapy room cleanup job:', error);
        }
    }
}

module.exports = new JobService();
