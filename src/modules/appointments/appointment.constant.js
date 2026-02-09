exports.appointmentConstants = Object.freeze({
    APPOINTMENT_STATUSES: {
        PENDING: 'pending',
        CONFIRMED: 'confirmed',
        CHECKEDIN: 'checkedIn',
        INPROGRESS: 'inProgress',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
        RESCHEDULED: 'rescheduled'
    },
    APPOINTMENT_TYPES: {
        IN_PERSON: 'inPerson',
        TELEMEDICINE: 'telemedicine',
        EMERGENCY: 'emergency',
        CONSULTATION: 'consultation'
    },
    VISIT_TYPES: {
        NEW_PATIENT: 'newPatient',
        FOLLOW_UP: 'followUp',
        ROUTINE_CHECKUP: 'routineCheckup',
        EMERGENCY: 'emergency'
    },
    PRIORITIES: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        URGENT: 'urgent'
    },
    PAYMENT_STATUSES: {
        PAID: 'paid',
        PENDING: 'pending',
        PARTIALLY_PAID: 'partiallyPaid',
        REFUNDED: 'refunded',
        FAILED: 'failed',
        CANCELLED: 'cancelled'
    },
    PAYMENT_METHODS: {
        CASH: 'cash',
        CREDIT_CARD: 'creditCard',
        DEBIT_CARD: 'debitCard',
        INSURANCE: 'insurance',
        ONLINE: 'online',
        OTHER: 'other'
    },
    SYMPTOMS: {
        MILD: 'mild',
        MODERATE: 'moderate',
        SEVERE: 'severe'
    }
});