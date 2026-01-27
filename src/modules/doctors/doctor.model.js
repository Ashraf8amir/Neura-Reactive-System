const mongoose = require('mongoose');
const  User  = require('../../shared/models/user.model.js');
const constants = require('../../shared/constants/enums');
const validators = require('../../shared/validators/common.validator');

const doctorSchema = new mongoose.Schema({
  nationalId: {
    nationalIdImageFront: {
      url: String,
      publicId: String,
      _id: false
    },
    nationalIdImageBehind: {
      url: String,
      publicId: String,
      _id: false
    }
  }, 
  medicalDegreeCertificate: {
    url: String,
    publicId: String,
    _id: false
  },
  syndicateMembershipCard: {
    url: String,
    publicId: String,
    _id: false
  },
  medicalLicense: {
        medicalLicenseImage: {
          url: String,
          publicId: String,
          _id: false
        }
  },

  professionalInfo: {
    professionalInformation: {
      primarySpecialization: { type: String, trim: true },
      subSpecializations: [{ type: String, trim: true }],
      highestDegree: { type: String, trim: true },
      medicalSchool: { type: String, trim: true },
      yearsOfExperience: {
        type: Number,
        min: [0, "Experience years cannot be negative"],
        default: 0,
      },
      currentPosition: { type: String, trim: true },
      hospitalAffiliation: [
        { type: String, trim: true }
      ]
    },
    certificates: [
      {
        nameCertificate: { type: String, trim: true },
        institution: { type: String, trim: true },
        Year: { type: Number },
        certificateImage: {
          url: String,
          publicId: String,
          _id: false
        }
      }
    ],
    medicalMemberships: [
      {
        nameOfAssociation: { type: String, trim: true },
        memberId: { type: String, trim: true },
        Since: { type: Number }
      }
    ],
    awards: [
      {
        nameAward: { type: String, trim: true },
        by: { type: String, trim: true },
        Year: { type: Number },
        AwardImage: {
          url: String,
          publicId: String,
          _id: false
        }
      }
    ],
    bio: { type: String, trim: true, maxlength: [1000, "Bio cannot exceed 1000 characters"] }
  },

  clinicInfo: [
    {
      clinicName: { type: String, trim: true, required: true },
      phone: {
        type: String,
        trim: true,
        validate: validators.egyptianPhone,
        required: true,
      },
      isPrimary: { type: Boolean, default: false, index: true },
      availableHours: [
      {
        day: {
          type: String,
          enum: {
            values: Object.values(constants.DAYS_OF_WEEK),
            message: "{VALUE} is not a valid day",
          },
          required: true,
        },
        startTime: {
          type: String,
          validate: {
            validator: validators.timeFormat.validator,
            message: "Start time must be in HH:MM format",
          },
          required: true,
        },
        endTime: {
          type: String,
          validate: {
            validator: validators.timeFormat.validator,
            message: "End time must be in HH:MM format",
          },
          required: true,
        },
        _id: false,
      },
      ],
      consultationFee: {
        type: Number,
        min: [0, "Consultation fee cannot be negative"],
        default: 0,
        required: true,
      },
      followUpFee: {
        type: Number,
        min: [0, "Follow-up fee cannot be negative"],
        default: 0,
        required: true,
      },
      addressClinic: {
        governorate: { type: String, trim: true, required: true },
        city: { type: String, trim: true, required: true },
        street: { type: String, trim: true, required: true },
        buildingNumber: { type: String, trim: true },
        floor: { type: String, trim: true },
      },
    },
  ],

  telemedicine: {
    enabled: { type: Boolean, default: false },
    consultationFee: { type: Number, default: 0, min: [0, "Consultation fee cannot be negative"], required: true },
    availableHours: [
        {
          day: {
            type: String,
            enum: {
              values: Object.values(constants.DAYS_OF_WEEK),
              message: "{VALUE} is not a valid day",
            },
            required: true,
          },
          startTime: {
            type: String,
            validate: {
              validator: validators.timeFormat.validator,
              message: "Start time must be in HH:MM format",
            },
            required: true,
          },
          endTime: {
            type: String,
            validate: {
              validator: validators.timeFormat.validator,
              message: "End time must be in HH:MM format",
            },
            required: true,
          },
          _id: false,
        },
      ],
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

  accountStatus: {
    type: String,
    enum: {
      values: Object.values(constants.ACCOUNT_STATUS),
      message: "{VALUE} is not a valid account status",
    },
    default: "incomplete",
  },

  rating: {
    type: Number,
    min: [0, "Rating cannot be less than 0"],
    max: [5, "Rating cannot be more than 5"],
    default: 0,
  },

  stats: {
    totalAppointments: { type: Number, default: 0 },
    completedAppointments: { type: Number, default: 0 },
    cancelledAppointments: { type: Number, default: 0 },
    averageRating: {
      type: Number,
      min: [0, "Average rating cannot be negative"],
      max: [5, "Average rating cannot be more than 5"],
      default: 0,
    },
    totalReviews: { type: Number, default: 0 },
    _id: false,
  }
});

// Indexes for optimizing queries
doctorSchema.index({ rating: -1 });
doctorSchema.index({ isVerified: 1, accountStatus: 1 });

const Doctor = User.discriminator('doctor', doctorSchema);

module.exports = Doctor;