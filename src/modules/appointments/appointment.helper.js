const Appointment = require('./appointment.model');
const AppError = require('../../core/appError');
const { HTTP_STATUS_TEXT } = require('../../shared/constants/enums.js');


class AppointmentHelpers {


    static async isTimeSlotAvailable(doctorId, date, startTime, endTime, excludeAppointmentId = null) {
        const query = {
          doctor: doctorId,
          scheduledDate: date,
          status: { $nin: ['cancelled', 'no-show'] },
          'scheduledTime.startTime': { $lt: endTime },
          'scheduledTime.endTime': { $gt: startTime }
        };

        if (excludeAppointmentId) {
          query._id = { $ne: excludeAppointmentId };
        }

        const conflictingAppointment = await Appointment.findOne(query);
        return !conflictingAppointment;
    }

}

module.exports = AppointmentHelpers;