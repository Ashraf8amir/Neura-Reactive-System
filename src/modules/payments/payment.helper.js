

class PaymentHelper {
    static calculateCommission(amount, receiverRole) {
        const commissionRates = {
            doctor: 0.10,     
            nurse: 0.15,      
            pharmacy: 0.05,    
            platform: 0        
        };

        const rate = commissionRates[receiverRole] || 0;
        const commissionAmount = amount * rate;
        const receiverAmount = amount - commissionAmount;

        return {
            percentage: rate * 100,
            amount: commissionAmount,
            receiverAmount: receiverAmount
        };
    }

    

}

module.exports = PaymentHelper;