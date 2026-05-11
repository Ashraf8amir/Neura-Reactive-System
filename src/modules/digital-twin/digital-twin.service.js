const axios = require('axios');
const config = require('../../config/config');
const logger = require('../../core/logger');
const AppError = require('../../core/appError');
const { HTTP_STATUS_TEXT } = require('../../shared/constants/enums');
const Patient = require('../patients/patient.model');
const DigitalTwin = require('./digitalTwin.model');
const { digitalTwinConstants } = require('./digitalTwin.constant');
const {
    buildInitialDigitalTwinPrompt,
    buildDigitalTwinUpdatePrompt,
    buildWhatIfSimulationPrompt,
    parseJsonResponse,
    validateDTUpdateJSON,
    flattenObjectForSet
} = require('./digital-twin.helper');

class DigitalTwinService {
    async getMyTwin(patientId) {
        return this.getOrCreateDigitalTwin(patientId);
    }

    async getPatientTwin(patientId) {
        return this.getOrCreateDigitalTwin(patientId);
    }

    async simulateWhatIf(patientId, scenario) {
        const [patient, twin] = await Promise.all([
            Patient.findById(patientId)
                .select('dateOfBirth gender bloodType medicalProfile')
                .lean(),
            DigitalTwin.findOne({ patientId })
                .select('currentState.overallHealthScore currentState.affectedOrgans riskScores')
                .lean()
        ]);

        if (!patient) {
            throw new AppError(404, HTTP_STATUS_TEXT.NOT_FOUND, 'Patient not found');
        }

        if (!twin) {
            throw new AppError(404, HTTP_STATUS_TEXT.NOT_FOUND, 'Digital Twin not found');
        }

        const patientProfile = this.formatPatientProfileForPrompt(patient);
        const prompt = buildWhatIfSimulationPrompt(patientProfile, twin, scenario);
        return this.simulateWhatIfWithAI(prompt);
    }

    async getOrCreateDigitalTwin(patientId) {
        await this.migrateLegacyBmiShape(patientId);
        const existingTwin = await DigitalTwin.findOne({ patientId });
        if (existingTwin) {
            return existingTwin;
        }

        return this.createInitialDigitalTwin(patientId);
    }

    async createInitialDigitalTwin(patientId, retryCount = 0, useFallback = false) {
        await this.migrateLegacyBmiShape(patientId);
        const existingTwin = await DigitalTwin.findOne({ patientId });
        if (existingTwin) {
            return existingTwin;
        }

        const patient = await Patient.findById(patientId)
            .select('dateOfBirth gender bloodType medicalProfile height weight')
            .lean();

        if (!patient) {
            throw new AppError(404, HTTP_STATUS_TEXT.NOT_FOUND, 'Patient not found');
        }

        const patientProfile = this.formatPatientProfileForPrompt(patient);
        const prompt = buildInitialDigitalTwinPrompt(patientProfile);
        const initialTwinPayload = await this.generateDigitalTwinFromAI(prompt, retryCount, useFallback);
        const normalizedInitialPayload = this.normalizeAIPayload(initialTwinPayload);
        validateDTUpdateJSON(normalizedInitialPayload, { requireFull: true });

        const createPayload = this.buildInitialTwinDocument(patientId, patient, normalizedInitialPayload);

        try {
            return await DigitalTwin.create(createPayload);
        } catch (error) {
            if (error.code === 11000) {
                return DigitalTwin.findOne({ patientId });
            }
            throw error;
        }
    }

    async updateDigitalTwinFromMedicalRecord(record, retryCount = 0, useFallback = false) {
        await this.migrateLegacyBmiShape(record.patientId);
        let twin = await DigitalTwin.findOne({ patientId: record.patientId });

        if (!twin) {
            twin = await this.createInitialDigitalTwin(record.patientId);
        }

        const prompt = buildDigitalTwinUpdatePrompt(record.aiSummary, twin.toObject());
        const updatePayload = await this.generateDigitalTwinFromAI(prompt, retryCount, useFallback);
        const normalizedAiPayload = this.normalizeAIPayload(updatePayload);
        validateDTUpdateJSON(normalizedAiPayload);

        const normalizedUpdate = this.normalizeUpdatePayload(normalizedAiPayload);
        const flattenedUpdate = flattenObjectForSet(normalizedUpdate);

        if (Object.keys(flattenedUpdate).length === 0) {
            return twin;
        }

        const now = new Date();
        flattenedUpdate['currentState.lastUpdated'] = now;
        flattenedUpdate.lastSyncedWithPatient = now;

        if (normalizedUpdate.currentState?.overallHealthScore) {
            flattenedUpdate['currentState.overallHealthScore.calculatedAt'] = now;
        }
        if (normalizedUpdate.riskScores?.cardiovascularRisk) {
            flattenedUpdate['riskScores.cardiovascularRisk.calculatedAt'] = now;
        }
        if (normalizedUpdate.riskScores?.diabetesRisk) {
            flattenedUpdate['riskScores.diabetesRisk.calculatedAt'] = now;
        }
        if (normalizedUpdate.riskScores?.strokeRisk) {
            flattenedUpdate['riskScores.strokeRisk.calculatedAt'] = now;
        }

        const updatedTwin = await DigitalTwin.findOneAndUpdate(
            { patientId: record.patientId },
            { $set: flattenedUpdate },
            { new: true }
        );

        if (!updatedTwin) {
            throw new AppError(404, HTTP_STATUS_TEXT.NOT_FOUND, 'Digital Twin not found');
        }
        
        return updatedTwin;
    }

