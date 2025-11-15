const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config(); 

const app = express();
const port = process.env.PORT || 5000;

// Import the verification middleware and Admin SDK setup
const verifyToken = require('./verifyToken'); 
// NOTE: firebaseAdmin is required by verifyToken.js

// ==========================================================
// 1. Middleware (Client/Server Communication)
// ==========================================================
app.use(cors({
    // Allow known local and deployed origins
    origin: [
        'http://localhost:5173', 
        'http://localhost:5174', 
        'http://localhost:5175', 
        'https://your-client-site.netlify.app', 
        'https://your-server-domain.vercel.app' 
    ], 
    credentials: true 
}));
app.use(express.json());


// ==========================================================
// 2. MongoDB Connection Setup (Using .env Credentials)
// ==========================================================
const dbUser = process.env.DB_USER; 
const dbPass = process.env.DB_PASS; 

const uri = `mongodb+srv://${dbUser}:${dbPass}@project00.3ikpony.mongodb.net/?appName=Project00`;

const client = new MongoClient(uri, {
    serverApi: { 
        version: ServerApiVersion.v1, 
        strict: true, 
        deprecationErrors: true 
    }
});

async function run() {
    try {
        await client.connect();
        
        const database = client.db("habittrackerDB"); 
        const habitCollection = database.collection("habits"); 
        
        console.log("✅ MongoDB successfully connected to habittrackerDB!");

        // ==========================================================
        // 3. API Routes (CRUD Operations & Project Requirements)
        // ==========================================================

        app.get('/', (req, res) => {
            res.send('Habit Tracker Server is running and connected!');
        });

        // READ Routes (Public and Private Reads - Do not need token verification)
        app.get('/featured-habits', async (req, res) => {
            const result = await habitCollection.find().sort({ createdAt: -1 }).limit(6).toArray();
            res.send(result);
        });

        app.get('/public-habits', async (req, res) => {
            const { category, search } = req.query;
            let query = {};
            // ... filtering logic ...
            const result = await habitCollection.find(query).toArray();
            res.send(result);
        });

        app.get('/my-habits/:email', async (req, res) => {
            const userEmail = req.params.email;
            const query = { creatorEmail: userEmail }; 
            const result = await habitCollection.find(query).toArray();
            res.send(result);
        });
        
        app.get('/habit/:id', async (req, res) => {
            const id = req.params.id;
            const result = await habitCollection.findOne({ _id: new ObjectId(id) });
            if (!result) return res.status(404).send('Not Found');
            res.send(result);
        });


        // WRITE Routes (MUST BE PROTECTED BY verifyToken) 🔐

        // 🎯 C (Create) - Add Habit
        app.post('/add-habit', verifyToken, async (req, res) => {
            // Check if user email matches token email for safety (optional check)
            if (req.user.email !== req.body.creatorEmail) {
                 return res.status(403).send({ error: 'Token user mismatch.' });
            }
            const newHabit = req.body;
            newHabit.createdAt = new Date(); 
            newHabit.completionHistory = []; 

            const result = await habitCollection.insertOne(newHabit);
            res.send(result);
        });
        
        // 🎯 U (Update) - Update Habit
        app.put('/update-habit/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body;
            const filter = { _id: new ObjectId(id) };
            
            // OPTIONAL CHALLENGE LOGIC: Ensure the user owns the document before updating
            const habit = await habitCollection.findOne(filter);
            if (!habit || habit.creatorEmail !== req.user.email) {
                 return res.status(403).send({ error: 'You do not have permission to edit this habit.' });
            }
            
            const updateDoc = {
                $set: {
                    title: updatedData.title,
                    description: updatedData.description,
                    category: updatedData.category,
                    reminderTime: updatedData.reminderTime,
                    image: updatedData.image 
                },
            };
            const result = await habitCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        // 🎯 D (Delete) - Delete Habit
        app.delete('/habit/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };

            // OPTIONAL CHALLENGE LOGIC: Ensure the user owns the document before deleting
            const habit = await habitCollection.findOne(filter);
            if (!habit || habit.creatorEmail !== req.user.email) {
                 return res.status(403).send({ error: 'You do not have permission to delete this habit.' });
            }

            const result = await habitCollection.deleteOne(filter);
            res.send(result);
        });
        
        // 🎯 U (Update) - Mark Complete (Does not need ownership check, but still requires login)
        app.patch('/habit/complete/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const today = new Date().toISOString().split('T')[0];
            const filter = { _id: new ObjectId(id) };
            
            const habit = await habitCollection.findOne(filter);
            
            // Prevent duplicate same-day entry
            const isCompletedToday = habit.completionHistory.some(date => 
                new Date(date).toISOString().split('T')[0] === today
            );
            
            if (isCompletedToday) {
                return res.status(200).send({ message: "Habit already completed today.", acknowledged: true });
            }

            const updateDoc = { $push: { completionHistory: new Date() } };
            
            const result = await habitCollection.updateOne(filter, updateDoc);
            res.send(result);
        });
        
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. Connection verified.");

    } catch (error) {
        console.error("❌ MongoDB connection or operation error:", error);
    } 
}

run().catch(console.dir);


// ==========================================================
// 4. Start Server Listening
// ==========================================================
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});