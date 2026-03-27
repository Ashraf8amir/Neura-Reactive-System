const Appointment = require('./appointment.model');
const { ROLE } = require('../../shared/constants/enums.js');
const { appointmentConstants } = require('./appointment.constant');


class AppointmentHelpers {

    
    static async isTimeSlotAvailable(doctorId, clinicId, date, startTime, endTime, session = null, excludeAppointmentId = null) {
        const query = {
            doctor: doctorId,
            "clinic.clinicId": clinicId,
            scheduledDate: date,
            status: { $in: [appointmentConstants.APPOINTMENT_STATUSES.PENDING, appointmentConstants.APPOINTMENT_STATUSES.CONFIRMED] },
            'scheduledTime.startTime': { $lt: endTime },
            'scheduledTime.endTime': { $gt: startTime }
        };

        if (excludeAppointmentId) {
            query._id = { $ne: excludeAppointmentId };
        }

        const conflictingAppointment = await Appointment.findOne(query).session(session);
        return !conflictingAppointment;
    }
    static calculateConsultationFee(appointmentType, clinicInfo, doctor) {
        let consultationFee = 0;
            switch (appointmentType) {
                case appointmentConstants.APPOINTMENT_TYPES.FOLLOW_UP:
                    consultationFee = clinicInfo.followUpFee || 0;
                    break;
                case appointmentConstants.APPOINTMENT_TYPES.TELEMEDICINE:
                    consultationFee = doctor.telemedicine?.consultationFee || clinicInfo.consultationFee || 0;
                    break;
                case appointmentConstants.APPOINTMENT_TYPES.CONSULTATION:
                default:
                    consultationFee = clinicInfo.consultationFee || 0;
                    break;
            }
        return consultationFee;
    }
    static buildQueryByRole(user, filters) {
        const query = {};
    
        const roleMapping = {
            [ROLE.DOCTOR]: 'doctor',
            [ROLE.PATIENT]: 'patient'
        };

        if (roleMapping[user.role]) {
            query[roleMapping[user.role]] = user.id;
        }

        const filterMaps = {
            status: 'status',
            appointmentType: 'appointmentType',
            paymentStatus: 'payment.paymentStatus',
            priority: 'priority',
            doctorId: user.role !== ROLE.DOCTOR ? 'doctor' : null,
            patientId: user.role !== ROLE.PATIENT ? 'patient' : null
        };

        Object.entries(filterMaps).forEach(([filterKey, dbPath]) => {
            if (dbPath && filters[filterKey]) {
                query[dbPath] = filters[filterKey];
            }
        });
      
        if (filters.startDate || filters.endDate) {
            query.scheduledDate = {};
            if (filters.startDate) query.scheduledDate.$gte = new Date(filters.startDate);
            if (filters.endDate) query.scheduledDate.$lte = new Date(filters.endDate);
        }
      
        if (filters.isEmergency !== undefined) {
            query.isEmergency = String(filters.isEmergency) === 'true';
        }
      
        return query;
    }
    static formatAppointmentResponse(doc) {
      const appointment = doc.toObject ? doc.toObject() : { ...doc };

      if (appointment.doctor && typeof appointment.doctor === 'object') {
          appointment.doctor = {
              id: appointment.doctor._id || appointment.doctor.id,
              firstName: appointment.doctor.firstName,
              lastName: appointment.doctor.lastName,
              fullName: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
              primarySpecialization: appointment.doctor.professionalInfo?.primarySpecialization
          };
      }

      if (appointment.patient && typeof appointment.patient === 'object') {
          const dob = appointment.patient.dateOfBirth;
          appointment.patient = {
              id: appointment.patient._id || appointment.patient.id,
              firstName: appointment.patient.firstName,
              lastName: appointment.patient.lastName,
              fullName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
              phone: appointment.patient.phone,
              address: appointment.patient.address,
              age: dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : null
          };
      }

      const fieldsToDelete = ['__v', 'isDeleted', 'deletedAt', 'deletedBy', 'createdAt', 'updatedAt'];
      fieldsToDelete.forEach(field => delete appointment[field]);

      return appointment;
    }
    static calculateAvailableSlots(shift, appointments, duration, isToday) {
        const slots = [];

        const toMins = (t) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        let startMins = toMins(shift.startTime);
        const endMins = toMins(shift.endTime);

        if (isToday) {
            const now = new Date();
            const currentMins = now.getHours() * 60 + now.getMinutes() + 30; 
            if (currentMins > startMins) startMins = currentMins;
        }

        const booked = appointments.map(a => ({
            s: toMins(a.scheduledTime.startTime),
            e: toMins(a.scheduledTime.endTime)
        }));

        for (let time = startMins; time + duration <= endMins; time += duration) {
            const isConflict = booked.some(b => (time < b.e && time + duration > b.s));

            if (!isConflict) {
                const h = Math.floor(time / 60).toString().padStart(2, '0');
                const m = (time % 60).toString().padStart(2, '0');
                slots.push(`${h}:${m}`);
            }
        }
        return slots;
    }
    static calculateRefundPercentage(scheduledDate, role) {
        const hoursDifference = (scheduledDate - new Date()) / (1000 * 60 * 60);
        let refundPercentage = 0;

        if (role === 'doctor') {
            refundPercentage = 1;
        } else if (hoursDifference >= 12) {
            refundPercentage = 1;
        } else if (hoursDifference < 12 && hoursDifference > 1) {
            refundPercentage = 0.5;
        }

        return refundPercentage;
    }
    static async handlePointDecay(userDocument, options = {}) {
        userDocument.blacklist.consecutiveSuccessiveAppointments += 1;

        if (userDocument.blacklist.consecutiveSuccessiveAppointments >= 3) {
          userDocument.blacklist.blacklistPoints = Math.max(0, userDocument.blacklist.blacklistPoints - 2);
        
          userDocument.blacklist.consecutiveSuccessiveAppointments = 0;
        }
    
        await userDocument.save(options);
    }

