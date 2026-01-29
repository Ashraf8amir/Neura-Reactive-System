const ENUMS = Object.freeze({
  GENDERS: ["male", "female"],
  DAYS_OF_WEEK: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
  MARITAL_STATUS: ["single", "married", "divorced", "widowed"],
  ACCOUNT_STATUS: ["active", "suspended", "pending_verification", "incomplete", "rejected"],
  DOCUMENT_VERIFICATION_STATUS: {
      NOT_UPLOADED: 'not_uploaded',
      UPLOADED: 'uploaded',
      VERIFIED: 'verified',
      REJECTED: 'rejected'
  },
});

module.exports = ENUMS;