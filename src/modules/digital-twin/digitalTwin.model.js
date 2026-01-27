const mongoose = require('mongoose');

const digitalTwinSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    unique: true,
    index: true
  },

  currentState: {
    lastUpdated: {
      type: Date,
      default: Date.now
    },

    vitals: {
      bloodPressure: {
        systolic: Number,
        diastolic: Number,
        trend: {
          type: String,
          enum: ['improving', 'stable', 'worsening', 'unknown'],
          default: 'unknown'
        }
      },
      heartRate: {
        value: Number,
        trend: {
          type: String,
          enum: ['improving', 'stable', 'worsening', 'unknown'],
          default: 'unknown'
        }
      },
      weight: {
        value: Number,
        trend: {
          type: String,
          enum: ['increasing', 'stable', 'decreasing', 'unknown'],
          default: 'unknown'
        }
      },
      height: Number,
      bmi: {
        value: Number,
        category: {
          type: String,
          enum: ['underweight', 'normal', 'overweight', 'obese', 'unknown'],
          default: 'unknown'
        }
      },
      glucose: {
        value: Number,
        unit: { type: String, default: 'mg/dL' },
        trend: {
          type: String,
          enum: ['improving', 'stable', 'worsening', 'unknown'],
          default: 'unknown'
        }
      },
      cholesterol: {
        total: Number,
        ldl: Number,
        hdl: Number,
        triglycerides: Number,
        trend: {
          type: String,
          enum: ['improving', 'stable', 'worsening', 'unknown'],
          default: 'unknown'
        }
      },
      temperature: Number,
      oxygenSaturation: Number,
      respiratoryRate: Number
    },

    // Additional Health Metrics
    additionalMetrics: {
      hba1c: Number, // Diabetes control
      creatinine: Number, // Kidney function
      egfr: Number, // Kidney function
      alt: Number, // Liver function
      ast: Number, // Liver function
      tsh: Number, // Thyroid function
      vitaminD: Number,
      hemoglobin: Number,
      whiteBloodCells: Number,
      platelets: Number
    }
  },

  // Health Risk Scores
  riskScores: {
    cardiovascularRisk: {
      score: {
        type: Number,
        min: [0, "Risk score cannot be negative"],
        max: [100, "Risk score cannot exceed 100"]
      },
      level: {
        type: String,
        enum: ['low', 'moderate', 'high', 'very_high'],
        default: 'low'
      },
      factors: [{
        factor: String,
        impact: {
          type: String,
          enum: ['low', 'moderate', 'high']
        },
        _id: false
      }],
      calculatedAt: Date
    },

    diabetesRisk: {
      score: {
        type: Number,
        min: [0, "Risk score cannot be negative"],
        max: [100, "Risk score cannot exceed 100"]
      },
      level: {
        type: String,
        enum: ['low', 'moderate', 'high', 'very_high'],
        default: 'low'
      },
      factors: [{
        factor: String,
        impact: {
          type: String,
          enum: ['low', 'moderate', 'high']
        },
        _id: false
      }],
      calculatedAt: Date
    },

    strokeRisk: {
      score: {
        type: Number,
        min: [0, "Risk score cannot be negative"],
        max: [100, "Risk score cannot exceed 100"]
      },
      level: {
        type: String,
        enum: ['low', 'moderate', 'high', 'very_high'],
        default: 'low'
      },
      calculatedAt: Date
    },

    overallHealthScore: {
      score: {
        type: Number,
        min: [0, "Health score cannot be negative"],
        max: [100, "Health score cannot exceed 100"]
      },
      category: {
        type: String,
        enum: ['poor', 'fair', 'good', 'very_good', 'excellent'],
        default: 'fair'
      },
      calculatedAt: Date
    }
  },

  // Predictions
  predictions: [{
    predictionType: {
      type: String,
      enum: [
        'weight_trajectory',
        'blood_pressure_forecast',
        'glucose_forecast',
        'disease_progression',
        'medication_response',
        'lifestyle_impact',
        'complication_risk'
      ],
      required: true
    },
    
    timeframe: {
      duration: { type: Number, required: true }, // in days
      unit: {
        type: String,
        enum: ['days', 'weeks', 'months', 'years'],
        default: 'days'
      }
    },

    predictedValues: [{
      date: Date,
      value: mongoose.Schema.Types.Mixed,
      confidence: {
        type: Number,
        min: [0, "Confidence cannot be less than 0"],
        max: [1, "Confidence cannot be more than 1"]
      },
      _id: false
    }],

    confidenceInterval: {
      lower: [mongoose.Schema.Types.Mixed],
      upper: [mongoose.Schema.Types.Mixed]
    },

    basedOn: {
      dataPoints: Number,
      startDate: Date,
      endDate: Date,
      factors: [String]
    },

    modelUsed: {
      type: String, // e.g., 'Prophet', 'LSTM', 'Linear Regression'
      default: 'Prophet'
    },

    accuracy: {
      type: Number,
      min: [0, "Accuracy cannot be less than 0"],
      max: [1, "Accuracy cannot be more than 1"]
    },

    createdAt: {
      type: Date,
      default: Date.now
    },

    expiresAt: Date,

    notes: String
  }],

  // Simulations (What-If Scenarios)
  simulations: [{
    simulationName: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    scenarioType: {
      type: String,
      enum: [
        'weight_change',
        'smoking_cessation',
        'exercise_increase',
        'diet_modification',
        'medication_change',
        'stress_reduction',
        'sleep_improvement',
        'alcohol_reduction',
        'combined_lifestyle'
      ],
      required: true
    },

    inputParameters: {
      weightChange: Number, // kg (+/-)
      exerciseMinutes: Number, // per week
      smokingStatus: {
        type: String,
        enum: ['quit', 'reduce', 'continue']
      },
      dietChange: {
        type: String,
        enum: ['mediterranean', 'low_carb', 'low_fat', 'balanced', 'vegetarian']
      },
      sleepHours: Number,
      stressLevel: {
        type: String,
        enum: ['low', 'moderate', 'high']
      },
      medicationChanges: [{
        medication: String,
        action: {
          type: String,
          enum: ['add', 'remove', 'increase_dose', 'decrease_dose']
        },
        _id: false
      }],
      alcoholConsumption: {
        type: String,
        enum: ['none', 'light', 'moderate', 'heavy']
      },
      duration: { type: Number, required: true } // days
    },

    predictedOutcomes: {
      weight: {
        change: Number,
        finalValue: Number
      },
      bloodPressure: {
        systolic: { change: Number, finalValue: Number },
        diastolic: { change: Number, finalValue: Number }
      },
      glucose: {
        change: Number,
        finalValue: Number
      },
      cholesterol: {
        total: { change: Number, finalValue: Number },
        ldl: { change: Number, finalValue: Number },
        hdl: { change: Number, finalValue: Number }
      },
      cardiovascularRisk: {
        change: Number,
        finalScore: Number
      },
      diabetesRisk: {
        change: Number,
        finalScore: Number
      },
      overallHealthScore: {
        change: Number,
        finalScore: Number
      },
      estimatedBenefits: [String],
      potentialRisks: [String]
    },

    confidenceLevel: {
      type: Number,
      min: [0, "Confidence cannot be less than 0"],
      max: [1, "Confidence cannot be more than 1"]
    },

    trajectory: [{
      day: Number,
      metrics: {
        weight: Number,
        bloodPressure: {
          systolic: Number,
          diastolic: Number
        },
        glucose: Number,
        heartRate: Number
      },
      _id: false
    }],

    createdAt: {
      type: Date,
      default: Date.now
    },

    sharedWithDoctor: {
      type: Boolean,
      default: false
    },

    doctorFeedback: {
      doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
      },
      comments: String,
      recommended: Boolean,
      reviewedAt: Date
    }
  }],

  // Health Trends Analysis
  trends: {
    weightTrend: {
      direction: {
        type: String,
        enum: ['increasing', 'decreasing', 'stable', 'fluctuating'],
        default: 'stable'
      },
      averageChange: Number, // per month
      lastCalculated: Date
    },
    
    bloodPressureTrend: {
      direction: {
        type: String,
        enum: ['improving', 'worsening', 'stable', 'fluctuating'],
        default: 'stable'
      },
      lastCalculated: Date
    },

    glucoseTrend: {
      direction: {
        type: String,
        enum: ['improving', 'worsening', 'stable', 'fluctuating'],
        default: 'stable'
      },
      lastCalculated: Date
    },

    overallTrend: {
      direction: {
        type: String,
        enum: ['improving', 'worsening', 'stable'],
        default: 'stable'
      },
      lastCalculated: Date
    }
  },

  // Recommendations (AI-Generated)
  recommendations: [{
    category: {
      type: String,
      enum: ['diet', 'exercise', 'medication', 'lifestyle', 'screening', 'specialist_referral'],
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    recommendation: {
      type: String,
      required: true,
      trim: true
    },
    reason: {
      type: String,
      trim: true
    },
    expectedImpact: {
      type: String,
      trim: true
    },
    generatedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'acknowledged', 'in_progress', 'completed', 'dismissed'],
      default: 'pending'
    },
    acknowledgedAt: Date,
    completedAt: Date
  }],

  // Alerts & Warnings
  alerts: [{
    alertType: {
      type: String,
      enum: ['critical', 'warning', 'info'],
      required: true
    },
    category: {
      type: String,
      enum: ['vital_signs', 'medication', 'lab_results', 'risk_score', 'trend', 'simulation'],
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    acknowledgedAt: Date,
    resolvedAt: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],

  // Model Metadata
  modelMetadata: {
    lastTrainingDate: Date,
    trainingDataPoints: Number,
    modelVersion: { type: String, default: '1.0.0' },
    accuracy: {
      type: Number,
      min: [0, "Accuracy cannot be less than 0"],
      max: [1, "Accuracy cannot be more than 1"]
    },
    lastCalibrationDate: Date
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  lastSyncedWithPatient: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
digitalTwinSchema.index({ patientId: 1 });
digitalTwinSchema.index({ 'currentState.lastUpdated': -1 });
digitalTwinSchema.index({ 'riskScores.overallHealthScore.score': -1 });
digitalTwinSchema.index({ isActive: 1 });

// Virtual: Patient Details
digitalTwinSchema.virtual('patient', {
  ref: 'Patient',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true
});

// Method: Update Current State
digitalTwinSchema.methods.updateCurrentState = function(newVitals) {
  this.currentState.vitals = { ...this.currentState.vitals, ...newVitals };
  this.currentState.lastUpdated = new Date();
  this.lastSyncedWithPatient = new Date();
  return this.save();
};

// Method: Calculate BMI
digitalTwinSchema.methods.calculateBMI = function() {
  const weight = this.currentState.vitals.weight?.value;
  const height = this.currentState.vitals.height;
  
  if (weight && height) {
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    let category = 'unknown';
    if (bmi < 18.5) category = 'underweight';
    else if (bmi < 25) category = 'normal';
    else if (bmi < 30) category = 'overweight';
    else category = 'obese';
    
    this.currentState.vitals.bmi = { value: bmi.toFixed(1), category };
  }
  
  return this.save();
};

// Method: Add Simulation
digitalTwinSchema.methods.addSimulation = function(simulationData) {
  this.simulations.push(simulationData);
  return this.save();
};

// Method: Add Prediction
digitalTwinSchema.methods.addPrediction = function(predictionData) {
  this.predictions.push(predictionData);
  return this.save();
};

// Method: Add Alert
digitalTwinSchema.methods.addAlert = function(alertData) {
  this.alerts.push({
    ...alertData,
    createdAt: new Date(),
    isActive: true
  });
  return this.save();
};

// Method: Calculate Overall Health Score
digitalTwinSchema.methods.calculateOverallHealthScore = function() {
  // Simplified scoring logic - يمكن تعقيده حسب الحاجة
  let score = 100;
  
  const vitals = this.currentState.vitals;
  
  // Blood Pressure impact
  if (vitals.bloodPressure?.systolic > 140 || vitals.bloodPressure?.diastolic > 90) {
    score -= 15;
  }
  
  // BMI impact
  const bmiValue = vitals.bmi?.value;
  if (bmiValue) {
    if (bmiValue < 18.5 || bmiValue > 30) score -= 10;
    else if (bmiValue > 25) score -= 5;
  }
  
  // Glucose impact
  if (vitals.glucose?.value > 126) {
    score -= 15;
  }
  
  // Determine category
  let category = 'poor';
  if (score >= 90) category = 'excellent';
  else if (score >= 75) category = 'very_good';
  else if (score >= 60) category = 'good';
  else if (score >= 45) category = 'fair';
  
  this.riskScores.overallHealthScore = {
    score: Math.max(0, score),
    category,
    calculatedAt: new Date()
  };
  
  return this.save();
};

// Static: Get Active Twins
digitalTwinSchema.statics.getActiveTwins = function() {
  return this.find({ isActive: true })
    .populate('patientId', 'firstName lastName email phone')
    .sort({ 'currentState.lastUpdated': -1 });
};

// Static: Get High Risk Patients
digitalTwinSchema.statics.getHighRiskPatients = function() {
  return this.find({
    isActive: true,
    $or: [
      { 'riskScores.cardiovascularRisk.level': { $in: ['high', 'very_high'] } },
      { 'riskScores.diabetesRisk.level': { $in: ['high', 'very_high'] } },
      { 'riskScores.strokeRisk.level': { $in: ['high', 'very_high'] } }
    ]
  }).populate('patientId', 'firstName lastName phone');
};

const DigitalTwin = mongoose.model('DigitalTwin', digitalTwinSchema);

module.exports = DigitalTwin;