    static stringifyListForBrief(arr, fallback = 'None') {
        return (Array.isArray(arr) && arr.length
            ? arr.map(item => {
                if (typeof item === 'string') return item;
                if (item?.nameOfDisease || item?.name) return item.nameOfDisease || item.name;
                return Object.values(item || {}).filter(Boolean).join(' - ');
            }).filter(Boolean).join(', ')
            : fallback);
    }

    static formatChronicDiseases = (diseases) => {
        if (!diseases || diseases.length === 0) return 'None reported';
        return diseases.map(d => {
            let str = d.nameOfDisease;
            if (d.type) str += ` (${d.type})`;
            if (d.since) str += ` - since ${d.since}`;
            return str;
        }).join(', ');
    };

    static formatAllergies = (allergies) => {
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

    static formatMedications = (medications) => {
        if (!medications || medications.length === 0) return 'None';
        return medications.map(m => {
            let str = m.name || 'Unknown medication';
            if (m.dosage) str += ` (${m.dosage})`;
            if (m.reason) str += ` - for ${m.reason}`;
            return str;
        }).join(', ');
    };

    static formatPreviousSurgeries = (surgeries) => {
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

    static formatFamilyMedicalHistory = (history) => {
        if (!history || history.length === 0) return 'None reported';
        return history.map(h => {
            let str = `${h.nameOfFamilyMember || 'Unknown family member'}: ${h.nameOfDisease || 'Unknown disease'}`;
            if (h.age) str += ` (diagnosed at age ${h.age})`;
            return str;
        }).join('; ');
    };

    static formatLifestyle = (lifestyle) => {
        if (!lifestyle) return 'No lifestyle information';
        const { smokingStatus, alcoholConsumption, physicalActivityLevel, sleepQuality, averageSleepHours } = lifestyle;
        return `Smoking: ${smokingStatus || 'Unknown'}, Alcohol: ${alcoholConsumption || 'Unknown'}, Physical Activity: ${physicalActivityLevel || 'Unknown'}, Sleep Quality: ${sleepQuality || 'Unknown'}, Average Sleep Hours: ${averageSleepHours || 'Unknown'}`;
    }

    static formatMedicalRecordsForBrief(records = []) {
        if (!records.length) return 'None';

        return records.map((rec, idx) => {
            const date = rec.visitDate ? new Date(rec.visitDate).toISOString().split('T')[0] : 'Unknown date';
            const ai = rec.aiSummary || {};
            const meds = ai.prescription?.medications || [];
            const alerts = ai.alerts || {};

            const medsString = this.stringifyListForBrief(
                meds.map(m => {
                    const parts = [m.name, m.dose, m.frequency, m.duration].filter(Boolean);
                    return parts.join(' ').trim();
                }),
                'N/A'
            );

            const alertsString = this.stringifyListForBrief([
                ...(alerts.drug_interactions || []),
                ...(alerts.allergy_conflicts || []),
            ], 'None');

            return [
                `Record ${idx + 1} (${date})`,
                `Diagnosis: ${ai.diagnosis || 'N/A'}`,
                `Symptoms: ${this.stringifyListForBrief(ai.symptoms, 'N/A')}`,
                `Medications: ${medsString}`,
                `Follow up: ${ai.follow_up || 'N/A'}`,
                `Alerts: ${alertsString}`,
                `Doctor Notes: ${rec.doctorNotes || 'N/A'}`
            ].join('\n');
        }).join('\n\n');
    }

    static formatPatientForPrompt(patient) {
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

    static buildPatientBriefPrompt(patientProfile = {}, appointment = {}, medicalRecords = []) {
        const medProfile = patientProfile.medicalProfile || {};

        const fullName = `${patientProfile.firstName || ''} ${patientProfile.lastName || ''}`.trim() || 'Unknown';
        const { age, bmi } = this.formatPatientForPrompt(patientProfile);
        const gender = patientProfile.gender || 'N/A';

        const prompet = ` You are a medical assistant preparing a quick brief for a doctor before seeing a patient.

                === PATIENT PROFILE ===
                    
                Name: ${fullName} | Age: ${age} | Gender: ${gender || 'N/A'} | BMI: ${bmi}
                Blood Type: ${patientProfile.bloodType || 'N/A'}
                Chronic Diseases: ${this.formatChronicDiseases(medProfile.chronicDiseases)}
                Current Medications: ${this.formatMedications(medProfile.currentMedications)}
                Known Allergies: ${this.formatAllergies(medProfile.allergies)}
                Previous Surgeries: ${this.formatPreviousSurgeries(medProfile.previousSurgeries)}
                Family History: ${this.formatFamilyMedicalHistory(medProfile.familyMedicalHistory)}
                Lifestyle: ${this.formatLifestyle(medProfile.lifestyle)}
                    
                === CURRENT VISIT ===
                    
                Reason: ${appointment.patientProvidedInfo?.reasonForVisit || 'N/A'}
                Patient Notes: ${appointment.patientProvidedInfo?.patientNotes || 'N/A'}
                Visit Type: ${appointment.patientProvidedInfo?.visitType || 'N/A'}
                    
                === LAST 3 MEDICAL RECORDS ===
                ${this.formatMedicalRecordsForBrief(medicalRecords)}

                === INSTRUCTIONS ===
                1. Provide a concise overview of the patient's health status based on the profile and medical history.
                2. Highlight the main reason for the current visit and any key concerns the doctor should be aware of.
                3. List any medications that should be noted for this visit, especially if they relate to the current reason for visit.
                4. Summarize relevant medical history that may impact the current visit.
                5. Suggest areas the doctor should focus on during the consultation based on the provided information.
                6. Identify any alerts or risks (e.g., drug interactions, allergy risks) that the doctor should be cautious about.
                7. Return ONLY a valid JSON object. Do NOT include any explanation, text, or markdown. Do NOT wrap the JSON in backticks.

                Return ONLY a valid JSON object, no extra text:

                {
                    "patient_overview": "",
                    "current_visit_reason": "",
                    "key_concerns": [],
                    "medications_to_note": [],
                    "relevant_history": "",
                    "suggested_focus": "",
                    "alerts": {
                    "drug_interactions": [],
                    "allergy_risks": [],
                    "requires_attention": false
                }
                    
                Rules:
                - patient_overview: A brief summary of the patient's overall health status based on their profile and medical history.
                - current_visit_reason: A concise statement of the main reason for the patient's current visit.
                - key_concerns: A list of any critical concerns or red flags that the doctor should be aware of before the consultation.
                - medications_to_note: A list of current medications that are relevant to the patient's current visit reason or health status.
                - relevant_history: A summary of any past medical history that is particularly relevant to the current visit.
                - suggested_focus: Recommendations on what the doctor should focus on during the consultation based on the patient's profile and visit reason.
                - alerts: Any potential risks or alerts that the doctor should be cautious about, such as drug interactions or allergy risks.`;

        return prompet;
    };
    
    static parseJsonResponse = (response) => {
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
            prescription: { medications: [], lifestyle_advice: '' },
            alerts: { drug_interactions: [], allergy_conflicts: [], requires_immediate_attention: false },
            urgency_level: 'routine'
        };

        for (const [field, defaultValue] of Object.entries(requiredFields)) {
            if (!(field in parsed)) {
                parsed[field] = defaultValue;
            }
        }

        parsed.prescription = parsed.prescription || {};
        parsed.prescription.medications = parsed.prescription.medications || [];
        parsed.prescription.lifestyle_advice = parsed.prescription.lifestyle_advice || '';

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
}

module.exports = AppointmentHelpers;
