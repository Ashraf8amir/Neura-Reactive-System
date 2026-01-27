const mongoose = require('mongoose');
const User = require('../../shared/models/user.model');
const constants = require('../../shared/constants/enums');
const validators = require('../../shared/validators/common.validator');

const nurseSchema = new mongoose.Schema({
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
  nursingLicense: {
    licenseNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    licenseImage: {
      url: String,
      publicId: String,
      _id: false
    },
    issueDate: Date,
    expiryDate: Date,
    issuingAuthority: { type: String, trim: true }
  },
  nursingDegreeCertificate: {
    url: String,
    publicId: String,
    _id: false
  },
  syndicateMembershipCard: {
    url: String,
    publicId: String,
    _id: false
  },

  professionalInfo: {
    highestDegree: {
      type: String,
      enum: ['diploma', 'bachelor', 'master', 'phd'],
      trim: true
    },
    nursingSchool: { type: String, trim: true },
    graduationYear: { type: Number },
    yearsOfExperience: {
      type: Number,
      min: [0, "Experience years cannot be negative"],
      default: 0
    },
    specialization: {
      type: String,
      enum: [
        'general_nursing',
        'pediatric',
        'geriatric',
        'psychiatric',
        'surgical',
        'emergency',
        'intensive_care',
        'home_care',
        'rehabilitation',
        'palliative_care',
        'wound_care',
        'diabetes_care',
        'oncology'
      ],
      default: 'general_nursing'
    },
    secondarySpecializations: [{
      type: String,
      trim: true
    }],
    
    certificates: [
      {
        certificateName: { type: String, trim: true, required: true },
        institution: { type: String, trim: true },
        year: { type: Number },
        certificateImage: {
          url: String,
          publicId: String,
          _id: false
        }
      }
    ],

    professionalMemberships: [
      {
        organizationName: { type: String, trim: true },
        memberId: { type: String, trim: true },
        since: { type: Number }
      }
    ],

    languagesSpoken: [
      {
        language: { type: String, trim: true },
        proficiency: {
          type: String,
          enum: ['basic', 'intermediate', 'fluent', 'native'],
          default: 'intermediate'
        },
        _id: false
      }
    ],

    bio: {
      type: String,
      trim: true,
      maxlength: [800, "Bio cannot exceed 800 characters"]
    }
  },

  // Services Offered
  servicesOffered: [
    {
      serviceName: {
        type: String,
        required: true,
        enum: [
          'vital_signs_monitoring',
          'medication_administration',
          'wound_dressing',
          'catheter_care',
          'iv_therapy',
          'injection_administration',
          'post_surgical_care',
          'elderly_care',
          'bedridden_patient_care',
          'physiotherapy_assistance',
          'nebulization',
          'tube_feeding',
          'diabetes_management',
          'blood_sugar_monitoring',
          'blood_pressure_monitoring',
          'sample_collection',
          'baby_care',
          'patient_education',
          'companionship'
        ]
      },
      description: { type: String, trim: true },
      pricePerSession: {
        type: Number,
        required: true,
        min: [0, "Price cannot be negative"]
      },
      duration: { type: Number }, // minutes
      _id: false
    }
  ],

  // Availability & Coverage
  availability: {
    workingHours: [
      {
        day: {
          type: String,
          enum: Object.values(constants.DAYS_OF_WEEK),
          required: true
        },
        startTime: {
          type: String,
          validate: {
            validator: validators.timeFormat.validator,
            message: "Start time must be in HH:MM format"
          },
          required: true
        },
        endTime: {
          type: String,
          validate: {
            validator: validators.timeFormat.validator,
            message: "End time must be in HH:MM format"
          },
          required: true
        },
        _id: false
      }
    ],
    
    emergencyAvailability: {
      type: Boolean,
      default: false
    },
    
    liveInCareAvailable: {
      type: Boolean,
      default: false
    },
    
    nightShiftsAvailable: {
      type: Boolean,
      default: false
    }
  },

  coverageArea: {
    governorates: [{
      type: String,
      trim: true
    }],
    cities: [{
      type: String,
      trim: true
    }],
    maxTravelDistance: {
      type: Number, // in kilometers
      default: 10
    },
    travelFee: {
      type: Number,
      default: 0,
      min: [0, "Travel fee cannot be negative"]
    }
  },

  // Pricing
  pricing: {
    hourlyRate: {
      type: Number,
      min: [0, "Hourly rate cannot be negative"],
      default: 0
    },
    dailyRate: {
      type: Number,
      min: [0, "Daily rate cannot be negative"],
      default: 0
    },
    weeklyRate: {
      type: Number,
      min: [0, "Weekly rate cannot be negative"],
      default: 0
    },
    monthlyRate: {
      type: Number,
      min: [0, "Monthly rate cannot be negative"],
      default: 0
    },
    liveInCareRate: {
      type: Number,
      min: [0, "Live-in care rate cannot be negative"],
      default: 0
    }
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  accountStatus: {
    type: String,
    enum: Object.values(constants.ACCOUNT_STATUS),
    default: 'incomplete'
  },

  currentStatus: {
    type: String,
    enum: ['available', 'on_duty', 'busy', 'off_duty', 'on_leave'],
    default: 'available'
  },

  currentAssignment: {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    startDate: Date,
    endDate: Date,
    assignmentType: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'live_in']
    }
  },

  rating: {
    type: Number,
    min: [0, "Rating cannot be less than 0"],
    max: [5, "Rating cannot be more than 5"],
    default: 0
  },

  stats: {
    totalRequests: { type: Number, default: 0 },
    completedRequests: { type: Number, default: 0 },
    cancelledRequests: { type: Number, default: 0 },
    activeRequests: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    averageRating: {
      type: Number,
      min: [0, "Average rating cannot be negative"],
      max: [5, "Average rating cannot be more than 5"],
      default: 0
    },
    totalReviews: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 }, // in minutes
    _id: false
  },

  backgroundCheck: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'expired'],
      default: 'pending'
    },
    checkedAt: Date,
    expiresAt: Date,
    notes: String
  },

  bankDetails: {
    accountHolderName: { type: String, trim: true },
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    iban: { type: String, trim: true },
    _id: false
  }

}, { timestamps: true });

// Indexes
nurseSchema.index({ rating: -1 });
nurseSchema.index({ isVerified: 1, accountStatus: 1 });
nurseSchema.index({ currentStatus: 1 });
nurseSchema.index({ 'coverageArea.governorates': 1 });
nurseSchema.index({ 'coverageArea.cities': 1 });
nurseSchema.index({ 'professionalInfo.specialization': 1 });

// Virtual: Completion Percentage
nurseSchema.virtual('profileCompletionPercentage').get(function() {
  let completed = 0;
  const total = 10;

  if (this.nursingLicense?.licenseNumber) completed++;
  if (this.professionalInfo?.highestDegree) completed++;
  if (this.servicesOffered?.length > 0) completed++;
  if (this.availability?.workingHours?.length > 0) completed++;
  if (this.coverageArea?.governorates?.length > 0) completed++;
  if (this.pricing?.hourlyRate > 0) completed++;
  if (this.professionalInfo?.bio) completed++;
  if (this.nationalId?.nationalIdImageFront?.url) completed++;
  if (this.nursingDegreeCertificate?.url) completed++;
  if (this.isVerified) completed++;

  return Math.round((completed / total) * 100);
});

const Nurse = User.discriminator('nurse', nurseSchema);

module.exports = Nurse;