const enums = require('../../shared/constants/enums');

exports.areAllRequiredDocumentsUploaded = (doctor) => {
    
  return doctor.nationalId.front.status === enums.DOCUMENT_VERIFICATION_STATUS.UPLOADED &&
         doctor.nationalId.back.status === enums.DOCUMENT_VERIFICATION_STATUS.UPLOADED &&
         doctor.medicalLicense.status === enums.DOCUMENT_VERIFICATION_STATUS.UPLOADED &&
         doctor.medicalDegree.status === enums.DOCUMENT_VERIFICATION_STATUS.UPLOADED &&
         doctor.syndicateCard.status === enums.DOCUMENT_VERIFICATION_STATUS.UPLOADED;
};