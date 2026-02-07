const Patient = require('../patients/patient.model');
const Doctor = require('../doctors/doctor.model');
const Appointment = require('./appointment.model');
const AppError = require('../../core/appError');
const { HTTP_STATUS_TEXT, ROLE, ACCOUNT_STATUS } = require('../../shared/constants/enums.js');
const AppointmentHelpers = require('./appointment.helper');
const logger = require('../../core/logger.js');


class AppointmentService {

    async createAppointment(appointmentData, user) {
        const { doctorId, clinic, ...rest } = appointmentData;

        const patientId = user.role === ROLE.PATIENT ? user.id : appointmentData.patientId;

        if (!patientId) {
            throw new AppError(400, HTTP_STATUS_TEXT.BAD_REQUEST, 'patientId is required when booking for a patient');
        }

        const patient = await Patient.findById(patientId);
        if (!patient) {
            throw new AppError(404, HTTP_STATUS_TEXT.NOT_FOUND, 'Patient not found');
        }

        if ([ACCOUNT_STATUS.SUSPENDED, ACCOUNT_STATUS.INCOMPLETE].includes(patient.accountStatus)) {
            throw new AppError(403, HTTP_STATUS_TEXT.FORBIDDEN, 'Patient is not allowed to book appointments');
        }

        const doctor = await Doctor.findById(doctorId);
        if (!doctor || doctor.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
            throw new AppError(403, HTTP_STATUS_TEXT.FORBIDDEN, 'Doctor is not available or inactive');
        }

        if(appointmentData.appointmentType === 'telemedicine' && !doctor.telemedicine?.enabled) {
            throw new AppError(400, HTTP_STATUS_TEXT.BAD_REQUEST, 'Doctor does not offer telemedicine appointments');
        }
        
         const isAvailable = await AppointmentHelpers.isTimeSlotAvailable(
            doctorId,
            appointmentData.scheduledDate,
            appointmentData.scheduledTime.startTime,
            appointmentData.scheduledTime.endTime
        );

        if (!isAvailable) {
            throw new AppError(409, HTTP_STATUS_TEXT.CONFLICT, 'Time slot is not available');
        }

        const clinicInfo = doctor.clinicInfo?.id(clinic?.clinicId);
        if (!clinicInfo) {
            throw new AppError(404, HTTP_STATUS_TEXT.NOT_FOUND, 'Clinic not found for the doctor');
        }

        const clinicpayload = {
            clinicId: clinic.clinicId,
            clinicName: clinicInfo.clinicName,
            address: clinicInfo.address,
            location: clinicInfo.location
        };

        const newAppointment = new Appointment({
            ...rest,
            doctor: doctorId,
            patient: patientId,
            status: 'pending',
            clinic: clinicpayload,
        });

        await newAppointment.save();
        await newAppointment.populate('doctor', 'firstName lastName professionalInfo.primarySpecialization dateOfBirth');

        return newAppointment;
    };


}

module.exports = new AppointmentService();