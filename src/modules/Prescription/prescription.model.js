const mongoose = require('mongoose');
const { prescriptionConstants } = require('./prescription.constant');

const prescriptionSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment reference is required'],
      index: true
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor reference is required'],
      index: true
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required'],
      index: true
    },

    prescriptionNumber: {
      type: String,
      unique: true,
      required: true,
      index: true
    },

    prescriptionDate: {
      type: Date,
      default: Date.now,
      required: true
    },

    diagnosis: {
      type: String,
      required: [true, 'Diagnosis is required'],
      trim: true,
      maxlength: [1000, 'Diagnosis cannot exceed 1000 characters']
    },

    chiefComplaint: {
      type: String,
      trim: true,
      maxlength: [500, 'Chief complaint cannot exceed 500 characters']
    },

    medications: [
      {
        medicationName: {
          type: String,
          required: [true, 'Medication name is required'],
          trim: true
        },
        scientificName: {
          type: String,
          trim: true
        },
        dosage: {
          type: String,
          required: [true, 'Dosage is required'],
          trim: true,
        },
        frequency: {
          type: String,
          required: [true, 'Frequency is required'],
          trim: true,
        },
        duration: {
          type: String,
          required: [true, 'Duration is required'],
          trim: true,
        },
        route: {
          type: String,
          enum: {
            values: Object.values(prescriptionConstants.ROUTE),
            message: '{VALUE} is not a valid route'
          },
          default: prescriptionConstants.ROUTE.ORAL
        },
        timing: {
          type: String,
          enum: {
            values: Object.values(prescriptionConstants.TIMING),
            message: '{VALUE} is not a valid timing'
          },
          default: prescriptionConstants.TIMING.ANYTIME
        },
        instructions: {
          type: String,
          trim: true,
          maxlength: [500, 'Instructions cannot exceed 500 characters']
        },
        quantity: {
          type: Number,
          min: [1, 'Quantity must be at least 1']
        },
        refillsAllowed: {
          type: Number,
          default: 0,
          min: [0, 'Refills cannot be negative']
        },
        statusMedication: {
          type: String,
          enum: {
            values: Object.values(prescriptionConstants.STATES_MED),
            message: '{VALUE} is not a valid status'
          },
          default: prescriptionConstants.STATES_MED.ACTIVE
        },
        dispensed: {
          type: Boolean,
          default: false
        },
        dispensedDate: Date,
        dispensedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        pharmacy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      }
    ],

    laboratoryTests: [
      {
        testName: {
          type: String,
          required: true,
          trim: true
        },
        testType: {
          type: String,
          enum: Object.values(prescriptionConstants.TEST_TYPES),
          default: prescriptionConstants.TEST_TYPES.OTHER
        },
        urgency: {
          type: String,
          enum: Object.values(prescriptionConstants.URGENCY_TEST),
          default: prescriptionConstants.URGENCY_TEST.ROUTINE
        },
        instructions: {
          type: String,
          trim: true
        },
        status: {
          type: String,
          enum: Object.values(prescriptionConstants.STATES_TEST),
          default: prescriptionConstants.STATES_TEST.ORDERED
        },
        scheduledDate: Date,
        resultDate: Date,
        result: {
          type: String,
          trim: true
        }
      }
    ],

    clinicalNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Clinical notes cannot exceed 2000 characters']
    },

    patientInstructions: {
      type: String,
      trim: true,
      maxlength: [1000, 'Patient instructions cannot exceed 1000 characters']
    },

    dietaryAdvice: {
      type: String,
      trim: true,
      maxlength: [500, 'Dietary advice cannot exceed 500 characters']
    },

    allergiesNoted: [
      {
        type: String,
        trim: true
      }
    ],

    currentMedications: [
      {
        type: String,
        trim: true
      }
    ],

    validUntil: {
      type: Date,
      default: function() {
        const date = new Date();
        date.setMonth(date.getMonth() + 3);
        return date;
      }
    },

    status: {
      type: String,
      enum: {
        values: Object.values(prescriptionConstants.STATUSES),
        message: '{VALUE} is not a valid status'
      },
      default: prescriptionConstants.STATUSES.ACTIVE,
      index: true
    },

    revisedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription'
    },

    revisionHistory: [
      {
        revisedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        revisedAt: Date,
        reason: String,
        changes: String,
        _id: false
      }
    ],

    signature: {
      doctorSignature: {
        type: String, 
        required: false
      },
      signedAt: Date,
      ipAddress: String
    },

    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    printHistory: [
      {
        printedAt: Date,
        printedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        ipAddress: String,
        _id: false
      }
    ],

    dispensingHistory: [
      {
        dispensedAt: Date,
        dispensedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        pharmacy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        medications: [String], 
        notes: String,
        _id: false
      }
    ],

    internalNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Internal notes cannot exceed 1000 characters']
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },

    deletedAt: Date,

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== INDEXES ====================
prescriptionSchema.index({ doctor: 1, prescriptionDate: -1 });
prescriptionSchema.index({ patient: 1, prescriptionDate: -1 });
prescriptionSchema.index({ appointment: 1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ prescriptionDate: -1 });
prescriptionSchema.index({ 'medications.medicationName': 1 });

