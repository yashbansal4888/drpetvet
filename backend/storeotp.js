const { connectToDatabase } = require('./mongoconfig');
const { v4: uuidv4 } = require('uuid');

const storeOtp = async (email, otp) => {
    const db = await connectToDatabase();
    const collection = db.collection('otps');

    const otpData = {
        email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiration
        id: uuidv4(),
    };

    try {
        await collection.insertOne(otpData);
        console.log(`Stored OTP for ${email}`);
    } catch (error) {
        console.error('Error storing OTP:', error);
    }
};

module.exports = { storeOtp };
