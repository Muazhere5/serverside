const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config(); 

const app = express();
const port = process.env.PORT || 5000;

// Import the verification middleware (uses firebaseAdmin.js internally)
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
        'https://your-server-domain.vercel.app' 
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

async function run() {
    try {
        await client.connect();
        const database = client.db("habittrackerDB"); 
        const habitCollection = database.collection("habits"); 
        console.log("✅ MongoDB successfully connected to habittrackerDB!");

        // ==========================================================
        // 3. API Routes (CRUD Operations & Protection)
        // ==========================================================

        app.get('/', (req, res) => { res.send('Habit Tracker Server is running and connected!'); });
        app.get('/featured-habits', async (req, res) => {
            const result = await habitCollection.find().sort({ createdAt: -1 }).limit(6).toArray();
            res.send(result);
        });
        // ... (other READ routes remain unchanged) ...

        // WRITE Routes (PROTECTED BY verifyToken) 🔐
        
        app.post('/add-habit', verifyToken, async (req, res) => {
            if (req.user.email !== req.body.creatorEmail) {
                 return res.status(403).send({ error: 'Token user mismatch.' });
            }
            const newHabit = req.body;
            newHabit.createdAt = new Date(); 
            newHabit.completionHistory = []; 
            const result = await habitCollection.insertOne(newHabit);
            res.send(result);
        });
        
        app.put('/update-habit/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body;
            const filter = { _id: new ObjectId(id) };
            
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

        app.delete('/habit/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const habit = await habitCollection.findOne(filter);
            if (!habit || habit.creatorEmail !== req.user.email) {
                 return res.status(403).send({ error: 'You do not have permission to delete this habit.' });
            }
            const result = await habitCollection.deleteOne(filter);
            res.send(result);
        });
        
        app.patch('/habit/complete/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const today = new Date().toISOString().split('T')[0];
            const filter = { _id: new ObjectId(id) };
            const habit = await habitCollection.findOne(filter);
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

// For local development
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});

// 💥 CRITICAL FIX FOR VERCEL: Export the Express app instance 
module.exports = app;