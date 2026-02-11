const express = require('express');
const jobController = require('./job.controller');


const router = express.Router();

router.post('/cancel/unconfirmed-appointments', jobController.cancelUnconfirmedAppointments);

module.exports = router;