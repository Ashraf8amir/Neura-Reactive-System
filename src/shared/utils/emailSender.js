const resend = require('../../config/resend.js');
const AppError = require('../../core/appError.js');
const httpStatus = require('../../core/httpStatus.js');
const logger = require('../../core/logger.js');


const sendMail = async (to, subject, htmlContent, text) => {
    const mailOptions = {
        from: `"Sahtak" <onboarding@resend.dev>`,
        to: to,
        subject: subject,
        html: htmlContent,
        Text: text
    };

    try {
        await resend.emails.send(mailOptions);
        logger.info('Email sent successfully');
    } catch (error) {
        logger.error('Error sending email:', error);
        throw new AppError(500, httpStatus.FAIL, 'Error sending email');
    }
};

module.exports = sendMail;