const cron = require('node-cron');
const JobService = require('./job.service.js');
const logger = require('../core/logger.js');

const initJobs = () => {
    cron.schedule('*/5 * * * *', () => {
        JobService.cancelUnconfirmedAppointments();
    });

    cron.schedule('*/13 * * * *', () => {
        JobService.unblockBlacklistedPatients();
    });

    cron.schedule('*/15 * * * *', () => {
        JobService.cleanupInactiveTherapyRooms();
    });

    logger.info('Background Jobs Scheduled Successfully');
}

module.exports = initJobs;