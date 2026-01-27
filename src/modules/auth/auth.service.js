const crypto = require("crypto");
const path = require("path");
const bcrypt = require("bcryptjs");
const ejs = require("ejs");
const User = require('../../shared/models/user.model.js');
const Patient = require('../../modules/patients/patient.model.js');
const Doctor = require('../../modules/doctors/doctor.model.js');
const Nurse = require('../../modules/nurses/nurse.model.js');
const Pharmacy = require('../../modules/pharmacies/pharmacy.model.js');
const AppError = require('../../core/appError.js');
const config = require('../../config/config.js');
const sendMail = require('../../shared/utils/emailSender.js');
const httpStatus = require('../../core/httpStatus.js');
const logger = require('../../core/logger.js');
const ROLE = require('../../core/roles.js');
const HELPER = require('./auth.helper.js');
const { setRefreshTokenInDB } = require('../../shared/utils/globalHelper.js');
const jwt = require('jsonwebtoken');

class AuthService {
    async registerService(userData, req) {
        const { email, password, role } = userData;

        const existingUser = await User.findOne({ email });
        if (existingUser) throw new AppError(400, httpStatus.FAIL, 'Email already registered');
        
        userData.password = await HELPER.hashedPassword(password);

        let model; 

        if (role === ROLE.PATIENT)  model = Patient;
        else if (role === ROLE.DOCTOR) model = Doctor;
        else if (role === ROLE.NURSE) model = Nurse;
        else if (role === ROLE.PHARMACY) model = Pharmacy;
        
        const newUser = await new model(userData).save();

        const { accessToken, refreshToken } = HELPER.generateToken(newUser);
        await setRefreshTokenInDB(newUser._id, refreshToken, req);

        setImmediate(async () => {
            try {
                const htmlContent = await ejs.renderFile(
                    path.join(__dirname, "../../templates/emails/auth/welcome.ejs"),
                    { 
                        userName: newUser.fullName,
                        role: role,
                        profileLink: `${config.frontendUrl}/${role}/profile`
                    }
                );

                await sendMail(
                    newUser.email,
                    `Welcome to Sahtak - Complete Your ${role === 'doctor' ? 'Doctor' : 'Patient'} Profile`,
                    htmlContent,
                    `Welcome ${newUser.fullName},\n\nYour ${role} account has been created. Please complete your profile to start using Sahtak.`
                );
            } catch (emailError) {
                logger.error('Welcome email sending failed:', emailError);
            }
        });

        return { user: newUser, accessToken, refreshToken };
    }

    async loginService(credentials, req) {
        const { email, password } = credentials;

        const existingUser = await User.findOne({ email });
        if (!existingUser) throw new AppError(401, httpStatus.FAIL, 'Invalid email');

        if (existingUser.isDeleted) 
            throw new AppError(403, httpStatus.FAIL, 'This account has been deleted. Contact support to restore it.');

        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            await existingUser.save();
            throw new AppError(401, httpStatus.UNAUTHORIZED, 'Invalid credentials');
        }

        await existingUser.save();

        const { accessToken, refreshToken } = HELPER.generateToken(existingUser);
        await setRefreshTokenInDB(existingUser._id, refreshToken, req);

        existingUser.activity.lastLogin = new Date();
        existingUser.activity.loginCount += 1;
        await existingUser.save();

