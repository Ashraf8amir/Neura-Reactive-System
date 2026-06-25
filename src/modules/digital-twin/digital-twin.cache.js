const cacheService = require('../../cache/cache.service');
const cacheTTL = require('../../cache/redis.ttl');
const { buildCacheKey, hashQuery, normalizePart } = require('../../cache/cache.keys');

const getDigitalTwinStateKey = (patientId) => 
    buildCacheKey('digital_twin', 'state', 'patient', patientId);

const getDigitalTwinMetricsKey = (patientId) => 
    buildCacheKey('digital_twin', 'metrics', 'patient', patientId);

const getDigitalTwinRiskScoresKey = (patientId) => 
    buildCacheKey('digital_twin', 'risks', 'patient', patientId);

const getWhatIfSimulationKey = (patientId, scenario) => {
    const prefix = buildCacheKey('digital_twin', 'whatif', 'patient', patientId);
    const scenarioHash = hashQuery(scenario);
    return `${prefix}:q:${scenarioHash}`;
};

const getHealthTrendsKey = (patientId, period = 'monthly') => 
    buildCacheKey('digital_twin', 'trends', 'patient', patientId, 'period', period);

const getPatientTwinPrefix = (patientId) => 
    buildCacheKey('digital_twin', 'patient', patientId);

const getWhatIfSimulationPrefix = (patientId) => 
    buildCacheKey('digital_twin', 'whatif', 'patient', patientId);

const clearPatientTwinCache = async (patientId) => {
    if (!patientId) return;

    await Promise.all([
        cacheService.delKey(getDigitalTwinStateKey(normalizePart(patientId))),
        cacheService.delKey(getDigitalTwinMetricsKey(normalizePart(patientId))),
        cacheService.delKey(getDigitalTwinRiskScoresKey(normalizePart(patientId))),
        cacheService.delKey(getHealthTrendsKey(normalizePart(patientId), 'monthly')),
        cacheService.delKey(getHealthTrendsKey(normalizePart(patientId), 'weekly')),
        cacheService.delByPrefix(getWhatIfSimulationPrefix(normalizePart(patientId)))
    ]);
};

const clearTwinStateCache = async (patientId) => {
    if (!patientId) return;

    await Promise.all([
        cacheService.delKey(getDigitalTwinStateKey(normalizePart(patientId))),
        cacheService.delKey(getDigitalTwinMetricsKey(normalizePart(patientId))),
        cacheService.delKey(getDigitalTwinRiskScoresKey(normalizePart(patientId)))
    ]);
};

const clearWhatIfCache = async (patientId) => {
    if (!patientId) return;
    await cacheService.delByPrefix(getWhatIfSimulationPrefix(normalizePart(patientId)));
};

const clearTrendCache = async (patientId, period = 'all') => {
    if (!patientId) return;

    const normalizedId = normalizePart(patientId);
    
    if (period === 'all') {
        await Promise.all([
            cacheService.delKey(getHealthTrendsKey(normalizedId, 'monthly')),
            cacheService.delKey(getHealthTrendsKey(normalizedId, 'weekly'))
        ]);
    } else {
        await cacheService.delKey(getHealthTrendsKey(normalizedId, period));
    }
};

const clearTwinOnMedicalRecordUpdate = async (patientId) => {
    if (!patientId) return;
    await clearTwinStateCache(patientId);
};

const clearAllPatientTwinCaches = async (patientId) => {
    if (!patientId) return;
    const normalizedId = normalizePart(patientId);
    await cacheService.delByPrefix(getPatientTwinPrefix(normalizedId));
};

module.exports = {
    ttl: cacheTTL.digitalTwin,
    getDigitalTwinStateKey,
    getDigitalTwinMetricsKey,
    getDigitalTwinRiskScoresKey,
    getWhatIfSimulationKey,
    getHealthTrendsKey,
    getPatientTwinPrefix,
    getWhatIfSimulationPrefix,
    clearPatientTwinCache,
    clearTwinStateCache,
    clearWhatIfCache,
    clearTrendCache,
    clearTwinOnMedicalRecordUpdate,
    clearAllPatientTwinCaches
};
