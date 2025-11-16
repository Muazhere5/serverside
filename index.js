const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config(); 

const app = express();
const port = process.env.PORT || 5000;

const verifyToken = require('./verifyToken'); 

// ==========================================================
// 1. Middleware (Client/Server Communication)
// ==========================================================
app.use(cors({
    origin: [
        'http://localhost:5173', 
        'http://localhost:5174', 
        'http://localhost:5175', 
        'https://your-client-site.netlify.app', 
        'https://serverside-xi.vercel.app' // NOTE: Updated to your live Vercel domain
    ], 
    credentials: true 
}));
app.use(express.json());

// ==========================================================
// 2. MongoDB Connection Setup
// ==========================================================
const dbUser = process.env.DB_USER; 
const dbPass = process.env.DB_PASS; 
const uri = `mongodb+srv://${dbUser}:${dbPass}@project00.3ikpony.mongodb.net/?appName=Project00`;

const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

// Default Test Route: MUST BE OUTSIDE run() for Vercel stability
app.get('/', (req, res) => { 
    res.send('Habit Tracker Server is running and connected!'); 
});

async function run() {
    try {
        await client.connect();
        const database = client.db("habittrackerDB"); 
        const habitCollection = database.collection("habits"); 
        console.log("✅ MongoDB successfully connected to habittrackerDB!");

        // ==========================================================
        // 3. API Routes (CRUD Operations & Protection)
        // ==========================================================

        app.get('/featured-habits', async (req, res) => {
            const result = await habitCollection.find().sort({ createdAt: -1 }).limit(6).toArray();
            res.send(result);
        });

        // 🎯 CRITICAL FIX: Re-inserting the missing /public-habits route
        app.get('/public-habits', async (req, res) => {
            const { category, search } = req.query;
            let query = {};
            
            if (category && category !== 'All') {
                query.category = category;
            }
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } }, 
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            const result = await habitCollection.find(query).toArray();
            res.send(result);
        });
        
        // ... (remaining READ and all WRITE routes remain the same) ...
        
        app.get('/my-habits/:email', async (req, res) => { /* ... */ });
        app.get('/habit/:id', async (req, res) => { /* ... */ });
        app.post('/add-habit', verifyToken, async (req, res) => { /* ... */ });
        app.put('/update-habit/:id', verifyToken, async (req, res) => { /* ... */ });
        app.delete('/habit/:id', verifyToken, async (req, res) => { /* ... */ });
        app.patch('/habit/complete/:id', verifyToken, async (req, res) => { /* ... */ });
        
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. Connection verified.");

    } catch (error) {
        console.error("❌ MongoDB connection or operation error:", error);
    } 
}

run().catch(console.dir);

// For local development
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});

// CRITICAL FIX FOR VERCEL: Export the Express app instance 
module.exports = app;