        return { user: existingUser, accessToken, refreshToken  };
    }
    
    async logoutService(refreshToken) {
        if (!refreshToken) throw new AppError(400, httpStatus.FAIL, 'Refresh token required');

        const result = await User.updateOne(
            { "refreshTokens.token": refreshToken },
            { $pull: { refreshTokens: { token: refreshToken } } }
        );

        if (result.modifiedCount === 0)
            throw new AppError(400, httpStatus.FAIL, 'Invalid refresh token');

        return true;
    }

    async refreshTokenService(oldRefreshToken, req) {
        if (!oldRefreshToken) throw new AppError(400, httpStatus.FAIL, 'Refresh token required');

        const user = await User.findOneAndUpdate(
          {
            "refreshTokens.token": oldRefreshToken,
            "refreshTokens.expiresAt": { $gt: new Date() },
            isDeleted: false,
          },
          {
            $pull: { refreshTokens: { token: oldRefreshToken } },
          },
          { new: false }
        );

        if (!user) throw new AppError(401, httpStatus.UNAUTHORIZED, 'Invalid or expired refresh token');

        const { accessToken, refreshToken } = HELPER.generateToken(user);
        await setRefreshTokenInDB(user._id, refreshToken, req);

        return { accessToken, refreshToken  };
    }

    async googleAuthUrlService(){
        const { authUrl, state, codeVerifier } = HELPER.generateGoogleAuthUrl();

        const stateData = {
            state: state,
            timestamp: Date.now(),
        };
        const stateString = JSON.stringify(stateData);

        return { authUrl, stateString, codeVerifier };
    }

    async googleCallbackService(code, stateCookie, receivedState, codeVerifier, req) {
        if (!code) throw new AppError(400, httpStatus.FAIL, 'Authorization code is required');
        if (!codeVerifier) throw new AppError(400, httpStatus.FAIL, 'Code verifier is missing');
        if (!stateCookie || !receivedState)  
            throw new AppError(400, httpStatus.FAIL, 'State parameter is missing');

        const stateData = JSON.parse(stateCookie);
    
        if (receivedState !== stateData.state) 
            throw new AppError(400, httpStatus.FAIL, 'State mismatch. Possible CSRF attack.');

        if (Date.now() - stateData.timestamp > 10 * 60 * 1000) 
            throw new AppError(400, httpStatus.FAIL, 'Authorization request expired');
        
        const tokenResponse = await HELPER.generateTokenResponse(code, codeVerifier);
        const userInfo = await HELPER.getUserInfo(tokenResponse.accessToken);

        let user = await User.findOne({ email: userInfo.email });

        if (user) {
            const { accessToken, refreshToken } = HELPER.generateToken(user);
            await setRefreshTokenInDB(user._id, refreshToken, req);
            return { user, accessToken, refreshToken, userInfo, isNewUser: false };
        }

        const payload ={
            email: userInfo.email,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
        };        
        const tempToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' })

        return { userInfo, isNewUser: true, tempToken };
    }

    async completeGoogleRegistrationService(userData, req) {
        const { role, gender, dateOfBirth, tempToken } = userData;
        if (!tempToken) 
            throw new AppError(400, httpStatus.FAIL, 'Temporary Google user data is missing');

        let googleUserInfo;
        try {
            googleUserInfo = jwt.verify(tempToken, config.jwtSecret);
        } catch (error) {
            throw new AppError(400, httpStatus.FAIL, 'Invalid or expired temporary Google user data');
        }

        const existingUser = await User.findOne({ email: googleUserInfo.email });
        if (existingUser) throw new AppError(400, httpStatus.FAIL, 'User already exists');

        const randomPassword = crypto.randomBytes(32).toString('hex');
        const hashedPassword = await HELPER.hashedPassword(randomPassword);

        const baseUserData = {
            email: googleUserInfo.email,
            firstName: googleUserInfo.firstName,
            lastName: googleUserInfo.lastName,
            password: hashedPassword,
            role: role,
            provider: 'google'
        };

        let newUser;
        switch (role) {
            case ROLE.PATIENT: 
                newUser = await new Patient({ ...baseUserData, gender, dateOfBirth }).save();
                break;
            case ROLE.DOCTOR:
                newUser = await new Doctor({ ...baseUserData, gender, dateOfBirth }).save();
                break;
            case ROLE.NURSE:
                newUser = await new Nurse({ ...baseUserData, gender, dateOfBirth }).save();
                break;
            case ROLE.PHARMACY:
                newUser = await new Pharmacy({ ...baseUserData, gender, dateOfBirth }).save();
                break;  
            default:
                throw new AppError(400, httpStatus.FAIL, 'Invalid role specified'); 
        }

        const { accessToken, refreshToken } = HELPER.generateToken(newUser);
        await setRefreshTokenInDB(newUser._id, refreshToken, req);

        setImmediate(async () => {
            try {
                const htmlContent = await ejs.renderFile(
                    path.join(__dirname, "../../templates/emails/auth/welcome.ejs"),
                    { 
                        userName: newUser.fullName,
                        role: role,
                        profileLink: `${config.frontendUrl}/${role}/profile`
                    }
                );

                await sendMail(
                    newUser.email,
                    `Welcome to Sahtak - Complete Your ${role === 'doctor' ? 'Doctor' : 'Patient'} Profile`,
                    htmlContent,
                    `Welcome ${newUser.fullName},\n\nYour ${role} account has been created. Please complete your profile to start using Sahtak.`
                );
            } catch (emailError) {
                logger.error('Welcome email sending failed:', emailError);
            }
        });

        return { user: newUser, accessToken, refreshToken  };
    }

    async sendVerifyOtpService(email) {
        const user = await User.findOne({ email });
        if (!user) throw new AppError(404, httpStatus.FAIL, 'User with this email does not exist');

        if (user.isEmailVerified) throw new AppError(400, httpStatus.FAIL, 'Email is already verified');

        if (user.verifyOtpExpiry) {
            const otpLifetime = 10 * 60 * 1000; 
            const otpCooldown = 1 * 60 * 1000; 
            const sentAt = user.verifyOtpExpiry - otpLifetime;

            if (Date.now() - sentAt < otpCooldown) {
                const remainingTime = Math.ceil((otpCooldown - (Date.now() - sentAt)) / 1000);
                throw new AppError(
                    429,
                    httpStatus.FAIL,
                    `Please wait ${remainingTime} seconds before requesting another verification code`
                );
            }
        }

        const otp = HELPER.generateOTP();
        user.verifyOtp = otp;
        user.verifyOtpExpiry = Date.now() + 10 * 60 * 1000;
        await user.save();

        setImmediate(async () => {
             try {
               const htmlContent = await ejs.renderFile(
                 path.join(__dirname,"../../templates/emails/auth/verify-otp.ejs"),
                 { fullName: user.fullName, otp }
               );

               await sendMail(
                 user.email,
                 "sahtak - Email Verification OTP",
                 htmlContent,
                 `Your OTP for email verification is ${otp}. It is valid for 10 minutes.`
               );

               logger.info(`Verification OTP email sent`);
             } catch (emailError) {
                 logger.error('Verification OTP email sending failed:', emailError);
             }
        });

        return true;
    }

    async verifyEmailService(email, otp) {
        const user = await User.findOne({ email });
        if (!user) throw new AppError(404, httpStatus.FAIL, 'User with this email does not exist');

        if (!user.verifyOtp || !user.verifyOtpExpiry || user.verifyOtpExpiry < Date.now()) {
            throw new AppError(400, httpStatus.FAIL, 'OTP has expired. Please request a new one.');
        }

        if (user.verifyOtp !== otp) throw new AppError(400, httpStatus.FAIL, 'Invalid OTP. Please try again.');

        if (Date.now() > user.verifyOtpExpiry) {
            user.verifyOtp = undefined;
            user.verifyOtpExpiry = undefined;
            await user.save();

            throw new AppError(400, httpStatus.FAIL, 'Verification code has expired. Please request a new one.');
        }

        user.isEmailVerified = true;
        user.verifyOtp = undefined;
        user.verifyOtpExpiry = undefined;
        await user.save();

        return true;
    }

    async requestPasswordResetService(email) {
        const user = await User.findOne({ email });
        if (!user) throw new AppError(404, httpStatus.FAIL, 'User with this email does not exist');

        if (user.isDeleted) 
            throw new AppError(403, httpStatus.FAIL, 'This account has been deleted. Contact support to restore it.');

        const resetToken = HELPER.generateResetToken();
        const resetTokenHash = HELPER.hashResetToken(resetToken);

        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
        await user.save();

        const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

        setImmediate( async () => {
            try {
                const htmlContent = await ejs.renderFile(
                    path.join(__dirname,"../../templates/emails/auth/reset-password.ejs"),
                    { fullName: user.fullName, resetUrl, expiryMinutes: 15 }
                );
                await sendMail(
                    user.email,
                    "sahtak - Password Reset Request",
                    htmlContent,
                    `You requested a password reset. Click the link to reset your password: ${resetUrl}`
                );
                logger.info(`Password reset email sent to ${user.email}`);
            } catch (emailError) {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
                await user.save();

                logger.error('Password reset email sending failed:', emailError);
            }
        });

        return true;
    }

    async resetPasswordService(token, newPassword) {
        const hashedToken = HELPER.hashResetToken(token);

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) throw new AppError(400, httpStatus.FAIL, 'Invalid or expired password reset token');

        const hashedPwd = await HELPER.hashedPassword(newPassword);
        user.password = hashedPwd;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        if(user.password){
            user.passwordHistory.push({
                password: hashedPwd,
                changedAt: new Date()
            })

            if(user.passwordHistory.length > 5)
                user.passwordHistory = user.passwordHistory.slice(-5);
        }

        user.refreshTokens = [];
        await user.save();

        setImmediate( async () => {
            try {
                const htmlContent = await ejs.renderFile(
                  path.join(
                    __dirname,
                    "../../templates/emails/auth/change-password.ejs"
                  ),
                  {
                    userName: user.fullName,
                    changeDate: new Date(),
                    supportEmail: "support@sahtak.com",
                  }
                );
                await sendMail(
                    user.email,
                    "sahtak - Password Changed Successfully",
                    htmlContent,
                    "Your password has been changed successfully. If you did not perform this action, please contact support immediately."
                );
                logger.info(`Password change notification email sent to ${user.email}`);
            } catch (emailError) {
                logger.error('Password change notification email sending failed:', emailError);
            }
        })

        return true;
    }

    async changePasswordService(email, currentPassword, newPassword, currentRefreshToken) {
        const user = await User.findOne({ email });
        if (!user) throw new AppError(404, httpStatus.FAIL, 'User not found');

        if (user.provider === 'google') {
            throw new AppError(400, httpStatus.FAIL, 'Google account users cannot change password.');
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) throw new AppError(401, httpStatus.UNAUTHORIZED, 'Current password is incorrect');

        const hashedPwd = await HELPER.hashedPassword(newPassword);
        user.password = hashedPwd;
        user.passwordHistory.push({
            password: hashedPwd,
            changedAt: new Date()
        });

        if(user.passwordHistory.length > 5)
            user.passwordHistory = user.passwordHistory.slice(-5);

        user.refreshTokens = user.refreshTokens.filter(rt => rt.token === currentRefreshToken);

        await user.save();

        setImmediate( async () => {
            try {
                const htmlContent = await ejs.renderFile(
                  path.join(
                    __dirname,
                    "../../templates/emails/auth/change-password.ejs"
                  ),
                  {
                    userName: user.fullName,
                    changeDate: new Date(),
                    supportEmail: "support@sahtak.com",
                  }
                );
                await sendMail(
                    user.email,
                    "sahtak - Password Changed Successfully",
                    htmlContent,
                    "Your password has been changed successfully. If you did not perform this action, please contact support immediately."
                );
                logger.info(`Password change notification email sent to ${user.email}`);
            } catch (emailError) {
                logger.error('Password change notification email sending failed:', emailError);
            }
        })

        return true;
    }
}


module.exports = new AuthService();