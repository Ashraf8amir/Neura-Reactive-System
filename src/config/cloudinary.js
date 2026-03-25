const cloudinary = require('cloudinary').v2;
const config = require('./config');


cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret
});

exports.uploadDocumentToCloudinary = async (fileBuffer, fileName, mimetype, options = {}) => {
    try {
        const isImage = mimetype.startsWith('image/');
        const isPdf = mimetype === 'application/pdf';

        let resourceType = 'raw';
        let uploadOptions = {
            folder: options.folder || 'documents',
            public_id: options.publicId || `${Date.now()}_${fileName.split('.')[0]}`,
        };

        if (isImage) {
            resourceType = 'image';
            uploadOptions.transformation = options.transformation || [
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ];
        } else if (isPdf) {
            uploadOptions.format = 'pdf';
            uploadOptions.public_id = uploadOptions.public_id.replace(/\.pdf$/i, '');
        }

        uploadOptions.resource_type = resourceType;

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                uploadOptions,
                (error, result) => {
                    if (error) {
                        reject(new Error(`Cloudinary Error: ${error.message}`));
                    } else {
                        resolve({
                            cloudinaryId: result.public_id,
                            filename: fileName,
                            url: result.secure_url,
                            format: result.format,
                            size: result.bytes,
                            resourceType: resourceType,
                            ...(result.width && { width: result.width }),
                            ...(result.height && { height: result.height }),
                            ...(result.pages && { pages: result.pages })
                        });
                    }
                }
            );

            uploadStream.end(fileBuffer);
        });
    } catch (error) {
        throw new Error(`Failed to upload document: ${error.message}`);
    }
};
exports.deleteFromCloudinary = async (publicId, resourceType = '') => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        return result.result === 'ok';
    } catch (error) {
        console.error('Failed to delete from Cloudinary:', error);
        return false;
    }
};
exports.extractPublicId = (url) => {
    if (!url || !url.includes('cloudinary.com')) return null;
    
    try {
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;
        
        const pathPart = parts[1];
        const withoutVersion = pathPart.replace(/^v\d+\//, '');
        const publicId = withoutVersion.split('.')[0];
        
        return publicId;
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return null;
    }
};
exports.getResourceType = (url) => {
    if (!url || !url.includes('cloudinary.com')) return 'image';
    
    try {
        const parts = url.split('/upload/');
        if (parts.length < 2) return 'image';
        const pathPart = parts[1];
        const resourceType = pathPart.split('/')[0];
        return resourceType || 'image';
    } catch (error) {
        console.error('Error determining resource type:', error);
        return 'image';
    }
};
exports.uploadAudioToCloudinary = async (fileBuffer, fileName, mimetype) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'ai-voice-recordings',
                resource_type: 'video',  // Cloudinary uses 'video' for audio
                public_id: `${Date.now()}_${fileName.split('.')[0]}`,
            },
            (error, result) => {
                if (error) reject(new Error(`Cloudinary Error: ${error.message}`));
                else resolve(result.secure_url);
            }
        );
        uploadStream.end(fileBuffer);
    });
};