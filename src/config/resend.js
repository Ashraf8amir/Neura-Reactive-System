const { Resend } = require('resend'); 
const config = require('./config');


const resend = new Resend(config.resendApiKey); 

module.exports = resend;