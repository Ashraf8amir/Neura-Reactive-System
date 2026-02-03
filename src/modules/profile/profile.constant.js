const Patient = require('../../modules/patients/patient.model');
const Doctor = require('../../modules/doctors/doctor.model');
const { ROLE } = require('../../shared/constants/enums');


const profileConstants = Object.freeze({
    ROLE_CONFIG: {
        [ROLE.PATIENT]: { model: Patient, folder: 'patients/profile-images' },
        [ROLE.DOCTOR]: { model: Doctor, folder: 'doctors/profile-images' }
    }
})

module.exports = profileConstants;