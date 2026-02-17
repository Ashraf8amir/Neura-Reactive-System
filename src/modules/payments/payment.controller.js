const asyncWrapper = require('../../shared/middlewares/asyncWrapper.middleware');
const { HTTP_STATUS_TEXT } = require('../../shared/constants/enums.js');
const ApiResponse = require('../../core/apiResponse');
const service = require('./payment.service');


/**
 * @desc    Handle Paymob callback (webhook)
 * @route   POST /api/v1/payments/callback
 * @access  Public (Paymob)
 */
exports.handlePaymobCallback = asyncWrapper(async (req, res) => {
    const callbackData = req.body.obj; 
    
    if (!callbackData) {
        return new ApiResponse(res, 400, HTTP_STATUS_TEXT.FAIL, 'Invalid payload');
    }

    await service.handlePaymobCallbackService(callbackData);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.OK,
        'Payment callback processed successfully'
    );
});
/**
 * @desc    Payment success redirect page
 * @route   GET /api/v1/payments/successs
 * @access  Public
 */
exports.paymentSuccess = asyncWrapper(async (req, res) => {
    const { success } = req.query;

    if (success === 'true') {
        return res.redirect(`${process.env.FRONTEND_URL}`);
    } else {
        return res.send('Payment failed. Please try again.');
        // return res.redirect(`${process.env.FRONTEND_URL}`);
    }
});
