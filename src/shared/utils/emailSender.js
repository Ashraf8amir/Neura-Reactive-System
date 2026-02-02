const resend = require('../../config/resend.js');
const AppError = require('../../core/appError.js');
const { HTTP_STATUS_TEXT } = require('../constants/enums.js');
const logger = require('../../core/logger.js');

const sendMail = async (to, subject, htmlContent, text) => {
    const mailOptions = {
        from: `"Sahtak" <onboarding@resend.dev>`,
        to,
        subject,
        html: htmlContent,
        text
    };

    try {
        await resend.emails.send(mailOptions);
        logger.info('Email sent successfully');
    } catch (error) {
        logger.error('Error sending email:', error);
        throw new AppError(500, HTTP_STATUS_TEXT.FAIL, 'Error sending email');
    }
};

module.exports = sendMail;