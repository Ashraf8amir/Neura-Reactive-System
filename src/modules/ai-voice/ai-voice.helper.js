const formatChronicDiseases = (diseases) => {
    if (!diseases || diseases.length === 0) return 'None reported';
    return diseases.map(d => {
        let str = d.nameOfDisease;
        if (d.type) str += ` (${d.type})`;
        if (d.since) str += ` - since ${d.since}`;
        return str;
    }).join(', ');
};
const formatAllergies = (allergies) => {
    if (!allergies || allergies.length === 0) return 'None reported';
    return allergies.map(a => {
        let str = a.nameOfAllergy;
        if (a.types && a.types.length > 0) {
            const reactions = a.types.map(t => {
                let reaction = t.reaction || 'unknown reaction';
                if (t.severity) reaction += ` (${t.severity})`;
                return reaction;
            }).join(', ');
            str += `: ${reactions}`;
        }
        return str;
    }).join('; ');
};
const formatMedications = (medications) => {
    if (!medications || medications.length === 0) return 'None';
    return medications.map(m => {
        let str = m.name || 'Unknown medication';
        if (m.dosage) str += ` (${m.dosage})`;
        if (m.reason) str += ` - for ${m.reason}`;
        return str;
    }).join(', ');
};
const formatPreviousSurgeries = (surgeries) => {
    if (!surgeries || surgeries.length === 0) return 'None reported';
    return surgeries.map(s => {
        let str = s.nameOfSurgery || 'Unknown surgery';
        if (s.date) str += ` (${s.date.toISOString().split('T')[0]})`;
        if (s.hospital) str += ` at ${s.hospital}`;
        if (s.doctor) str += ` by Dr. ${s.doctor}`;
        if (s.notes) str += ` - Notes: ${s.notes}`;
        return str;
    }).join(', ');
};
const formatFamilyMedicalHistory = (history) => {
    if (!history || history.length === 0) return 'None reported';
    return history.map(h => {
        let str = `${h.nameOfFamilyMember || 'Unknown family member'}: ${h.nameOfDisease || 'Unknown disease'}`;
        if (h.age) str += ` (diagnosed at age ${h.age})`;
        return str;
    }).join('; ');
};
const formatLifestyle = (lifestyle) => {
    if (!lifestyle) return 'No lifestyle information';
    const { smokingStatus, alcoholConsumption, physicalActivityLevel, sleepQuality, averageSleepHours } = lifestyle;
    return `Smoking: ${smokingStatus || 'Unknown'}, Alcohol: ${alcoholConsumption || 'Unknown'}, Physical Activity: ${physicalActivityLevel || 'Unknown'}, Sleep Quality: ${sleepQuality || 'Unknown'}, Average Sleep Hours: ${averageSleepHours || 'Unknown'}`;
}

const buildLlamaPrompt = (patientInfo, previousVisits, transcript) => {
    return `You are an expert medical assistant helping a doctor document a patient visit.
            The following is a real doctor-patient conversation in Arabic (Egyptian dialect).

=== PATIENT PROFILE ===
- Age: ${patientInfo.age} | Gender: ${patientInfo.gender} | Blood Type: ${patientInfo.bloodType || 'Unknown'}
- Marital Status: ${patientInfo.maritalStatus} | BMI: ${patientInfo.bmi || 'Unknown'}
- Chronic Diseases: ${formatChronicDiseases(patientInfo.chronicDiseases)}
- Current Medications: ${formatMedications(patientInfo.currentMedications)}
- Known Allergies: ${formatAllergies(patientInfo.allergies)}
- Previous Surgeries: ${formatPreviousSurgeries(patientInfo.previousSurgeries)}
- Family Medical History: ${formatFamilyMedicalHistory(patientInfo.familyMedicalHistory)}
- Lifestyle: ${formatLifestyle(patientInfo.lifestyle)}

=== PREVIOUS VISITS ===
${previousVisits || 'No previous visit records available.'}

=== CURRENT VISIT TRANSCRIPT ===
${transcript}

=== INSTRUCTIONS ===
1. Translate the Arabic conversation to English internally. Do NOT include the translation in the output.
2. Think step-by-step internally before generating the final JSON, but do NOT include your reasoning.
3. Cross-reference symptoms with patient's chronic diseases and medications.
4. Carefully compare current medications, new treatments, and allergies. Flag ANY potential risk even if uncertain.
5. Return ONLY a valid JSON object. Do NOT include any explanation, text, or markdown. Do NOT wrap the JSON in backticks.

The JSON should follow this structure:

{
  "symptoms": [],
  "diagnosis": "",
  "treatment_plan": {
    "medications": [],
    "procedures": [],
    "lifestyle_advice": ""
  },
  "summary": "",
  "follow_up": "",
  "urgency_level": "routine | urgent | emergency",
  "alerts": {
    "drug_interactions": [],
    "allergy_conflicts": [],
    "requires_immediate_attention": false
  }
}


Rules:
- symptoms: all symptoms mentioned by the patient
- diagnosis: preliminary diagnosis based on conversation + patient history
- treatment_plan.medications: ONLY include NEW medications prescribed by the doctor during this visit, DO NOT include patient's existing medications.
- urgency_level: your assessment of how urgent this case is
- alerts: CRITICAL — check current medications against any new prescriptions mentioned
- clearly distinguish between:
    - Current medications (from patient history)
    - New prescriptions (from this visit)
- summary: 3-4 sentences max`;
};

