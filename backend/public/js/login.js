const bcrypt = require('bcryptjs');
const { connectToDatabase } = require('./mongoconfig'); // MongoDB connection

// Function to authenticate user during login
const loginUser = async (email, password) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('users');

        // Check if the user exists in the database by email
        const user = await collection.findOne({ email });
        if (!user) {
            return { success: false, message: "Email not found." };
        }

        // Compare the entered password with the hashed password stored in the database
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return { success: false, message: "Invalid password." };
        }

        // If successful, return the user data (or redirect as needed)
        return { success: true, message: "Login successful!", userId: user._id, email: user.email };
    } catch (error) {
        console.error('Error logging in user:', error);
        return { success: false, message: "An error occurred during login. Please try again." };
    }
};

module.exports = { loginUser };
