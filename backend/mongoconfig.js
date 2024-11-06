const { MongoClient } = require('mongodb');
require('dotenv').config(); // Ensure environment variables are loaded

// Load the URI from the environment variable or fall back to the default
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/drpet_vet'; 
let client;
let db;

async function connectToDatabase() {
    try {
        if (!client) {
            client = new MongoClient(uri); // No need for useNewUrlParser or useUnifiedTopology
            await client.connect(); // Connect to the MongoDB server
            db = client.db(); // Uses the default database from the URI
            console.log('Connected to MongoDB');
        }
        return db;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error; // Re-throw the error to handle it elsewhere in your application
    }
}

// Optionally close the database connection
async function closeDatabase() {
    try {
        if (client) {
            await client.close();
            console.log('MongoDB connection closed');
        }
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
    }
}

module.exports = { connectToDatabase, closeDatabase };
