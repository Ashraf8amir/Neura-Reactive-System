const validators = Object.freeze({
  egyptianPhone: {
    validator: function (v) {
      return !v || /^01[0-2,5]{1}[0-9]{8}$/.test(v);
    },
    message: "Invalid Egyptian phone number",
  },
  nationalId: {
    validator: function (v) {
      return !v || /^[0-9]{14}$/.test(v);
    },
    message: "National ID must be exactly 14 digits",
  },
  email: {
    validator: function (v) {
      return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    },
    message: "Invalid email format",
  },
  timeFormat: {
    validator: function (v) {
      return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
    },
    message: "Time must be in HH:MM format",
  },
});

module.exports = validators;