    async generateDigitalTwinFromAI(prompt, retryCount = 0, useFallback = false) {
        if (!config.groqApiKey) {
            throw new AppError(500, HTTP_STATUS_TEXT.ERROR, 'LLM service not configured');
        }

        try {
            const response = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: useFallback ? digitalTwinConstants.FALLBACK_MODEL : digitalTwinConstants.LLAMA_MODEL,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    top_p: 0.8,
                    max_tokens: 800
                },
                {
                    headers: {
                        'Authorization': 'Bearer ' + config.groqApiKey,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': config.backendUrl,
                        'X-Title': 'Sahtak Healthcare Platform'
                    },
                    timeout: 60000
                }
            );

            const content = response.data.choices[0].message.content;
            try {
                return parseJsonResponse(content);
            } catch (parseError) {
                if (retryCount < digitalTwinConstants.LLAMA_MAX_RETRIES) {
                    logger.warn('LLaMA JSON parse failed, retrying...', { retryCount, error: parseError.message });
                    return this.generateDigitalTwinFromAI(prompt, retryCount + 1, useFallback);
                }
                throw new AppError(500, HTTP_STATUS_TEXT.ERROR, 'Failed to parse AI response');
            }
        } catch (error) {
            if (error instanceof AppError) throw error;

            const status = error.response?.status;
            const isTransientError = [502, 503, 504].includes(status);

            if (isTransientError && retryCount < digitalTwinConstants.LLAMA_TRANSIENT_RETRIES) {
                const delay = Math.pow(2, retryCount) * 1000;
                logger.warn('GROQ transient error, retrying...', {
                    status,
                    retryCount,
                    delayMs: delay
                });
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.generateDigitalTwinFromAI(prompt, retryCount + 1, useFallback);
            }

            logger.error('GROQ API request failed', {
                error: error.message,
                status,
                model: useFallback ? digitalTwinConstants.FALLBACK_MODEL : digitalTwinConstants.LLAMA_MODEL
            });

            if (!useFallback && isTransientError) {
                logger.warn('Primary model unavailable, trying fallback model');
                return this.generateDigitalTwinFromAI(prompt, 0, true);
            }

            throw new AppError(500, HTTP_STATUS_TEXT.ERROR, 'Failed to generate digital twin from AI');
        }
    }

    async simulateWhatIfWithAI(prompt, retryCount = 0, useFallback = false) {
        if (!config.groqApiKey) {
            throw new AppError(500, HTTP_STATUS_TEXT.ERROR, 'LLM service not configured');
        }

        try {
            const response = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: useFallback ? digitalTwinConstants.FALLBACK_MODEL : digitalTwinConstants.LLAMA_MODEL,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    top_p: 0.8,
                    max_tokens: 1200
                },
                {
                    headers: {
                        'Authorization': 'Bearer ' + config.groqApiKey,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': config.backendUrl,
                        'X-Title': 'Sahtak Healthcare Platform'
                    },
                    timeout: 60000
                }
            );

            const content = response.data.choices[0].message.content;
            try {
                return parseJsonResponse(content);
            } catch (parseError) {
                if (retryCount < digitalTwinConstants.LLAMA_MAX_RETRIES) {
                    logger.warn('LLaMA JSON parse failed, retrying...', { retryCount, error: parseError.message });
                    return this.simulateWhatIfWithAI(prompt, retryCount + 1, useFallback);
                }
                throw new AppError(502, HTTP_STATUS_TEXT.ERROR, 'Failed to parse AI response');
            }
        } catch (error) {
            if (error instanceof AppError) throw error;

            const status = error.response?.status;
            const isTransientError = [502, 503, 504].includes(status);

            if (isTransientError && retryCount < digitalTwinConstants.LLAMA_TRANSIENT_RETRIES) {
                const delay = Math.pow(2, retryCount) * 1000;
                logger.warn('GROQ transient error, retrying...', {
                    status,
                    retryCount,
                    delayMs: delay
                });
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.simulateWhatIfWithAI(prompt, retryCount + 1, useFallback);
            }

            logger.error('GROQ API request failed', {
                error: error.message,
                status,
                model: useFallback ? digitalTwinConstants.FALLBACK_MODEL : digitalTwinConstants.LLAMA_MODEL
            });

            if (!useFallback && isTransientError) {
                logger.warn('Primary model unavailable, trying fallback model');
                return this.simulateWhatIfWithAI(prompt, 0, true);
            }

            throw new AppError(502, HTTP_STATUS_TEXT.ERROR, 'Failed to generate what-if simulation from AI');
        }
    }

    formatPatientProfileForPrompt(patient) {
        const medicalProfile = patient.medicalProfile || {};
        const lifestyle = medicalProfile.lifestyle || {};
        
        const calculateAge = () => {
            if (!patient.dateOfBirth) return 'unknown';
            const birthDate = new Date(patient.dateOfBirth);
            const now = new Date();
            const age = Math.floor((now - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
            return Number.isFinite(age) ? age : 'unknown';
        };

        const calculateBmi = () => {
            const weight = Number(patient.weight);
            const height = Number(patient.height);

            if (!Number.isFinite(weight) || !Number.isFinite(height) || height <= 0) {
                return null;
            }

            const bmi = weight / (height / 100) ** 2;
            return Number.isFinite(bmi) ? Number(bmi.toFixed(1)) : null;
        };

        return {
            age: calculateAge(),
            gender: patient.gender || 'unknown',
            bloodType: patient.bloodType || 'unknown',
            weight: patient.weight ?? 'unknown',
            height: patient.height ?? 'unknown',
            bmi: calculateBmi(),
            smoking: lifestyle.smokingStatus || 'unknown',
            alcohol: lifestyle.alcoholConsumption || 'unknown',
            exercise: lifestyle.physicalActivity || 'unknown',
            diet: lifestyle.dietType || 'unknown',
            sleepHours: lifestyle.averageSleepHours ?? 'unknown',
            stressLevel: lifestyle.sleepQuality || 'unknown',
            chronicDiseases: (medicalProfile.chronicDiseases || []).map( item => {
                const name = item.nameOfDisease || 'Unknown disease';
                const type = item.type ? ` (${item.type})` : '';
                const since = item.since ? ` - since ${item.since}` : '';
                return `${name}: ${type}${since}`;
            }).filter(Boolean),
            currentMedications: (medicalProfile.currentMedications || []).map(item => {
                const name = item.name || 'Unknown medication';
                const dosage = item.dosage ? ` (${item.dosage})` : '';
                const reason = item.reason ? ` - ${item.reason}` : '';
                return `${name}: ${dosage}${reason}`;
            }).filter(Boolean),
            allergies: (medicalProfile.allergies || []).map(item => {
                const name = item.nameOfAllergy || 'Unknown allergy';
                const severity = item.types?.includes('severity') ? ` (${item.types.severity})` : '';
                const reaction = item.types?.includes('reaction') ? ` - ${item.types.reaction}` : '';
                return `${name}: ${severity}${reaction}`;
            }).filter(Boolean),
            previousSurgeries: (medicalProfile.previousSurgeries || []).map(item => {
                const name = item.nameOfSurgery || 'Unknown surgery';
                const date = item.date ? ` on ${new Date(item.date).toLocaleDateString()}` : '';
                const hospital = item.hospital ? ` at ${item.hospital}` : '';
                const doctor = item.doctor ? ` by Dr. ${item.doctor}` : '';
                return `${name}: ${date}${hospital}${doctor}`;
            }).filter(Boolean),
            familyMedicalHistory: (medicalProfile.familyMedicalHistory || []).map(item => {
                return `${item.nameOfFamilyMember || 'Family member'}: ${item.nameOfDisease || 'Unknown disease'}`;
            }).filter(Boolean)
        };
    }

    buildInitialTwinDocument(patientId, patient, payload) {
        const now = new Date();
        const calculateBMI = () => {
            const weight = patient.weight;
            const height = patient.height;
            if (typeof weight !== 'number' || typeof height !== 'number') {
                return null;
            }
            const heightInMeters = height / 100;
            return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
        };

        const vitals = {};
        const bmiValue = calculateBMI();
        if (typeof patient.weight === 'number') {
            vitals.weight = {
                value: patient.weight,
                trend: digitalTwinConstants.weightTrend.UNKNOWN
            };
        }
        if (typeof patient.height === 'number') {
            vitals.height = patient.height;
        }
        if (bmiValue !== null) {
            vitals.bmi = bmiValue;
        }

        return {
            patientId,
            currentState: {
                overallHealthScore: {
                    score: payload.currentState?.overallHealthScore?.score ?? 0,
                    category: payload.currentState?.overallHealthScore?.category ?? digitalTwinConstants.categoryHealthScore.FAIR,
                    calculatedAt: now
                },
                vitals,
                affectedOrgans: payload.currentState?.affectedOrgans || [],
                lastUpdated: now
            },
            riskScores: {
                cardiovascularRisk: {
                    score: payload.riskScores?.cardiovascularRisk?.score ?? 0,
                    level: payload.riskScores?.cardiovascularRisk?.level ?? digitalTwinConstants.riskScore.LOW,
                    factors: payload.riskScores?.cardiovascularRisk?.factors || [],
                    calculatedAt: now
                },
                diabetesRisk: {
                    score: payload.riskScores?.diabetesRisk?.score ?? 0,
                    level: payload.riskScores?.diabetesRisk?.level ?? digitalTwinConstants.riskScore.LOW,
                    factors: payload.riskScores?.diabetesRisk?.factors || [],
                    calculatedAt: now
                },
                strokeRisk: {
                    score: payload.riskScores?.strokeRisk?.score ?? 0,
                    level: payload.riskScores?.strokeRisk?.level ?? digitalTwinConstants.riskScore.LOW,
                    calculatedAt: now
                }
            },
            riskPredictions: (payload.riskPredictions || []).map(item => ({
                ...item,
                createdAt: now
            })),
            recommendations: (payload.recommendations || []).map(item => ({
                ...item,
                generatedAt: now
            })),
            alerts: (payload.alerts || []).map(item => ({
                ...item,
                createdAt: now
            })),
            isActive: true,
            lastSyncedWithPatient: now
        };
    }

    async migrateLegacyBmiShape(patientId) {
        const legacyTwin = await DigitalTwin.findOne({
            patientId,
            'currentState.vitals.bmi.value': { $exists: true }
        })
            .select('currentState.vitals.bmi.value')
            .lean();

        const legacyBmiValue = legacyTwin?.currentState?.vitals?.bmi?.value;
        if (typeof legacyBmiValue !== 'number') {
            return;
        }

        await DigitalTwin.updateOne(
            { patientId },
            {
                $set: {
                    'currentState.vitals.bmi': legacyBmiValue
                }
            }
        );
    }

    normalizeAIPayload(payload) {
        const normalized = { ...payload };

        if (normalized.currentState && Array.isArray(normalized.currentState.affectedOrgans)) {
            normalized.currentState = {
                ...normalized.currentState,
                affectedOrgans: normalized.currentState.affectedOrgans.map((organEntry) => {
                    if (!organEntry || typeof organEntry !== 'object') {
                        return organEntry;
                    }

                    return {
                        ...organEntry,
                        organ: this.normalizeOrganAlias(organEntry.organ)
                    };
                })
            };
        }

        return normalized;
    }

    normalizeOrganAlias(organ) {
        if (typeof organ !== 'string') {
            return organ;
        }

        const normalizedOrgan = organ.trim();
        const organAliases = {
            lungs: digitalTwinConstants.organTypes.LUNG
        };

        return organAliases[normalizedOrgan.toLowerCase()] || normalizedOrgan;
    }

    normalizeUpdatePayload(payload) {
        const normalized = this.normalizeAIPayload(payload);
        const now = new Date();

        if (Array.isArray(normalized.riskPredictions)) {
            normalized.riskPredictions = normalized.riskPredictions.map(item => ({
                ...item,
                createdAt: item.createdAt || now
            }));
        }

        if (Array.isArray(normalized.recommendations)) {
            normalized.recommendations = normalized.recommendations.map(item => ({
                ...item,
                generatedAt: item.generatedAt || now
            }));
        }

        if (Array.isArray(normalized.alerts)) {
            normalized.alerts = normalized.alerts.map(item => ({
                ...item,
                createdAt: item.createdAt || now
            }));
        }

        return normalized;
    }
}

module.exports = new DigitalTwinService();