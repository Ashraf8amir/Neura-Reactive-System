exports.aiVoiceConstants = Object.freeze({
    ALLOWED_AUDIO_FORMATS: ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/m4a'],
    MAX_AUDIO_SIZE_MB: 25,
    ASSEMBLYAI_LANGUAGE: 'ar',
    ASSEMBLYAI_SPEECH_MODEL: 'universal-2',  
    PINECONE_NAMESPACE: 'medical-visits',
    LLAMA_MODEL: 'llama-3.3-70b-versatile',
    FALLBACK_MODEL: 'llama-3.1-8b-instant',
    LLAMA_MAX_RETRIES: 2,
    LLAMA_TRANSIENT_RETRIES: 3,
    PINECONE_TOP_K: 3,
    ERROR_MESSAGES: {
        INVALID_AUDIO_FORMAT: 'Invalid audio format. Allowed: wav, mp3, webm, ogg, m4a',
        PINECONE_ERROR: 'Vector database operation failed'
    }
});