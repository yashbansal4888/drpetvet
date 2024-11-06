const bcrypt = require('bcryptjs');
const { connectToDatabase } = require('./mongoconfig'); // Import MongoDB connection

const signUpUser = async (name, email, password, otp) => {
    try {
        // Verify the OTP
        if (!verifyOtp(email, otp)) {
            throw new Error("Invalid or expired OTP.");
        }

        const db = await connectToDatabase();
        const collection = db.collection('users');

        const existingUser = await collection.findOne({ email });
        if (existingUser) {
            throw new Error("Email already exists.");
        }

        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password before storing
        await collection.insertOne({ name, email, password: hashedPassword, createdAt: new Date() });

        return { success: true, message: "Signup successful!" };
    } catch (error) {
        console.error('Error signing up user:', error);
        return { success: false, message: error.message };
    }const bcrypt = require('bcryptjs');
    const { connectToDatabase } = require('./mongoconfig'); // MongoDB configuration
    const nodemailer = require('nodemailer');
    
    // Temporary OTP store (in-memory)
    const otpStore = {};
    
    // Nodemailer transport setup
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'your-email@gmail.com',  // Replace with your email
            pass: 'your-email-password'    // Replace with your email password or app password
        }
    });
    
    // Function to send OTP to user email
    const sendOtp = (email) => {
        const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
        const expires = Date.now() + 300000; // OTP valid for 5 minutes
    
        otpStore[email] = { otp, expires }; // Store the OTP with expiration time
    
        // Send the OTP via email
        return transporter.sendMail({
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}. It is valid for 5 minutes.`
        });
    };
    
    // Function to handle user signup
    const signUpUser = async (name, email, password, otp) => {
        try {
            // Verify the OTP
            if (!verifyOtp(email, otp)) {
                throw new Error("Invalid or expired OTP.");
            }
    
            const db = await connectToDatabase();
            const collection = db.collection('users');
    
            const existingUser = await collection.findOne({ email });
            if (existingUser) {
                throw new Error("Email already exists.");
            }
    
            const hashedPassword = await bcrypt.hash(password, 10); // Hash the password before storing
            await collection.insertOne({ name, email, password: hashedPassword, createdAt: new Date() });
    
            delete otpStore[email]; // Remove the OTP after successful signup
            return { success: true, message: "Signup successful!" };
        } catch (error) {
            console.error('Error signing up user:', error);
            return { success: false, message: error.message };
        }
    };
    
    // Function to verify OTP
    const verifyOtp = (email, otp) => {
        const storedOtp = otpStore[email];
        if (!storedOtp) return false;
        return storedOtp.otp === otp && storedOtp.expires > Date.now();
    };
    
    module.exports = { signUpUser, sendOtp };
    
};

// OTP verification logic (assuming it’s stored in memory or some storage)
const otpStore = {};  // Consider using a proper database for production

const verifyOtp = (email, otp) => {
    const storedOtp = otpStore[email];
    if (!storedOtp) return false;
    return storedOtp.otp === otp && storedOtp.expires > Date.now();
};

module.exports = { signUpUser };
