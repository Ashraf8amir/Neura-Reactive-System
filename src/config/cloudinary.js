const cloudinary = require('cloudinary').v2;
const config = require('./config');


cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret
});

// const uploadToCloudinary = async (fileBuffer, fileName, options = {}) => {
//     try {
//         return new Promise((resolve, reject) => {
//             const uploadStream = cloudinary.uploader.upload_stream(
//                 {
//                     folder: 'profile_images',
//                     public_id: `${Date.now()}_${fileName.split('.')[0]}`,
//                     resource_type: 'image',
//                     transformation: options.transformation || [
//                         { width: 500, height: 500, crop: 'fill', gravity: 'face' },
//                         { quality: 'auto' },
//                         { fetch_format: 'auto' }
//                     ]
//                 },
//                 (error, result) => {
//                     if (error) {
//                         reject(new Error(`Cloudinary Error: ${error.message}`));
//                     } else {
//                         resolve({
//                             cloudinaryId: result.public_id,
//                             filename: fileName,
//                             url: result.secure_url,
//                             width: result.width,
//                             height: result.height,
//                             format: result.format,
//                             size: result.bytes
//                         });
//                     }
//                 }
//             );

//             uploadStream.end(fileBuffer);
//         });
//     } catch (error) {
//         throw new Error(`Failed to upload image: ${error.message}`);
//     }
// };
// const uploadDocumentToCloudinary = async (fileBuffer, fileName, folder = '') => {
//     try {
//         return new Promise((resolve, reject) => {
//             const uploadStream = cloudinary.uploader.upload_stream(
//                 {
//                     folder: folder,
//                     public_id: `${Date.now()}_${fileName.split('.')[0]}`,
//                     resource_type: 'image' 
//                 },
//                 (error, result) => {
//                     if (error) {
//                         reject(new Error(`Cloudinary Error: ${error.message}`));
//                     } else {
//                         resolve({
//                             publicId: result.public_id,
//                             url: result.secure_url,
//                             format: result.format
//                         });
//                     }
//                 }
//             );

//             uploadStream.end(fileBuffer);
//         });
//     } catch (error) {
//         throw new Error(`Failed to upload document: ${error.message}`);
//     }
// };
exports.uploadDocumentToCloudinary = async (fileBuffer, fileName, mimetype, options = {}) => {
    try {
        const isImage = mimetype.startsWith('image/');

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