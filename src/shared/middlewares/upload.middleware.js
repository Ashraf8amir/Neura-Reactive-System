const multer = require('multer');
const AppError = require('../../core/appError.js');
const { HTTP_STATUS_TEXT } = require('../constants/enums.js');

const storage = multer.memoryStorage();

const imageFilter  = (req, file, cb) => {
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype  = file.mimetype.startsWith('image/');
    const extname = allowedImageTypes.test(file.originalname.toLowerCase());

    mimetype && extname ? 
    cb(null, true) : 
    cb(new AppError(400, HTTP_STATUS_TEXT.FAIL, 'Only image files are allowed'), false);
};
const pdfFilter = (req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf';

    isPdf ? 
    cb(null, true) : 
    cb(new AppError(400, HTTP_STATUS_TEXT.FAIL, 'Only PDF files are allowed'), false);
};
const imageAndPdfFilter = (req, file, cb) => {  
    const isImage = file.mimetype.startsWith('image/');
    const isPdf = file.mimetype === 'application/pdf';

    isImage || isPdf ? 
    cb(null, true) : 
    cb(new AppError(400, HTTP_STATUS_TEXT.FAIL, 'Only image and PDF files are allowed'), false);
};
const audioFilter = (req, file, cb) => {
    const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/m4a', 'audio/x-m4a'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError(400, HTTP_STATUS_TEXT.FAIL, 'Only audio files are allowed'), false);
    }
};

const uploadImage = multer({
    storage: storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});
const uploadPDF = multer({
    storage: storage,
    fileFilter: pdfFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 
    }
});
const uploadImageOrPDF = multer({
    storage: storage,
    fileFilter: imageAndPdfFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 
    }
});
const uploadAudio = multer({
    storage: storage,
    fileFilter: audioFilter,
    limits: { fileSize: 25 * 1024 * 1024 }  // 25MB
});

module.exports = {
    uploadProfileImage: uploadImage.single('profileImage'),
    uploadPDF: uploadPDF.single('document'),
    uploadImageOrPDF: uploadImageOrPDF.single('file'),
    uploadVisitAttachments: uploadImageOrPDF.array('files', 10),
    
    uploadMultipleImages: uploadImage.array('images', 5),
    uploadMultiplePDFs: uploadPDF.array('documents', 10), 
    
    uploadMixed: uploadImageOrPDF.fields([
        { name: 'profileImage', maxCount: 1 },
        { name: 'documents', maxCount: 5 }
    ]),

    uploadAudioFile: uploadAudio.single('audio')
};