const crypto = require('crypto');
const { UAParser } = require('ua-parser-js');
const User  = require('../models/user.model.js');
const AppError = require('../../core/appError.js');
const { HTTP_STATUS_TEXT } = require('../constants/enums.js');

const generateDeviceFingerprint = (req) => {
    const deviceData = [
        req.headers['user-agent'] || '',
        req.headers['accept-language'] || '',
        req.headers['accept-encoding'] || '',
        req.ip || req.connection.remoteAddress || ''
    ].join('|');
    
    return crypto.createHash('sha256').update(deviceData).digest('hex').substring(0, 16);
};
const parseDeviceInfo = (userAgent) => {
    if (!userAgent) {
        return {
            browser: 'Unknown Browser',
            os: 'Unknown OS',
            deviceType: 'Unknown',
            deviceVendor: 'Unknown',
            deviceModel: 'Unknown Model'
        };
    }

    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const getDeviceType = (device, os) => {
        if (device.type) return device.type;
        
        const osName = os.name?.toLowerCase() || '';
        const uaLower = userAgent.toLowerCase();
        
        if (osName.includes('ios') || osName.includes('android')) {
            if (uaLower.includes('ipad') || uaLower.includes('tablet')) {
                return 'tablet';
            }
            return 'mobile';
        }
        
        if (osName.includes('windows') || osName.includes('mac') || osName.includes('linux')) {
            return 'desktop';
        }
        
        return 'desktop';
    };

    const getDeviceVendor = (device, os, userAgent) => {
        if (device.vendor) return device.vendor;
        
        const osName = os.name?.toLowerCase() || '';
        const uaLower = userAgent.toLowerCase();
        
        if (osName.includes('ios') || uaLower.includes('iphone') || uaLower.includes('ipad')) {
            return 'Apple';
        }
        
        if (osName.includes('android')) {
            if (uaLower.includes('samsung')) return 'Samsung';
            if (uaLower.includes('huawei')) return 'Huawei';
            if (uaLower.includes('xiaomi')) return 'Xiaomi';
            return 'Android Device';
        }
        
        if (osName.includes('windows')) return 'Microsoft';
        if (osName.includes('mac')) return 'Apple';
        
        return 'Unknown';
    };

    return {
        browser: result.browser.name || 'Unknown Browser',
        os: result.os.name || 'Unknown OS',
        deviceType: getDeviceType(result.device, result.os),
        deviceVendor: getDeviceVendor(result.device, result.os, userAgent),
        deviceModel: result.device.model || 'Unknown Model'
    };
};
const setRefreshTokenInDB = async (userId, refreshToken, req) => {
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + (7 * 24 * 60 * 60 * 1000)); 

    const deviceFingerprint = generateDeviceFingerprint(req);
    const deviceInfo = parseDeviceInfo(req.headers['user-agent']);

    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(404, HTTP_STATUS_TEXT.FAIL, "User not found");
    }

    user.refreshTokens = user.refreshTokens.filter(tokenObj => tokenObj.expiresAt > new Date());

    const existingDeviceIndex = user.refreshTokens.findIndex(
        tokenObj => tokenObj.deviceFingerprint === deviceFingerprint
    );

    const existingPrimary = user.refreshTokens.find(rt => rt.isPrimary);
    const tokenData = {
        token: refreshToken,
        expiresAt,
        deviceFingerprint,
        createdAt: new Date(),
        lastUsed: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        userAgent: req.headers['user-agent'] || 'Unknown',
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        deviceType: deviceInfo.deviceType,
        deviceVendor: deviceInfo.deviceVendor,
        deviceModel: deviceInfo.deviceModel,
        isPrimary: existingDeviceIndex !== -1
            ? user.refreshTokens[existingDeviceIndex]?.isPrimary === true
            : !existingPrimary
    };

    if (existingDeviceIndex !== -1) {
        user.refreshTokens[existingDeviceIndex] = tokenData;
    } else {
        if (user.refreshTokens.length >= 5) {
            throw new AppError(403, HTTP_STATUS_TEXT.FAIL, 
                "Maximum number of devices reached. Please logout from another device first.");
        }
        user.refreshTokens.push(tokenData);
    }

    user.activity.lastLogin = new Date();
    user.activity.loginCount += 1;

    await user.save();
    const sessionId = user.refreshTokens[
        existingDeviceIndex !== -1 ? existingDeviceIndex : user.refreshTokens.length - 1
    ]._id.toString();

    return sessionId;
};
const buildPatchUpdate = ({ data, basePath = '' }) => {
  const $set = {};

  Object.entries(data).forEach(([key, value]) => {
    const fullPath = basePath ? `${basePath}.${key}` : key;
    $set[fullPath] = value;
  });

  return Object.keys($set).length ? { $set } : {};
};
const getPagination = (total, page, limit) => ({
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1
});

module.exports = {
    generateDeviceFingerprint,
    parseDeviceInfo,
    setRefreshTokenInDB,
    buildPatchUpdate,
    getPagination
}