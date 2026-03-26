class MedicalRecordHelper {

    static stripDrugInteractions(record) {
        const result = record.toObject ? record.toObject() : { ...record };

        if (result.aiSummary?.alerts?.drug_interactions) {
            delete result.aiSummary.alerts.drug_interactions;
        }

        delete result.isVisibleToPatient;
        delete result.__v;
        delete result.createdAt;
        delete result.updatedAt;

        return result;
    }

    static stripDrugInteractionsFromArray(records) {
        return records.map(record => this.stripDrugInteractions(record));
    }

    static formatResponse(record) {
        const result = record.toObject ? record.toObject() : { ...record };
        delete result.__v;
        delete result.createdAt;
        delete result.updatedAt;
        return result;
    }

}

module.exports = MedicalRecordHelper;