const parseJsonResponse = (response) => {
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('LLM response does not contain a valid JSON object');
    }
    
    let parsed;
    try {
        parsed = JSON.parse(jsonMatch[0]);
    } catch (error) {
        throw new Error(`Failed to parse JSON: ${error.message}`);
    }
    
    const requiredFields = {
        symptoms: [],
        diagnosis: '',
        summary: '',
        follow_up: '',
        treatment_plan: { medications: [], procedures: [], lifestyle_advice: '' },
        alerts: { drug_interactions: [], allergy_conflicts: [], requires_immediate_attention: false },
        urgency_level: 'routine'
    };
    
    for (const [field, defaultValue] of Object.entries(requiredFields)) {
        if (!(field in parsed)) {
            parsed[field] = defaultValue;
        }
    }

    parsed.treatment_plan = parsed.treatment_plan || {};
    parsed.treatment_plan.medications = parsed.treatment_plan.medications || [];
    parsed.treatment_plan.procedures = parsed.treatment_plan.procedures || [];
    parsed.treatment_plan.lifestyle_advice = parsed.treatment_plan.lifestyle_advice || '';

    parsed.alerts = parsed.alerts || {};
    parsed.alerts.drug_interactions = parsed.alerts.drug_interactions || [];
    parsed.alerts.allergy_conflicts = parsed.alerts.allergy_conflicts || [];
    parsed.alerts.requires_immediate_attention = parsed.alerts.requires_immediate_attention || false;
    
    if (!Array.isArray(parsed.symptoms)) {
        parsed.symptoms = parsed.symptoms ? [String(parsed.symptoms)] : [];
    }
    
    const validUrgency = ['routine', 'urgent', 'emergency'];
    if (!validUrgency.includes(parsed.urgency_level)) {
        parsed.urgency_level = 'routine';
    }
    
    return parsed;
};

const formatPatientForPrompt = (patient) => {
    let age = 'Unknown';
    if (patient.dateOfBirth) {
        const birthDate = new Date(patient.dateOfBirth);
        const today = new Date();
        age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
    }

    let bmi = 'Unknown';
    if (patient.height && patient.weight) {
        const heightInMeters = patient.height / 100;
        bmi = (patient.weight / (heightInMeters * heightInMeters)).toFixed(1);
    }

    return {
        age,
        bmi,
        gender: patient.gender || 'Unknown',
        maritalStatus: patient.maritalStatus || 'Unknown',
        bloodType: patient.bloodType || null,
        chronicDiseases: patient.medicalProfile?.chronicDiseases || [],
        allergies: patient.medicalProfile?.allergies || [],
        previousSurgeries: patient.medicalProfile?.previousSurgeries || [],
        familyMedicalHistory: patient.medicalProfile?.familyMedicalHistory || [],
        currentMedications: patient.medicalProfile?.currentMedications || [],
        lifestyle: {
            smokingStatus: patient.medicalProfile?.lifestyle?.smokingStatus || 'Unknown',
            alcoholConsumption: patient.medicalProfile?.lifestyle?.alcoholConsumption || 'Unknown',
            physicalActivityLevel: patient.medicalProfile?.lifestyle?.physicalActivityLevel || 'Unknown',
            sleepQuality: patient.medicalProfile?.lifestyle?.sleepQuality || 'Unknown',
            averageSleepHours: patient.medicalProfile?.lifestyle?.averageSleepHours || 'Unknown'
        }
    };
};

module.exports = {
    formatChronicDiseases,
    formatAllergies,
    formatMedications,
    buildLlamaPrompt,
    parseJsonResponse,
    formatPatientForPrompt
};
