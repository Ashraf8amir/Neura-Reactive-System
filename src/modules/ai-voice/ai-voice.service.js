const { AssemblyAI } = require('assemblyai');
const { Pinecone } = require('@pinecone-database/pinecone');
const axios = require('axios');
const config = require('../../config/config');
const Patient = require('../patients/patient.model');
const logger = require('../../core/logger.js');
const AppError = require('../../core/appError');
const { HTTP_STATUS_TEXT } = require('../../shared/constants/enums.js');
const { aiVoiceConstants } = require('./ai-voice.constant');
const {
    buildLlamaPrompt,
    parseJsonResponse,
    formatPatientForPrompt
} = require('./ai-voice.helper');

class AiVoiceService {
    constructor() {
        this.assemblyAI = null;
        this.pinecone = null;
        this.pineconeIndex = null;
        this.initializeClients();
    }

    initializeClients() {
        if (config.assemblyAiApiKey) {
            this.assemblyAI = new AssemblyAI({ apiKey: config.assemblyAiApiKey });
            logger.info('AssemblyAI client initialized');
        } else {
            logger.warn('AssemblyAI API key not configured');
        }

        if (config.pineconeApiKey && config.pineconeIndex) {
            try {
                this.pinecone = new Pinecone({ apiKey: config.pineconeApiKey });
                this.pineconeIndex = this.pinecone.index(config.pineconeIndex);
                logger.info('Pinecone client initialized', { index: config.pineconeIndex });
            } catch (error) {
                logger.error('Failed to initialize Pinecone', { error: error.message });
            }
        } else {
            logger.warn('Pinecone not configured - RAG features disabled');
        }
    }

    async transcribeAndSummarize(audioUrl, patientId, doctorId, appointmentId = null) {
        const transcript = await this.transcribeAudio(audioUrl);
        const patient = await this.getPatientData(patientId);
        const patientInfo = formatPatientForPrompt(patient);

        let previousVisits = '';
        try {
            previousVisits = await this.getPreviousVisits(patientId);
        } catch (error) {
            logger.warn('Pinecone query failed, continuing without history', {
                error: error.message,
                patientId
            });
        }

        const summary = await this.generateSummary(transcript, patientInfo, previousVisits);

        try {
            await this.saveVisitVector(patientId, summary, doctorId, appointmentId);
        } catch (error) {
            logger.warn('Failed to save visit vector', {
                error: error.message,
                patientId
            });
        }

        return { transcript, ...summary };
    }

    async transcribeAudio(audioUrl) {
        if (!this.assemblyAI) {
            throw new AppError(500, HTTP_STATUS_TEXT.ERROR, 'Speech-to-text service not configured');
        }

        try {
            const transcriptResponse = await this.assemblyAI.transcripts.transcribe({
                audio: audioUrl,
                speech_models: [aiVoiceConstants.ASSEMBLYAI_SPEECH_MODEL],
                language_code: aiVoiceConstants.ASSEMBLYAI_LANGUAGE
            });

            if (transcriptResponse.status === 'error') {
                logger.error('AssemblyAI transcription error', { error: transcriptResponse.error });
                throw new AppError(500, HTTP_STATUS_TEXT.ERROR, 'Failed to transcribe audio');
            }

            return transcriptResponse.text;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('AssemblyAI request failed', { error: error.message });
            throw new AppError(500, HTTP_STATUS_TEXT.ERROR, 'Failed to transcribe audio');
        }
    }

    async getPatientData(patientId) {
        const patient = await Patient.findById(patientId)
            .select('dateOfBirth bloodType medicalProfile height weight gender maritalStatus')
            .lean();

        if (!patient) {
            throw new AppError(404, HTTP_STATUS_TEXT.NOT_FOUND, 'Patient not found');
        }

        return patient;
    }

    async getPreviousVisits(patientId) {
        if (!this.pineconeIndex) return '';

        // Use searchRecords for integrated embedding index
        const results = await this.pineconeIndex
        .namespace(aiVoiceConstants.PINECONE_NAMESPACE)
        .searchRecords({
            query: {
                top_k: 3,
                inputs: {
                    text: 'Patient medical visit history'
                },
                filter: {
                    patientId: patientId.toString()
                }
            }
        });

        if (!results.result?.hits || results.result?.hits.length === 0) return '';

        return results.result?.hits
            .map((hit, index) => {
                const fields = hit.fields;
                const visitNum = index + 1;
                const date = fields.createdAt || 'Unknown date';
                const diagnosis = fields.diagnosis || 'N/A';
                const symptoms = fields.symptoms || 'N/A';
                const summary = fields.summary || 'N/A';
                return 'Visit ' + visitNum + ' (' + date + '):\nDiagnosis: ' + diagnosis + '\nSymptoms: ' + symptoms + '\nSummary: ' + summary;
            })
            .join('\n\n---\n\n');
    }

