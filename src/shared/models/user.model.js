const mongoose = require("mongoose");
const enums = require("../constants/enums");
const validators = require("../validators/common.validator");

const options = { discriminatorKey: "role", timestamps: true };

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
    },
    role: {
      type: String,
      enum: {
        values: Object.values(enums.ROLE),
        message: "{VALUE} is not a valid role",
      },
      default: enums.ROLE.PATIENT,
      required: [true, "Role is required"],
    },
    dateOfBirth: {
      type: Date,
      required: [function () { return this.role !== enums.ROLE.PHARMACY; }, "Date of birth is required"],
      validate: {
        validator: function (v) {
          return v < new Date();
        },
        message: "Date of birth must be in the past",
      },
    },
    gender: {
      type: String,
      enum: {
        values: Object.values(enums.GENDERS),
        message: "{VALUE} is not a valid gender, Gender must be either male or female",
      },
      required: [function () { return this.role !== enums.ROLE.PHARMACY; }, "Gender is required"],
    },
    provider: {
      type: String,
      enum: {
        values: ["local", "google"],
        message: "{VALUE} is not a valid provider",
      },
      default: "local",
    },
    phone: {
      type: String,
      validate: validators.egyptianPhone,
    },
    address: {
      governorate: { type: String, trim: true },
      city: { type: String, trim: true },
      street: { type: String, trim: true },
      _id: false,
    },
    profileImage:{
      imageUrl: { type: String },
      _id: false,
    },
    nationality: {
      type: String,
      trim: true,
      default: "Egyptian",
    },
    
    isActive: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true 
    },
    deletedAt: {
      type: Date,
      default: null
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    
    verifyOtp: { type: String, default: undefined },
    verifyOtpExpiry: { type: Date, default: undefined },
    resetPasswordToken: { type: String, default: undefined },
    resetPasswordExpires: { type: Date, default: undefined },
    refreshTokens: [
      {
        token: {
          type: String,
          required: true,
        },
        expiresAt: {
          type: Date,
          required: true,
        },
        deviceFingerprint: {
          type: String,
          default: "unknown",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        lastUsed: {
          type: Date,
          default: Date.now,
        },
        isPrimary: { type: Boolean, default: false },
        ipAddress: { type: String, default: "unknown" },
        userAgent: { type: String, default: "Unknown" },
        browser: { type: String, default: "Unknown Browser" },
        os: { type: String, default: "Unknown OS" },
        deviceType: { type: String, default: "Unknown" },
        deviceVendor: { type: String, default: "Unknown" },
        deviceModel: { type: String, default: "Unknown Model" },
      },
    ],

    passwordHistory: [{
        password: String,
        changedAt: Date,
        _id: false
    }],

    activity: {
      lastLogin: Date,
      lastActivity: Date,
      loginCount: {
        type: Number,
        default: 0,
      },
      _id: false,
    },
    
  },
  options
);

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});
userSchema.virtual("age").get(function () {
  if (this.dateOfBirth) {
    return Math.floor(
      (Date.now() - this.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
  }
  return null;
});

userSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  if (typeof next === 'function') next();
});
userSchema.pre("save", async function () {
  if (this.refreshTokens?.length) {
    this.refreshTokens = this.refreshTokens.filter(
      (token) => token.expiresAt > new Date()
    );
  }
});

userSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.password;
    delete ret.refreshTokens;
    delete ret.verifyOtp;
    delete ret.verifyOtpExpiry;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.passwordHistory;
    delete ret.lastPasswordResetRequest;
    delete ret.failedLoginAttempts;
    delete ret.accountLockedUntil;
    delete ret.activity;
    delete ret.__v;
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.isDeleted;
    delete ret.deletedAt;

    return ret;
  },
});
userSchema.set("toObject", { 
  virtuals: true 
});

userSchema.index({
  'phone': 1,
  'refreshTokens.token': 1,
  'refreshTokens.expiresAt': 1,
  'createdAt': -1,
  'role': 1
})

const User = mongoose.model("User", userSchema);

module.exports = User;