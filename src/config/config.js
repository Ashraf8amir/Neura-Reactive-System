require('dotenv').config();

const config = {
    // Server Settings
    PORT: Number(process.env.PORT) || 4000,
    mongoURL: process.env.MONGO_URL,
    nodeEnv: process.env.NODE_ENV,

    // Token Settings
    jwtSecret: process.env.JWT_SECRET,
    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    refreshTokenLength: Number(process.env.REFRESH_TOKEN_LENGTH),
    resetTokenLength: Number(process.env.RESET_TOKEN_LENGTH),

    // Bcrypt Settings
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS),

    // Resend Email Service
    resendApiKey: process.env.RESEND_API_KEY,

    // Application URLs
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',

    // Email Settings
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,

    // Admin Email Credentials
    adminEmail: process.env.ADMIN_EMAIL,
    adminPassword: process.env.ADMIN_PASSWORD,

    // Cloudinary Settings
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET
};

module.exports = config;