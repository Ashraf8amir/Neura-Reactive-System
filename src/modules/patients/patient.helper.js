const { patientConstants } = require('./patient.constant');

exports.basicInfoCompleteness = (patient) => {
  let filledWeight = 0;
  let totalWeight = 0;
  const missing = [];

  patientConstants.BASIC_INFO_FIELDS.forEach((field) => {
    totalWeight += field.weight;

    const value = field.path
      .split('.')
      .reduce((acc, key) => acc?.[key], patient);

    if (value !== undefined && value !== null && value !== '') {
      filledWeight += field.weight;
    } else {
      missing.push(field.path);
    }
  });

  const completeness = totalWeight ? Math.round((filledWeight / totalWeight) * 100) : 0;
  return { completeness, missing };
};