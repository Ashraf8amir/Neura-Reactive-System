# File Tree: Real-Time Digital Twin Integrated Healthcare Monitoring System

```
├── 📁 docs
│   └── 📄 schemaPatient.excalidraw
├── 📁 public
│   └── 🌐 index.html
├── 📁 scripts
├── 📁 src
│   ├── 📁 config
│   │   ├── 📄 cloudinary.js
│   │   ├── 📄 config.js
│   │   ├── 📄 database.js
│   │   └── 📄 resend.js
│   ├── 📁 core
│   │   ├── 📄 apiResponse.js
│   │   ├── 📄 appError.js
│   │   ├── 📄 httpStatus.js
│   │   ├── 📄 logger.js
│   │   └── 📄 roles.js
│   ├── 📁 jobs
│   ├── 📁 modules
│   │   ├── 📁 admin
│   │   │   ├── 📄 admin.controller.js
│   │   │   ├── 📄 admin.routes.js
│   │   │   ├── 📄 admin.service.js
│   │   │   └── 📄 admin.validator.js
│   │   ├── 📁 ai-voice
│   │   ├── 📁 appointments
│   │   ├── 📁 auth
│   │   │   ├── 📄 auth.controller.js
│   │   │   ├── 📄 auth.helper.js
│   │   │   ├── 📄 auth.routes.js
│   │   │   ├── 📄 auth.service.js
│   │   │   └── 📄 auth.validator.js
│   │   ├── 📁 digital-twin
│   │   │   └── 📄 digitalTwin.model.js
│   │   ├── 📁 doctors
│   │   │   ├── 📄 doctor.controller.js
│   │   │   ├── 📄 doctor.helper.js
│   │   │   ├── 📄 doctor.model.js
│   │   │   ├── 📄 doctor.route.js
│   │   │   ├── 📄 doctor.service.js
│   │   │   └── 📄 doctor.validator.js
│   │   ├── 📁 notifications
│   │   ├── 📁 nurses
│   │   │   └── 📄 nurse.model.js
│   │   ├── 📁 patients
│   │   │   ├── 📄 patient.constant.js
│   │   │   ├── 📄 patient.controller.js
│   │   │   ├── 📄 patient.helper.js
│   │   │   ├── 📄 patient.model.js
│   │   │   ├── 📄 patient.route.js
│   │   │   ├── 📄 patient.service.js
│   │   │   └── 📄 patient.validator.js
│   │   ├── 📁 payments
│   │   ├── 📁 pharmacies
│   │   │   └── 📄 pharmacy.model.js
│   │   └── 📁 therapy-rooms
│   ├── 📁 routes
│   │   └── 📄 index.js
│   ├── 📁 shared
│   │   ├── 📁 constants
│   │   │   └── 📄 enums.js
│   │   ├── 📁 middlewares
│   │   │   ├── 📄 asyncWrapper.middleware.js
│   │   │   ├── 📄 globalErrorHandler.middleware.js
│   │   │   ├── 📄 rateLimiter.middleware.js
│   │   │   ├── 📄 roleCheck.middleware.js
│   │   │   ├── 📄 upload.middleware.js
│   │   │   ├── 📄 validation.middleware.js
│   │   │   └── 📄 verifyToken.middleware.js
│   │   ├── 📁 models
│   │   │   ├── 📄 medicalRecord.model.js
│   │   │   └── 📄 user.model.js
│   │   ├── 📁 utils
│   │   │   ├── 📄 buildPatchUpdate.js
│   │   │   ├── 📄 emailSender.js
│   │   │   ├── 📄 encryption.js
│   │   │   └── 📄 globalHelper.js
│   │   └── 📁 validators
│   │       └── 📄 common.validator.js
│   ├── 📁 templates
│   │   └── 📁 emails
│   │       ├── 📁 auth
│   │       │   ├── 📄 change-password.ejs
│   │       │   ├── 📄 reset-password.ejs
│   │       │   ├── 📄 verify-otp.ejs
│   │       │   └── 📄 welcome.ejs
│   │       └── 📁 doctors
│   │           ├── 📄 doctor-approval.ejs
│   │           ├── 📄 doctor-rejection.ejs
│   │           └── 📄 doctor-verification-request.ejs
│   └── 📄 app.js
├── ⚙️ .gitignore
├── ⚙️ package-lock.json
├── ⚙️ package.json
├── 📄 server.js
└── ⚙️ vercel.json
```