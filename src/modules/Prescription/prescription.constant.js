exports.prescriptionConstants = Object.freeze({
    ROUTE: {
        ORAL: 'oral',
        INJECTION: 'injection',
        TOPICAL: 'topical',
        INHALATION: 'inhalation',
        RECTAL: 'rectal',
        SUBLINGUAL: 'sublingual',
        INTRAVENOUS: 'intravenous',
        INTRAMUSCULAR: 'intramuscular',
        OTHER: 'other'
    },
    TIMING: {
        BEFORE_MEALS: 'beforeMeals',
        AFTER_MEALS: 'afterMeals',
        WITH_MEALS: 'withMeals',
        AT_BEDTIME: 'atBedtime',
        AS_NEEDED: 'asNeeded',
        EMPTY_STOMACH: 'emptyStomach',
        ANYTIME: 'anytime',
        OTHER: 'other'
    },
    STATES_MED: {
        ACTIVE: 'active',
        COMPLETED: 'completed',
        DISCONTINUED: 'discontinued',
        ON_HOLD: 'onHold'
    },
    TEST_TYPES: {
        BLOOD_TEST: 'bloodTest',
        IMAGING: 'imaging',
        URINE_TEST: 'urineTest',
        BIOPSY: 'biopsy',
        CULTURE: 'culture',
        OTHER: 'other'
    },
    URGENCY_TEST: {
        ROUTINE: 'routine',
        URGENT: 'urgent'
    },
    STATES_TEST: {
        ORDERED: 'ordered',
        IN_PROGRESS: 'inProgress',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled'
    },
    STATUSES: {
        ACTIVE: 'active',
        COMPLETED: 'completed',
        EXPIRED: 'expired',
        CANCELLED: 'cancelled',
        REVISED: 'revised'
    },
})