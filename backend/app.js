// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Otp = require('./models/Otp'); // Model for OTPs
const crypto = require('crypto');
const { connectToDatabase } = require('./mongoconfig'); // Import MongoDB connection
const { storeOtp } = require('./storeotp'); // Import storeOtp function
const { verifyOtp } = require('./verify-otp'); // Import verifyOtp function

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/drpet_vet', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('MongoDB connection error:', err));

// Serve static HTML files
const servePage = (page) => (req, res) => res.sendFile(path.join(__dirname, '..', 'views', `${page}.html`));

app.get('/', servePage('index'));
app.get('/index.html', servePage('index'));
app.get('/about.html', servePage('about'));
app.get('/services.html', servePage('services'));
app.get('/contact.html', servePage('contact'));

// Protect the appointments route
app.get('/appointments.html', (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login.html');
    }
    servePage('appointments')(req, res);
});

app.get('/login.html', servePage('login'));
app.get('/signup.html', servePage('signup'));
// Serve logout page
app.get('/logout.html', servePage('logout')); 
// Serve Password Reset Page
app.get('/reset-password', (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ message: 'Token is required' });
    }
    res.sendFile(path.join(__dirname, '..', 'views', 'reset-password.html'));
});

app.get('/api/services', (req, res) => {
    const services = [
        { name: 'General Checkup', description: 'A comprehensive health check for your pet.' },
        { name: 'Vaccination', description: 'Routine vaccinations to keep your pet healthy.' },
        { name: 'Surgery', description: 'Safe and professional surgical procedures.' },
        { name: 'Dental Care', description: 'Complete dental services for pets.' },
        { name: 'Grooming', description: 'Bathing, brushing, and trimming services for your pet.' }
    ];
    res.json(services); // Send JSON response
});
// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'drpetvetindia@gmail.com',
        pass: 'zrrzsancuhyzbwxq',
    }
});

// Generate a 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
app.post('/send-message', async (req, res) => {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }

    // Save the message to MongoDB
    try {
        const db = await connectToDatabase(); // Ensure DB connection here
        const contactMessage = { name, email, phone, message, date: new Date() };
        const result = await db.collection('messages').insertOne(contactMessage);
        console.log('Message saved to database:', result.insertedId);
    } catch (error) {
        console.error('Error saving message to MongoDB:', error);
        return res.status(500).json({ success: false, message: 'Error saving message to database.' });
    }

    // Send an email using Nodemailer
    const mailOptions = {
        from: 'drpetvetindia@gmail.com',
        to: process.env.EMAIL_TO || 'drpetvetindia@gmail.com', // Destination email
        subject: 'New Contact Form Submission',
        text: `You received a new message from your website contact form:
        Name: ${name}
        Email: ${email}
        Phone: ${phone || 'Not provided'}
        Message: ${message}`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error('Error sending email:', err);
            return res.status(500).json({ success: false, message: 'Error sending email.' });
        }

        console.log('Email sent:', info.response);
        res.status(200).json({ success: true, message: 'Message sent successfully!' });
    });
});

// Route to send OTP to email
app.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    const otp = generateOTP();
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Store OTP in MongoDB
    await storeOtp(email, otp);

    // Send OTP via email
    const mailOptions = {
        from: 'drpetvetindia@gmail.com',
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "OTP sent successfully" });
    } catch (err) {
        return res.status(500).json({ message: "Error sending OTP", error: err });
    }
});

// Route to verify OTP
app.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required" });
    }

    const verificationResult = await verifyOtp(email, otp);
    if (verificationResult.success) {
        return res.status(200).json({ message: "OTP verified successfully" });
    } else {
        return res.status(400).json({ message: verificationResult.message });
    }
});

// User Authentication Functions
const signUpUser = async (name, email, password) => {
    const db = await connectToDatabase();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = { name, email, password: hashedPassword };

    const result = await db.collection('users').insertOne(user);
    return result;
};

const loginUser = async (email, password) => {
    const db = await connectToDatabase();

    const user = await db.collection('users').findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
        return { success:true,user};
    }
    return{success: false, message:'Invalid email or password.'};
};

// Handle signup with OTP verification and MongoDB authentication
app.post('/signup', async (req, res) => {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    // Verify OTP
    const otpRecord = await Otp.findOne({ email: email }).sort({ expiresAt: -1 });
    if (!otpRecord || otpRecord.otp !== otp || otpRecord.expiresAt < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    try {
        const db = await connectToDatabase();
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists.' });
        }

        await signUpUser(name, email, password);
        res.json({ success: true, message: 'Signup successful!' });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Route to handle appointment booking
app.post('/book-appointments', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const appointments = db.collection('appointments');

        const { name, email, phone, location,doctor,date, time } = req.body;

        // Insert appointment into the database
        const result = await appointments.insertOne({ name, email, phone, location,doctor,date, time });

        // If insertion is successful, send a confirmation email
        const mailOptions = {
            from: 'drpetvetindia@gmail.com',
            to: email, // Send confirmation to the user's email
            subject: 'Appointment Confirmation',
            text: `Dear ${name},\n\nYour appointment with \n${doctor} at \n${location} \nis confirmed for ${date} at ${time}.\n\nBest regards,\nDrPet Vet`
        };

        // Send email
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Error sending email:', err);
                return res.status(500).json({ success: false, message: 'Failed to send confirmation email.' });
            }

            console.log('Confirmation email sent:', info.response);
            // Return success response
            res.status(200).json({ success: true, message: 'Appointment booked successfully and confirmation email sent!' });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to book appointment' });
    }
});

// Login Route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    try {
        const result = await loginUser(email, password);

        if (result.success) {
            req.session.user = result.user; // Store user in session
            res.status(200).json({ success: true, message: "Login successful" });
        } else {
            res.status(401).json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});



// Forgot Password - Send Reset Link
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        const db = await connectToDatabase();
        const user = await db.collection('users').findOne({ email });
        if (!user) return res.status(400).json({ message: 'No user found with this email' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour expiration

        await db.collection('users').updateOne(
            { email },
            { $set: { resetToken, resetTokenExpiry } }
        );

        const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: 'drpetvetindia@gmail.com',
            to: email,
            subject: 'Password Reset Request',
            text: `You requested a password reset. Click the following link to reset your password: ${resetLink}. This link is valid for 1 hour.`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Reset password link sent successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error sending reset link' });
    }
});

app.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;

    // Validate inputs
    if (!token || !password) {
        return res.status(400).json({ message: 'Token and new password are required.' });
    }

    try {
        const db = await connectToDatabase();

        // Find the user by token and ensure the token is not expired
        const user = await db.collection('users').findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() } // Ensure the token is still valid
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password and remove the reset token and expiry
        await db.collection('users').updateOne(
            { _id: user._id },
            {
                $set: { password: hashedPassword },
                $unset: { resetToken: '', resetTokenExpiry: '' }
            }
        );

        res.status(200).json({ message: 'Password has been reset successfully.' });
    } catch (err) {
        console.error('Error resetting password:', err);
        res.status(500).json({ message: 'Error resetting password.' });
    }
});


// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to log out.' });
        }
        res.clearCookie('connect.sid');  // Clear session cookie after logout
        res.json({ message: 'Logged out successfully.' });
    });
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});



// Export your functions if required
module.exports = {
    signUpUser,
    loginUser,
};
