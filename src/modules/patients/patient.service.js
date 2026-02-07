const Patient = require('./patient.model');
const AppError = require('../../core/appError');
const { HTTP_STATUS_TEXT } = require('../../shared/constants/enums.js');
const patientHelper = require('./patient.helper');
const { buildPatchUpdate } = require('../../shared/utils/globalHelper.js');




class PatientService {
    async getPatientByIdService(patientId, selectFields = '') {
        const query = Patient.findById(patientId);
        if (selectFields) query.select(selectFields);
        
        const patient = await query;
        if (!patient)  throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'Patient not found');
        
        return patient;
    };
    async getProfileCompletenessService(patientId) { 
        const patient = await this.getPatientByIdService(patientId);
        const { completeness, missing } = patientHelper.basicInfoCompleteness(patient);

        return { completeness, missing };
    };

    async getBasicInfoService(patientId) { 
        const patient = await Patient.findById(patientId)
            .select('email firstName lastName role dateOfBirth gender height weight \
                bloodType nationalId maritalStatus phone address nationality profileImage');
        
        if (!patient) throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'Patient not found');

        return patient;
    };
    async updateBasicInfoService(patientId, updateData) {
        const patient = await Patient.findByIdAndUpdate(
            patientId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!patient) throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'Patient not found');

        if (!patient.phone && !patient.address){
            patient.accountStatus = 'incomplete';
            await patient.save();
        } else {
            patient.accountStatus = 'active';
            await patient.save();
        }

        let updateBasicInfo = await this.getBasicInfoService(patientId);

        return updateBasicInfo;
    };

    async getMedicalProfileService(patientId) {
        const patient = await this.getPatientByIdService(patientId);
        return patient.medicalProfile;
    };
    async updateMedicalProfileService(patientId, updateData) {
        const updatedFields = buildPatchUpdate({ 
            data: updateData, basePath: 'medicalProfile' 
        });
        const patient = await Patient.findByIdAndUpdate(
            patientId,
            updatedFields,
            { new: true, runValidators: true }
        );
        if (!patient) throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'Patient not found');

        return patient.medicalProfile;
    };

    async addChronicDiseaseService(patientId, diseaseData) {
        const patient = await this.getPatientByIdService(patientId);
        patient.medicalProfile.chronicDiseases.push(diseaseData);
        await patient.save();
        return patient.medicalProfile.chronicDiseases[patient.medicalProfile.chronicDiseases.length - 1];
    };
    async updateChronicDiseaseService(patientId, diseaseId, updateData) {
        const updatedFields = buildPatchUpdate({ 
            data: updateData, basePath: `medicalProfile.chronicDiseases.$` 
        });
        const patient = await Patient.findOneAndUpdate(
            { 
                _id: patientId,
                'medicalProfile.chronicDiseases._id': diseaseId
            },
            updatedFields,
            { new: true, runValidators: true }
        );
        if (!patient) throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'Patient or chronic disease not found');
        
        const updatedDisease = patient.medicalProfile.chronicDiseases.id(diseaseId);

        return updatedDisease;
    };
    async deleteChronicDiseaseService(patientId, diseaseId) {
        const patient = await Patient.findByIdAndUpdate(
            patientId,
            { $pull: { 'medicalProfile.chronicDiseases': { _id: diseaseId } } },
            { new: true }
        );
        if (!patient) throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'Patient not found');

        return { deletedId: diseaseId };
    };

    async addAllergyService(patientId, allergyData) {
        const patient = await this.getPatientByIdService(patientId);
        patient.medicalProfile.allergies.push(allergyData);
        await patient.save();
        return patient.medicalProfile.allergies[patient.medicalProfile.allergies.length - 1];
    };
    async updateAllergyService(patientId, allergyId, updateData) { 
        const updatedFields = buildPatchUpdate({ 
            data: updateData, basePath: `medicalProfile.allergies.$` 
        });
        const patient = await Patient.findOneAndUpdate(
            { 
                _id: patientId,
                'medicalProfile.allergies._id': allergyId
            },
            updatedFields,
            { new: true, runValidators: true }
        );

        if (!patient) throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'Patient or allergy not found');

        const updatedAllergy = patient.medicalProfile.allergies.id(allergyId);

        return updatedAllergy;
    };
    async deleteAllergyService(patientId, allergyId) { 
        const patient = await Patient.findByIdAndUpdate(
            patientId,
            { $pull: { 'medicalProfile.allergies': { _id: allergyId } } },
            { new: true }
        );

        if (!patient) throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'Patient not found');

        return { deletedId: allergyId };
    };

    async addSurgeryService(patientId, surgeryData) { 
        const patient = await this.getPatientByIdService(patientId);
        patient.medicalProfile.previousSurgeries.push(surgeryData);
        await patient.save();
        return patient.medicalProfile.previousSurgeries[patient.medicalProfile.previousSurgeries.length - 1];
    };
    async updateSurgeryService(patientId, surgeryId, updateData) {
        const updatedFields = buildPatchUpdate({ 
            data: updateData, basePath: `medicalProfile.previousSurgeries.$` 
        });
        const patient = await Patient.findOneAndUpdate(
            { 
                _id: patientId,
                'medicalProfile.previousSurgeries._id': surgeryId
            },
            updatedFields,
            { new: true, runValidators: true }
        );

        if (!patient) throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'Patient or surgery not found');

        const updatedSurgery = patient.medicalProfile.previousSurgeries.id(surgeryId);

        return updatedSurgery;
    };
    async deleteSurgeryService(patientId, surgeryId) { 
        const patient = await Patient.findByIdAndUpdate(
            patientId,
            { $pull: { 'medicalProfile.previousSurgeries': { _id: surgeryId } } },
            { new: true }
        );

        if (!patient) throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'Patient not found');

        return { deletedId: surgeryId };
    };

    async addFamilyMedicalHistoryService(patientId, historyData) {
        const patient = await this.getPatientByIdService(patientId);

        patient.medicalProfile.familyMedicalHistory.push(historyData);
        await patient.save();

        return patient.medicalProfile.familyMedicalHistory[patient.medicalProfile.familyMedicalHistory.length - 1];
    };
    async updateFamilyMedicalHistoryService(patientId, historyId, updateData) {
        const updatedFields = buildPatchUpdate({ 
            data: updateData, basePath: `medicalProfile.familyMedicalHistory.$` 
        });
        const patient = await Patient.findOneAndUpdate(
            { 
                _id: patientId,
                'medicalProfile.familyMedicalHistory._id': historyId
            },
            updatedFields,
            { new: true, runValidators: true }
        );

        if (!patient) throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'Patient or family medical history not found');

        const updatedHistory = patient.medicalProfile.familyMedicalHistory.id(historyId);

        return updatedHistory;
    };
    async deleteFamilyMedicalHistoryService(patientId, historyId) {
        const patient = await Patient.findByIdAndUpdate(
            patientId,
            { $pull: { 'medicalProfile.familyMedicalHistory': { _id: historyId } } },
            { new: true }
        );

        if (!patient) throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'Patient not found');

        return { deletedId: historyId };
    };

    
    async addMedicationService(patientId, medicationData) {
        const patient = await this.getPatientByIdService(patientId);

        patient.medicalProfile.currentMedications.push(medicationData);
        await patient.save();

        return patient.medicalProfile.currentMedications[patient.medicalProfile.currentMedications.length - 1];
    };
    async updateMedicationService(patientId, medicationId, updateData) {
        const updatedFields = buildPatchUpdate({ 
            data: updateData, basePath: `medicalProfile.currentMedications.$` 
        });
        const patient = await Patient.findOneAndUpdate(
            { 
                _id: patientId,
                'medicalProfile.currentMedications._id': medicationId
            },
            updatedFields,
            { new: true, runValidators: true }
        );

        if (!patient) throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'Patient or medication not found');

        const updatedMedication = patient.medicalProfile.currentMedications.id(medicationId);

        return updatedMedication;
    };
    async deleteMedicationService(patientId, medicationId) { 
        const patient = await Patient.findByIdAndUpdate(
            patientId,
            { $pull: { 'medicalProfile.currentMedications': { _id: medicationId } } },
            { new: true }
        );

        if (!patient) throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'Patient not found');

        return { deletedId: medicationId };
    };

    async getEmergencyContactsService(patientId) { 
        const patient = await this.getPatientByIdService(patientId);
        return patient.emergencyContacts;
    };
    async addEmergencyContactService(patientId, contactData) {
        const patient = await this.getPatientByIdService(patientId);
        patient.emergencyContacts.push(contactData);
        await patient.save();
        return patient.emergencyContacts[patient.emergencyContacts.length - 1];
    };
    async updateEmergencyContactService(patientId, contactId, updateData) { 
        const updatedFields = buildPatchUpdate({ 
            data: updateData, basePath: `emergencyContacts.$` 
        });
        const patient = await Patient.findOneAndUpdate(
            { 
                _id: patientId, 
                'emergencyContacts._id': contactId 
            },
            updatedFields,
            { new: true, runValidators: true }
        );

        if (!patient) throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'Patient or emergency contact not found');

        const updatedContact = patient.emergencyContacts.id(contactId);
        return updatedContact;
    };
    async deleteEmergencyContactService(patientId, contactId) { 
        const patient = await Patient.findByIdAndUpdate(
            patientId,
            { $pull: { emergencyContacts: { _id: contactId } } },
            { new: true }
        );

        if (!patient) throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'Patient not found');

        return { deletedId: contactId };
    };

}

module.exports = new PatientService();