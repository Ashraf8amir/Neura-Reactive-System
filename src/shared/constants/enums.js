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
});

module.exports = ENUMS;