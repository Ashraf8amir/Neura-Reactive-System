const asyncWrapper = require('../../shared/middlewares/asyncWrapper.middleware');
const { HTTP_STATUS_TEXT } = require('../../shared/constants/enums.js');
const ApiResponse = require('../../core/apiResponse');
const AppError = require('../../core/appError');
const aiVoiceService = require('./ai-voice.service');
const logger = require('../../core/logger.js');
const { uploadAudioToCloudinary } = require('../../config/cloudinary.js');

/**
 * @desc    Transcribe Arabic medical audio and generate structured summary
 * @route   POST /api/v1/ai-voice/transcribe
 * @access  Private (Doctors only)
 * @bodyParams patientId, appointmentId (optional)
 * @file    audio (multipart/form-data)
 */
exports.transcribeAudio = asyncWrapper(async (req, res) => {
    const { patientId, appointmentId } = req.body;
    const doctorId = req.user.id || req.user._id;

    if (!req.file) {
        throw new AppError(400, HTTP_STATUS_TEXT.FAIL, 'Audio file is required');
    }

    logger.info('Processing audio transcription request', {
        doctorId: doctorId,
        patientId,
        fileName: req.file.originalname,
        fileSize: req.file.size
    });

    let audioUrl;
    try {
        audioUrl = await uploadAudioToCloudinary(req.file.buffer, req.file.originalname, req.file.mimetype);

    } catch (error) {
        logger.error('Cloudinary upload failed', { error: error.message });
        throw new AppError(500, HTTP_STATUS_TEXT.ERROR, 'Failed to upload audio file');
    }

    const result = await aiVoiceService.transcribeAndSummarize(
        audioUrl,
        patientId,
        doctorId,
        appointmentId
    );

    logger.info('Audio transcription completed successfully', {
        doctorId: doctorId,
        patientId,
        hasTranscript: !!result.transcript
    });

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Audio transcribed and summarized successfully',
        result
    );
});