prescriptionSchema.index({ 
  doctor: 1, 
  patient: 1, 
  prescriptionDate: -1 
});

// ==================== VIRTUALS ====================
prescriptionSchema.virtual('isExpired').get(function() {
  return this.validUntil < new Date();
});

prescriptionSchema.virtual('isValid').get(function() {
  return this.status === 'active' && !this.isExpired;
});

prescriptionSchema.virtual('daysUntilExpiry').get(function() {
  if (this.isExpired) return 0;
  const days = Math.ceil((this.validUntil - new Date()) / (1000 * 60 * 60 * 24));
  return days;
});

prescriptionSchema.virtual('activeMedications').get(function() {
  return this.medications.filter(med => med.status === 'active');
});

prescriptionSchema.virtual('completedMedications').get(function() {
  return this.medications.filter(med => med.status === 'completed');
});

// ==================== PRE HOOKS ====================
prescriptionSchema.pre(/^find/, async function() {
  this.find({ isDeleted: { $ne: true } });
});

prescriptionSchema.pre('save', async function() {
  if (this.isNew && !this.prescriptionNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      }
    });
    
    this.prescriptionNumber = `RX-${year}${month}${day}-${String(count + 1).padStart(4, '0')}`;
  }
  
});

prescriptionSchema.pre('save', async function() {
  if (this.validUntil < new Date() && this.status === 'active') {
    this.status = 'expired';
  }
});

// ==================== METHODS ====================
prescriptionSchema.methods.cancel = function(userId, reason) {
  this.status = 'cancelled';
  this.revisionHistory.push({
    revisedBy: userId,
    revisedAt: new Date(),
    reason: reason,
    changes: 'Prescription cancelled'
  });
  return this.save();
};

prescriptionSchema.methods.complete = function() {
  this.status = 'completed';
  this.medications.forEach(med => {
    if (med.status === 'active') {
      med.status = 'completed';
    }
  });
  return this.save();
};

prescriptionSchema.methods.revise = function(userId, changes, reason) {
  const revisedPrescription = new this.constructor({
    ...this.toObject(),
    _id: undefined,
    prescriptionNumber: undefined,
    revisedFrom: this._id,
    revisionHistory: [
      {
        revisedBy: userId,
        revisedAt: new Date(),
        reason: reason,
        changes: changes
      }
    ]
  });
  
  // Mark current as revised
  this.status = 'revised';
  this.revisedTo = revisedPrescription._id;
  
  return Promise.all([this.save(), revisedPrescription.save()]);
};

prescriptionSchema.methods.addPrintRecord = function(userId, ipAddress) {
  this.printHistory.push({
    printedAt: new Date(),
    printedBy: userId,
    ipAddress: ipAddress
  });
  return this.save();
};

prescriptionSchema.methods.recordDispensing = function(userId, pharmacyId, medicationNames, notes) {
  this.dispensingHistory.push({
    dispensedAt: new Date(),
    dispensedBy: userId,
    pharmacy: pharmacyId,
    medications: medicationNames,
    notes: notes
  });
  
  // Mark medications as dispensed
  medicationNames.forEach(medName => {
    const medication = this.medications.find(m => m.medicationName === medName);
    if (medication) {
      medication.dispensed = true;
      medication.dispensedDate = new Date();
      medication.dispensedBy = userId;
      medication.pharmacy = pharmacyId;
    }
  });
  
  return this.save();
};

// ==================== STATICS ====================
prescriptionSchema.statics.getByAppointment = function(appointmentId) {
  return this.find({ appointment: appointmentId })
    .populate('doctor', 'firstName lastName professionalInfo.primarySpecialization')
    .populate('patient', 'firstName lastName phone email')
    .sort({ createdAt: -1 });
};

prescriptionSchema.statics.getByPatient = function(patientId, limit = 10) {
  return this.find({ patient: patientId })
    .populate('doctor', 'firstName lastName professionalInfo.primarySpecialization')
    .populate('appointment', 'appointmentNumber scheduledDate')
    .sort({ prescriptionDate: -1 })
    .limit(limit);
};

prescriptionSchema.statics.getByDoctor = function(doctorId, limit = 10) {
  return this.find({ doctor: doctorId })
    .populate('patient', 'firstName lastName phone email')
    .populate('appointment', 'appointmentNumber scheduledDate')
    .sort({ prescriptionDate: -1 })
    .limit(limit);
};

prescriptionSchema.statics.getActivePrescriptions = function(patientId) {
  return this.find({
    patient: patientId,
    status: 'active',
    validUntil: { $gte: new Date() }
  })
  .populate('doctor', 'firstName lastName')
  .sort({ prescriptionDate: -1 });
};

prescriptionSchema.statics.getExpiringPrescriptions = function(daysAhead = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return this.find({
    status: 'active',
    validUntil: {
      $gte: new Date(),
      $lte: futureDate
    }
  })
  .populate('doctor', 'firstName lastName')
  .populate('patient', 'firstName lastName phone email');
};

// ==================== TRANSFORM ====================
prescriptionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    delete ret.internalNotes;
    delete ret.isDeleted;
    delete ret.deletedAt;
    delete ret.deletedBy;
    return ret;
  }
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;