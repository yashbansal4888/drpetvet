// Import required modules
const { MongoClient } = require('mongodb');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
require('dotenv').config(); // For loading environment variables

// MongoDB connection configuration
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/drpet_vet'; // Using environment variable
let client;

// Define the connectToDatabase function
const connectToDatabase = async () => {
    if (!client) {
        try {
            client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
            await client.connect();
        } catch (err) {
            console.error('Failed to connect to MongoDB:', err);
            throw err;
        }
    }
    return client.db('drpet_vet'); // Replace with your database name
};

// User Authentication Functions
const loginUser = async (email, password) => {
    const db = await connectToDatabase();
    const collection = db.collection('users');

    try {
        const user = await collection.findOne({ email });
        if (!user) {
            throw new Error("Invalid email or password.");
        }

        // Compare the plain password with the hashed one
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error("Invalid email or password.");
        }

        return { success: true, message: "Login successful!", userId: user._id };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

const signUpUser = async (email, password) => {
    const db = await connectToDatabase();
    const collection = db.collection('users');

    try {
        const existingUser = await collection.findOne({ email });
        if (existingUser) {
            throw new Error("Email already exists.");
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        await collection.insertOne({ email, password: hashedPassword, createdAt: new Date() });
        return { success: true, message: "Signup successful!" };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

// MongoDB User Data Functions
const saveUserData = async (userId, userData) => {
    const db = await connectToDatabase();
    const collection = db.collection('users');
    try {
        await collection.updateOne({ _id: userId }, { $set: userData });
        return { success: true, message: 'User data saved successfully!' };
    } catch (error) {
        console.error('Error saving user data:', error);
        return { success: false, message: error.message };
    }
};

const getUserData = async (userId) => {
    const db = await connectToDatabase();
    const collection = db.collection('users');
    try {
        const user = await collection.findOne({ _id: userId });
        return user
            ? { success: true, data: user }
            : { success: false, message: 'No data available' };
    } catch (error) {
        console.error('Error fetching user data:', error);
        return { success: false, message: error.message };
    }
};

// MongoDB Service Management Functions
const saveServiceData = async (serviceData) => {
    const db = await connectToDatabase();
    const collection = db.collection('services');
    try {
        const result = await collection.insertOne(serviceData);
        return { success: true, message: `Service added with ID: ${result.insertedId}` };
    } catch (error) {
        console.error('Error adding service:', error);
        return { success: false, message: error.message };
    }
};

const getAllServices = async () => {
    const db = await connectToDatabase();
    const collection = db.collection('services');
    try {
        const services = await collection.find({}).toArray();
        return { success: true, services };
    } catch (error) {
        console.error('Error fetching services:', error);
        return { success: false, message: error.message };
    }
};

// MongoDB Contact Management Functions
const saveContactData = async (contactData) => {
    const db = await connectToDatabase();
    const collection = db.collection('contacts');
    try {
        const result = await collection.insertOne(contactData);
        return { success: true, message: `Contact message saved with ID: ${result.insertedId}` };
    } catch (error) {
        console.error('Error saving contact data:', error);
        return { success: false, message: error.message };
    }
};

// Email sending function using Nodemailer
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'drpetvetindia@gmail.com', // Set in the .env file
            pass: 'zrrzsancuhyzbwxq', // Set in the .env file
        },
    });
};

const sendEmail = async (to, subject, text) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: 'drpetvetindia@gmail.com',
        to,
        subject,
        text,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Contact Form Submission and Email
const sendContactConfirmationEmail = async (contactData) => {
    const { name, email, message } = contactData;
    const messageContent = `
        Hello ${name},

        Thank you for reaching out to us. We have received your message:
        
        "${message}"

        Our team will get back to you shortly.

        Best regards,
        DrPet Vet Team
    `;

    await sendEmail(email, 'Contact Confirmation', messageContent);
};

const handleContactFormSubmission = async (contactData) => {
    await saveContactData(contactData);
    await sendContactConfirmationEmail(contactData);
};

// MongoDB Appointment Management Functions
const saveAppointmentData = async (appointmentData) => {
    const db = await connectToDatabase();
    const collection = db.collection('appointments');
    try {
        const result = await collection.insertOne(appointmentData);
        return { success: true, message: `Appointment added with ID: ${result.insertedId}` };
    } catch (error) {
        console.error('Error adding appointment:', error);
        return { success: false, message: error.message };
    }
};

const sendAppointmentConfirmationEmail = async (appointmentData) => {
    const { name, email, phone, location, doctor, date, time } = appointmentData;
    const message = `
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your appointment has been successfully booked on <strong>${date}</strong> at <strong>${time}</strong>.</p>
        <p>Thank you for choosing DrPet Vet!</p>
    `;
    try {
        await sendEmail(email, 'Appointment Confirmation', message);
        console.log('Appointment confirmation email sent successfully');
    } catch (error) {
        console.error('Error sending appointment confirmation email:', error);
    }
};

const bookAppointment = async (appointmentData) => {
    // Validate appointment data (e.g., check for required fields, valid date/time)
    if (!appointmentData.email || !appointmentData.date || !appointmentData.time) {
        return { success: false, message: 'Invalid appointment data' };
    }
    
    // Save to the database
    const saveResult = await saveAppointmentData(appointmentData);
    if (!saveResult.success) {
        return saveResult; // If saving fails, return the error message
    }
    
    // Send confirmation email
    const emailResult = await sendAppointmentConfirmationEmail(appointmentData);
    if (!emailResult.success) {
        return { success: false, message: 'Appointment booked, but failed to send confirmation email.' };
    }

    return { success: true, message: 'Appointment booked and email confirmation sent' };
};

// OTP Functions
const sendOtpToEmail = async (email) => {
    const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
    console.log(`Sending OTP ${otp} to ${email}`);

    await sendEmail(email, 'Your OTP Code', `Your OTP code is: ${otp}`);

    return otp; // Return the OTP if needed for verification
};

const verifyOtp = async (inputOtp, sentOtp) => {
    return inputOtp === sentOtp;
};

// Export all functions
module.exports = {
    loginUser,
    signUpUser,
    saveUserData,
    getUserData,
    saveServiceData,
    getAllServices,
    saveContactData,
    handleContactFormSubmission,
    saveAppointmentData,
    bookAppointment,
    sendOtpToEmail,
    verifyOtp,
};
