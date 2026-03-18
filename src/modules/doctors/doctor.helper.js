const enums = require('../../shared/constants/enums');


exports.areAllRequiredDocumentsUploaded = (doctor) => {
    
  return doctor.nationalId.front.status === enums.DOCUMENT_VERIFICATION_STATUS.UPLOADED &&
         doctor.nationalId.back.status === enums.DOCUMENT_VERIFICATION_STATUS.UPLOADED &&
         doctor.medicalLicense.status === enums.DOCUMENT_VERIFICATION_STATUS.UPLOADED &&
         doctor.medicalDegree.status === enums.DOCUMENT_VERIFICATION_STATUS.UPLOADED &&
         doctor.syndicateCard.status === enums.DOCUMENT_VERIFICATION_STATUS.UPLOADED;
};
exports.buildQueryFilters = (filters) => {
    const query = {
      accountStatus: 'active'
    };

    if (filters.specialization) {
        query['professionalInfo.primarySpecialization'] = filters.specialization;
    }
    
    if (filters.gender) {
        query.gender = filters.gender;
    }

    if (filters.minRating !== undefined) {
        query.rating = { $gte: parseFloat(filters.minRating) };
    }

    if (filters.city || filters.governorate) {
        const clinicConditions = {};
        if (filters.city) {
            clinicConditions['clinicInfo.address.city'] = {
                $regex: new RegExp(filters.city, 'i')
            };
        }
        if (filters.governorate) {
            clinicConditions['clinicInfo.address.governorate'] = {
                $regex: new RegExp(filters.governorate, 'i')
            };
        }
        Object.assign(query, clinicConditions);
    }

    if (filters.availableToday === true) {
        const today = new Date();
        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

        query.$or = [
            { 'clinicInfo.availableHours.day': dayName },
            {
                'telemedicine.enabled': true,
                'telemedicine.availableHours.day': dayName
            }
        ];
    }

    return query;
}
