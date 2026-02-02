const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema(
  {
    // Patient & Doctor
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },

    // Consultation Details
    consultationDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    consultationType: {
      type: String,
      enum: [
        "in_person",
        "telemedicine",
        "emergency",
        "follow_up",
        "routine_checkup",
      ],
      required: true,
      default: "in_person",
    },

    // Chief Complaint
    chiefComplaint: {
      type: String,
      required: [true, "Chief complaint is required"],
      trim: true,
      maxlength: [500, "Chief complaint cannot exceed 500 characters"],
    },

    // History of Present Illness
    historyOfPresentIllness: {
      type: String,
      trim: true,
      maxlength: [2000, "History cannot exceed 2000 characters"],
    },

    // Vital Signs (recorded during consultation)
    vitalSigns: {
      bloodPressure: {
        systolic: {
          type: Number,
          min: [60, "Systolic BP too low"],
          max: [250, "Systolic BP too high"],
        },
        diastolic: {
          type: Number,
          min: [40, "Diastolic BP too low"],
          max: [150, "Diastolic BP too high"],
        },
      },
      heartRate: {
        type: Number,
        min: [30, "Heart rate too low"],
        max: [220, "Heart rate too high"],
      },
      temperature: {
        value: Number,
        unit: {
          type: String,
          enum: ["celsius", "fahrenheit"],
          default: "celsius",
        },
      },
      respiratoryRate: {
        type: Number,
        min: [8, "Respiratory rate too low"],
        max: [40, "Respiratory rate too high"],
      },
      oxygenSaturation: {
        type: Number,
        min: [70, "O2 saturation too low"],
        max: [100, "O2 saturation too high"],
      },
      weight: {
        type: Number,
        min: [0, "Weight cannot be negative"],
      },
      height: {
        type: Number,
        min: [0, "Height cannot be negative"],
      },
      bmi: Number,
      _id: false,
    },

    // Physical Examination
    physicalExamination: {
      generalAppearance: { type: String, trim: true },
      systemicExamination: [
        {
          system: {
            type: String,
            enum: [
              "cardiovascular",
              "respiratory",
              "gastrointestinal",
              "neurological",
              "musculoskeletal",
              "skin",
              "ent",
              "genitourinary",
              "endocrine",
              "lymphatic",
            ],
          },
          findings: { type: String, trim: true },
          _id: false,
        },
      ],
    },

    // Lab Tests & Investigations
    investigations: {
      labTests: [
        {
          testName: { type: String, trim: true, required: true },
          orderDate: { type: Date, default: Date.now },
          resultDate: Date,
          result: { type: String, trim: true },
          normalRange: { type: String, trim: true },
          status: {
            type: String,
            enum: ["ordered", "pending", "completed", "cancelled"],
            default: "ordered",
          },
          labName: { type: String, trim: true },
          reportFile: {
            url: String,
            publicId: String,
            _id: false,
          },
          _id: true,
        },
      ],

      imaging: [
        {
          imagingType: {
            type: String,
            enum: [
              "x_ray",
              "ct_scan",
              "mri",
              "ultrasound",
              "ecg",
              "eeg",
              "mammogram",
              "pet_scan",
            ],
            required: true,
          },
          bodyPart: { type: String, trim: true },
          orderDate: { type: Date, default: Date.now },
          reportDate: Date,
          findings: { type: String, trim: true },
          impression: { type: String, trim: true },
          radiologistName: { type: String, trim: true },
          imagingCenter: { type: String, trim: true },
          reportFile: {
            url: String,
            publicId: String,
            _id: false,
          },
          images: [
            {
              url: String,
              publicId: String,
              _id: false,
            },
          ],
          _id: true,
        },
      ],
    },

    // Diagnosis
    diagnosis: {
      primaryDiagnosis: {
        type: String,
        required: [true, "Primary diagnosis is required"],
        trim: true,
      },
      icdCode: { type: String, trim: true }, // ICD-10 code

      differentialDiagnosis: [
        {
          type: String,
          trim: true,
        },
      ],

      secondaryDiagnosis: [
        {
          diagnosis: { type: String, trim: true },
          icdCode: { type: String, trim: true },
          _id: false,
        },
      ],

      severity: {
        type: String,
        enum: ["mild", "moderate", "severe", "critical"],
        default: "moderate",
      },

      notes: { type: String, trim: true },
    },

    // Treatment Plan
    treatmentPlan: {
      medications: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Prescription",
        },
      ],

      procedures: [
        {
          procedureName: { type: String, trim: true, required: true },
          performedDate: Date,
          performedBy: { type: String, trim: true },
          notes: { type: String, trim: true },
          _id: true,
        },
      ],

      lifestyle: {
        dietRecommendations: { type: String, trim: true },
        exerciseRecommendations: { type: String, trim: true },
        restrictions: [{ type: String, trim: true }],
        advice: { type: String, trim: true },
      },

      referrals: [
        {
          specialistType: { type: String, trim: true },
          referredTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
          },
          reason: { type: String, trim: true },
          urgent: { type: Boolean, default: false },
          referralDate: { type: Date, default: Date.now },
          _id: true,
        },
      ],

      additionalInstructions: { type: String, trim: true },
    },

    // Follow-up
    followUp: {
      required: { type: Boolean, default: false },
      followUpDate: Date,
      followUpReason: { type: String, trim: true },
      followUpType: {
        type: String,
        enum: ["in_person", "telemedicine", "phone_call"],
      },
      status: {
        type: String,
        enum: ["scheduled", "completed", "cancelled", "no_show"],
        default: "scheduled",
      },
    },

    // AI Voice Assistant Data
    aiVoiceData: {
      audioRecording: {
        url: String,
        publicId: String,
        duration: Number, // in seconds
        _id: false,
      },
      transcription: {
        originalText: { type: String }, // Arabic transcription
        translatedText: { type: String }, // English translation
        language: { type: String, default: "ar" },
        confidence: { type: Number, min: 0, max: 1 },
      },
      aiGeneratedSummary: {
        summary: { type: String },
        keyPoints: [{ type: String }],
        generatedAt: Date,
        model: { type: String }, // e.g., 'gpt-4', 'whisper-large'
        reviewed: { type: Boolean, default: false },
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Doctor",
        },
        reviewedAt: Date,
      },
    },

    // Clinical Notes
    clinicalNotes: {
      type: String,
      trim: true,
      maxlength: [5000, "Clinical notes cannot exceed 5000 characters"],
    },

    // Attachments
    attachments: [
      {
        fileName: { type: String, trim: true },
        fileType: {
          type: String,
          enum: ["image", "pdf", "document", "other"],
        },
        url: String,
        publicId: String,
        uploadedAt: { type: Date, default: Date.now },
        description: { type: String, trim: true },
      },
    ],

    // Status & Metadata
    status: {
      type: String,
      enum: ["draft", "finalized", "amended", "deleted"],
      default: "draft",
      index: true,
    },

    finalizedAt: Date,

    amendmentHistory: [
      {
        amendedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Doctor",
        },
        amendedAt: { type: Date, default: Date.now },
        reason: { type: String, trim: true },
        changes: { type: String, trim: true },
        _id: true,
      },
    ],

    // Privacy & Access
    isConfidential: {
      type: Boolean,
      default: false,
    },
    accessLog: [
      {
        accessedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        accessedAt: { type: Date, default: Date.now },
        accessType: {
          type: String,
          enum: ["view", "edit", "print", "export"],
        },
        ipAddress: String,
        _id: false,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


medicalRecordSchema.index({ patientId: 1, consultationDate: -1 });
medicalRecordSchema.index({ doctorId: 1, consultationDate: -1 });
medicalRecordSchema.index({ appointmentId: 1 });
medicalRecordSchema.index({ status: 1 });
medicalRecordSchema.index({ "diagnosis.primaryDiagnosis": "text" });
medicalRecordSchema.index({ createdAt: -1 });


medicalRecordSchema.virtual("patientName", {
  ref: "Patient",
  localField: "patientId",
  foreignField: "_id",
  justOne: true,
});
medicalRecordSchema.virtual("doctorName", {
  ref: "Doctor",
  localField: "doctorId",
  foreignField: "_id",
  justOne: true,
});


medicalRecordSchema.methods.finalize = function () {
  if (this.status === "draft") {
    this.status = "finalized";
    this.finalizedAt = new Date();
  }
  return this.save();
};
medicalRecordSchema.methods.addAmendment = function (
  doctorId,
  reason,
  changes
) {
  this.amendmentHistory.push({
    amendedBy: doctorId,
    reason,
    changes,
    amendedAt: new Date(),
  });
  this.status = "amended";
  return this.save();
};
medicalRecordSchema.methods.logAccess = function (
  userId,
  accessType,
  ipAddress
) {
  this.accessLog.push({
    accessedBy: userId,
    accessType,
    ipAddress,
    accessedAt: new Date(),
  });
  return this.save();
};
medicalRecordSchema.statics.getPatientHistory = function (
  patientId,
  options = {}
) {
  const { limit = 50, skip = 0, startDate, endDate } = options;
  let query = { patientId, status: { $ne: "deleted" } };
  if (startDate || endDate) {
    query.consultationDate = {};
    if (startDate) query.consultationDate.$gte = new Date(startDate);
    if (endDate) query.consultationDate.$lte = new Date(endDate);
  }
  return this.find(query)
    .sort({ consultationDate: -1 })
    .limit(limit)
    .skip(skip)
    .populate(
      "doctorId",
      "firstName lastName professionalInfo.primarySpecialization"
    )
    .populate("appointmentId");
};
const MedicalRecord = mongoose.model("MedicalRecord", medicalRecordSchema);
module.exports = MedicalRecord;
