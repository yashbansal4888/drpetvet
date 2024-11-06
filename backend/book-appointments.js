// Required imports
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up MongoDB connection
mongoose.connect('mongodb://localhost:27017/drpet_vet', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.log('MongoDB connection error:', err));

// Nodemailer configuration using environment variables
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'drpetvetindia@gmail.com', // Gmail user from .env file
        pass: 'zrrzsancuhyzbwxq', // Gmail pass from .env file
    },
});

// Route to handle appointment booking
app.post('/book-appointments', async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const appointments = db.collection('appointments');

        const { name, email, phone, location, doctor, date, time } = req.body;

        // Insert appointment data into the database
        await appointments.insertOne({ name, email, phone, location, doctor, date, time });

        // Prepare email content
        const mailOptions = {
            from: 'drpetvetindia@gmail.com', // Use Gmail user from environment
            to: email, // To email address
            subject: 'Appointment Confirmation',
            text: `Dear ${name},\n\nYour appointment with \n${doctor} at \n${location} \nis confirmed for ${date} at ${time}.\n\nBest regards,\nDrPet Vet`,
        };

        // Send confirmation email
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${email}`);

        // Return success response
        res.status(200).json({
            success: true,
            message: 'Appointment booked successfully. A confirmation email has been sent.',
        });

    } catch (error) {
        console.error('Error booking appointment or sending email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to book appointment or send confirmation email.',
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
