const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const patientRoutes = require('../modules/patients/patient.route');
const rateLimiter = require('../shared/middlewares/rateLimiter.middleware.js').globalLimiter;

const router = express.Router();

router.use(rateLimiter);
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);


module.exports = router;