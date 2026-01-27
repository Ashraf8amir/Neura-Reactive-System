const mongoose = require('mongoose');
const User = require('../../shared/models/user.model');
const constants = require('../../shared/constants/enums');
const validators = require('../../shared/validators/common.validator');

const pharmacySchema = new mongoose.Schema({
  businessInfo: {
    pharmacyName: {
      type: String,
      required: [true, "Pharmacy name is required"],
      trim: true
    },
    commercialRegistrationNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    taxRegistrationNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    pharmacyLicenseNumber: {
      type: String,
      unique: true,
      sparse: true,
      required: [true, "Pharmacy license number is required"]
    },
    licenseExpiryDate: Date,
    establishedYear: { type: Number },
    _id: false
  },

  documents: {
    pharmacyLicense: {
      url: String,
      publicId: String,
      _id: false
    },
    commercialRegistration: {
      url: String,
      publicId: String,
      _id: false
    },
    taxCard: {
      url: String,
      publicId: String,
      _id: false
    },
    ownerNationalId: {
      front: {
        url: String,
        publicId: String,
        _id: false
      },
      back: {
        url: String,
        publicId: String,
        _id: false
      }
    }
  },

  // Pharmacist Information
  pharmacistInfo: {
    pharmacistName: {
      type: String,
      required: [true, "Pharmacist name is required"],
      trim: true
    },
    pharmacistLicenseNumber: {
      type: String,
      required: [true, "Pharmacist license number is required"],
      unique: true,
      sparse: true
    },
    syndicateRegistrationNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    pharmacistPhone: {
      type: String,
      validate: validators.egyptianPhone
    },
    pharmacistLicense: {
      url: String,
      publicId: String,
      _id: false
    }
  },

  // Location & Contact
  location: {
    governorate: {
      type: String,
      required: [true, "Governorate is required"],
      trim: true
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true
    },
    street: {
      type: String,
      required: [true, "Street is required"],
      trim: true
    },
    buildingNumber: { type: String, trim: true },
    floor: { type: String, trim: true },
    landmark: { type: String, trim: true },
    
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, "Invalid latitude"],
        max: [90, "Invalid latitude"]
      },
      longitude: {
        type: Number,
        min: [-180, "Invalid longitude"],
        max: [180, "Invalid longitude"]
      },
      _id: false
    },
    _id: false
  },

  contactInfo: {
    primaryPhone: {
      type: String,
      required: [true, "Primary phone is required"],
      validate: validators.egyptianPhone
    },
    secondaryPhone: {
      type: String,
      validate: validators.egyptianPhone
    },
    whatsappNumber: {
      type: String,
      validate: validators.egyptianPhone
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    website: { type: String, trim: true },
    facebookPage: { type: String, trim: true },
    _id: false
  },

  // Operating Hours
  operatingHours: [
    {
      day: {
        type: String,
        enum: Object.values(constants.DAYS_OF_WEEK),
        required: true
      },
      isOpen: {
        type: Boolean,
        default: true
      },
      openTime: {
        type: String,
        validate: validators.timeFormat
      },
      closeTime: {
        type: String,
        validate: validators.timeFormat
      },
      is24Hours: {
        type: Boolean,
        default: false
      },
      _id: false
    }
  ],

  // Services
  services: {
    homeDelivery: {
      enabled: { type: Boolean, default: false },
      deliveryFee: { type: Number, default: 0 },
      freeDeliveryThreshold: { type: Number, default: 0 },
      maxDeliveryDistance: { type: Number, default: 5 }, // km
      estimatedDeliveryTime: { type: Number, default: 60 } // minutes
    },
    prescriptionFulfillment: {
      enabled: { type: Boolean, default: true },
      biddingEnabled: { type: Boolean, default: true }
    },
    medicineReservation: {
      enabled: { type: Boolean, default: false }
    },
    consultationService: {
      enabled: { type: Boolean, default: false },
      consultationFee: { type: Number, default: 0 }
    },
    insuranceAccepted: {
      enabled: { type: Boolean, default: false },
      insuranceCompanies: [{
        type: String,
        trim: true
      }]
    },
    installmentPayment: {
      enabled: { type: Boolean, default: false },
      providers: [{
        providerName: String,
        minAmount: Number,
        maxInstallments: Number,
        _id: false
      }]
    }
  },

  // Inventory (Basic tracking)
  inventory: {
    totalProducts: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
    autoUpdateEnabled: { type: Boolean, default: false }
  },

  // Account Status
  isVerified: {
    type: Boolean,
    default: false
  },

  accountStatus: {
    type: String,
    enum: Object.values(constants.ACCOUNT_STATUS),
    default: 'incomplete'
  },

  operationalStatus: {
    type: String,
    enum: ['open', 'closed', 'temporarily_closed', 'on_break'],
    default: 'closed'
  },

  // Ratings & Reviews
  rating: {
    type: Number,
    min: [0, "Rating cannot be less than 0"],
    max: [5, "Rating cannot be more than 5"],
    default: 0
  },

  // Statistics
  stats: {
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    averageRating: {
      type: Number,
      min: [0, "Average rating cannot be negative"],
      max: [5, "Average rating cannot be more than 5"],
      default: 0
    },
    totalReviews: { type: Number, default: 0 },
    totalBidsWon: { type: Number, default: 0 },
    totalBidsParticipated: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 }, // minutes
    _id: false
  },

  // Bank Details (for payments)
  bankDetails: {
    accountHolderName: { type: String, trim: true },
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    iban: { type: String, trim: true },
    _id: false
  },

  // Subscription (if applicable)
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: false },
    features: [{
      type: String
    }],
    _id: false
  },

  // Featured/Premium listing
  isFeatured: {
    type: Boolean,
    default: false
  },

  featuredUntil: Date

}, { timestamps: true });

// Indexes
pharmacySchema.index({ 'location.governorate': 1, 'location.city': 1 });
pharmacySchema.index({ 'location.coordinates': '2dsphere' });
pharmacySchema.index({ rating: -1 });
pharmacySchema.index({ isVerified: 1, accountStatus: 1 });
pharmacySchema.index({ operationalStatus: 1 });
pharmacySchema.index({ 'businessInfo.pharmacyName': 'text' });

// Virtual: Is Open Now
pharmacySchema.virtual('isOpenNow').get(function() {
  const now = new Date();
  const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  
  const todayHours = this.operatingHours.find(h => h.day === currentDay);
  
  if (!todayHours || !todayHours.isOpen) {
    return false;
  }
  
  if (todayHours.is24Hours) {
    return true;
  }
  
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
});

// Virtual: Profile Completion
pharmacySchema.virtual('profileCompletionPercentage').get(function() {
  let completed = 0;
  const total = 12;

  if (this.businessInfo?.pharmacyName) completed++;
  if (this.businessInfo?.pharmacyLicenseNumber) completed++;
  if (this.pharmacistInfo?.pharmacistName) completed++;
  if (this.pharmacistInfo?.pharmacistLicenseNumber) completed++;
  if (this.location?.governorate) completed++;
  if (this.location?.city) completed++;
  if (this.contactInfo?.primaryPhone) completed++;
  if (this.operatingHours?.length > 0) completed++;
  if (this.documents?.pharmacyLicense?.url) completed++;
  if (this.documents?.pharmacistLicense?.url) completed++;
  if (this.services?.prescriptionFulfillment?.enabled) completed++;
  if (this.isVerified) completed++;

  return Math.round((completed / total) * 100);
});

const Pharmacy = User.discriminator('pharmacy', pharmacySchema);

module.exports = Pharmacy;