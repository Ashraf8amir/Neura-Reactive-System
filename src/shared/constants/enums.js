const ENUMS = Object.freeze({
  ROLE: {
    DOCTOR: 'doctor',
    PATIENT: 'patient',
    NURSE: 'nurse',
    PHARMACY: 'pharmacy',
    ADMIN: 'admin'
  },
  GENDERS: { 
    MALE: 'male',
    FEMALE: 'female'
  },
  DAYS_OF_WEEK: {
    SUNDAY: "Sunday",
    MONDAY: "Monday",
    TUESDAY: "Tuesday",
    WEDNESDAY: "Wednesday",
    THURSDAY: "Thursday",
    FRIDAY: "Friday",
    SATURDAY: "Saturday"
  },
  MARITAL_STATUS: {
      SINGLE: 'single',
      MARRIED: 'married',
      DIVORCED: 'divorced',
      WIDOWED: 'widowed'
  },
  ACCOUNT_STATUS: {
      ACTIVE: 'active',
      SUSPENDED: 'suspended',
      PENDING_VERIFICATION: 'pending_verification',
      INCOMPLETE: 'incomplete',
      REJECTED: 'rejected'
  },
  DOCUMENT_VERIFICATION_STATUS: {
      NOT_UPLOADED: 'not_uploaded',
      UPLOADED: 'uploaded',
      VERIFIED: 'verified',
      REJECTED: 'rejected'
  },
});
module.exports = ENUMS;