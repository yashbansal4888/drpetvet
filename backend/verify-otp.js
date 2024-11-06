const { connectToDatabase } = require('./mongoconfig');

const verifyOtp = async (email, inputOtp) => {
    const db = await connectToDatabase();
    const collection = db.collection('otps');

    try {
        const otpRecord = await collection.findOne({ email, otp: inputOtp });

        if (!otpRecord) {
            throw new Error("Invalid OTP.");
        }

        if (new Date() > otpRecord.expiresAt) {
            throw new Error("OTP has expired.");
        }

        return { success: true };
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return { success: false, message: error.message };
    }
};

module.exports = { verifyOtp };