    async generateSummary(transcript, patientInfo, previousVisits, retryCount = 0, useFallback = false) {
        if (!config.groqApiKey) {
            throw new AppError(500, HTTP_STATUS_TEXT.ERROR, 'LLM service not configured');
        }

        const prompt = buildLlamaPrompt(patientInfo, previousVisits, transcript);

        try {
            const response = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: useFallback ? aiVoiceConstants.FALLBACK_MODEL : aiVoiceConstants.LLAMA_MODEL,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    top_p: 0.8,
                    max_tokens: 1500
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
                if (retryCount < aiVoiceConstants.LLAMA_MAX_RETRIES) {
                    logger.warn('LLaMA JSON parse failed, retrying...', { retryCount, error: parseError.message });
                    return this.generateSummary(transcript, patientInfo, previousVisits, retryCount + 1, useFallback);
                }
                throw new AppError(500, HTTP_STATUS_TEXT.ERROR, 'Failed to parse AI response');
            }
        } catch (error) {
            if (error instanceof AppError) throw error;
            
            const status = error.response?.status;
            const isTransientError = [502, 503, 504].includes(status);
            
            if (isTransientError && retryCount < aiVoiceConstants.LLAMA_TRANSIENT_RETRIES) {
                const delay = Math.pow(2, retryCount) * 1000;
                logger.warn('GROQ transient error, retrying...', { 
                    status, 
                    retryCount, 
                    delayMs: delay 
                });
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.generateSummary(transcript, patientInfo, previousVisits, retryCount + 1, useFallback);
            }
            
            logger.error('GROQ API request failed', { error: error.message, status, model: useFallback ? aiVoiceConstants.FALLBACK_MODEL : aiVoiceConstants.LLAMA_MODEL });
            
            if (!useFallback && isTransientError) {
                logger.warn('Primary model unavailable, trying fallback model');
                return this.generateSummary(transcript, patientInfo, previousVisits, 0, true);
            }
            
            throw new AppError(500, HTTP_STATUS_TEXT.ERROR, 'Failed to generate summary from AI');
        }
    }

    async saveVisitVector(patientId, summary, doctorId, appointmentId = null) {
        if (!this.pineconeIndex) {
            logger.debug('Pinecone not configured, skipping vector save');
            return;
        }

        if (!patientId || !summary) {
            logger.warn('Invalid data for Pinecone upsert', { patientId: !!patientId, summary: !!summary });
            return;
        }

        const vectorId = 'visit_' + String(patientId) + '_' + Date.now();
        const embeddingText = [
            'Patient visit summary:',
            summary.summary || '',
            'Diagnosis: ' + (summary.diagnosis || 'None'),
            'Symptoms: ' + (Array.isArray(summary.symptoms) ? summary.symptoms.join(', ') : ''),
            'Treatment: ' + (summary.treatment_plan || 'None'),
            'Follow-up: ' + (summary.follow_up || 'None'),
            'Alerts: ' + (JSON.stringify(summary.alerts) || '{}'),
            'Urgency: ' + (summary.urgency_level || 'routine')
        ].join(' ');

        try {
            const recordToUpsert = {
                _id: vectorId,
                text: embeddingText,
                patientId: String(patientId),
                doctorId: doctorId ? String(doctorId) : 'unknown',
                appointmentId: appointmentId ? String(appointmentId) : '',
                summary: summary.summary || '',
                diagnosis: summary.diagnosis || '',
                symptoms: Array.isArray(summary.symptoms) ? summary.symptoms.join(', ') : '',
                treatment_plan: typeof summary.treatment_plan === 'object' ? JSON.stringify(summary.treatment_plan) : (summary.treatment_plan || ''),
                follow_up: typeof summary.follow_up === 'object' ? JSON.stringify(summary.follow_up) : (summary.follow_up || ''),
                alerts: JSON.stringify(summary.alerts || {}),
                urgency_level: summary.urgency_level || 'routine',
                createdAt: new Date().toISOString()
            };
            
            await this.pineconeIndex
                .namespace(aiVoiceConstants.PINECONE_NAMESPACE)
                .upsertRecords({ records: [recordToUpsert] });

            logger.info('Visit vector saved to Pinecone', { vectorId: vectorId, patientId: patientId, doctorId: doctorId });
        } catch (error) {
            logger.error('Failed to upsert to Pinecone', { error: error.message });
            throw error;
        }
    }
}

module.exports = new AiVoiceService();