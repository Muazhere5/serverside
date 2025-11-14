const express = require('express');
const cors = require('cors');
// Import MongoDB essentials
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config(); // Loads .env variables

const app = express();
const port = process.env.PORT || 5000;

// ==========================================================
// 1. Middleware (Client/Server Communication)
// ==========================================================
// Configure CORS for Vercel/Netlify deployment and local development
app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps, Postman, curl)
            if (!origin) return callback(null, true);

            // ✅ Allow any localhost origin (dev: any port)
            if (origin.startsWith('http://localhost')) {
                return callback(null, true);
            }

            // ✅ Allow your deployed frontend(s)
            const allowedOrigins = [
                'https://your-client-site.netlify.app', // update when you have real URL
            ];

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            // ❌ Block other origins
            return callback(new Error('Not allowed by CORS: ' + origin));
        },
        credentials: true,
    })
);

app.use(express.json()); // Parses incoming JSON data


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
        
        // --- Define Database and Collection(s) ---
        // NOTE: Using 'habittrackerDB' (all lowercase) to match your confirmed Atlas setup
        const database = client.db("habittrackerDB"); 
        const habitCollection = database.collection("habits"); 
        
        console.log("✅ MongoDB successfully connected to habittrackerDB!");

        // ==========================================================
        // 3. API Routes (CRUD Operations & Project Requirements)
        // ==========================================================

        // Default Test Route:
        app.get('/', (req, res) => {
            res.send('Habit Tracker Server is running and connected!');
        });

        // 🎯 R (Read) - Get Featured Habits (6 newest public)
        app.get('/featured-habits', async (req, res) => {
            const result = await habitCollection.find()
                .sort({ createdAt: -1 }) // Newest first
                .limit(6)
                .toArray();
            res.send(result);
        });
        
        // 🎯 R (Read) - Browse All Public Habits (with Search/Filter)
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

        // 🎯 R (Read) - Get User's Own Habits (My Habits Page)
        app.get('/my-habits/:email', async (req, res) => {
            const userEmail = req.params.email;
            const query = { creatorEmail: userEmail }; 
            const result = await habitCollection.find(query).toArray();
            res.send(result);
        });
        
        // 🎯 R (Read) - Get Single Habit Details
        app.get('/habit/:id', async (req, res) => {
            const id = req.params.id;
            // The client expects a single JSON object back
            const result = await habitCollection.findOne({ _id: new ObjectId(id) });
            if (!result) return res.status(404).send('Not Found');
            res.send(result);
        });


        // 🎯 C (Create) - Add Habit (Private Route POST)
        app.post('/add-habit', async (req, res) => {
            const newHabit = req.body;
            newHabit.createdAt = new Date(); 
            newHabit.completionHistory = []; 

            const result = await habitCollection.insertOne(newHabit);
            res.send(result);
        });
        
        // 🎯 U (Update) - Update Habit (PUT)
        app.put('/update-habit/:id', async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body;
            const filter = { _id: new ObjectId(id) };
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
        app.delete('/habit/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await habitCollection.deleteOne(query);
            res.send(result);
        });
        
        // 🎯 U (Update) - Mark Complete (Streak/Progress Logic PATCH)
        app.patch('/habit/complete/:id', async (req, res) => {
            const id = req.params.id;
            const today = new Date().toISOString().split('T')[0];
            const filter = { _id: new ObjectId(id) };
            
            const habit = await habitCollection.findOne(filter);
            
            // Prevent duplicate same-day entry
            const isCompletedToday = habit.completionHistory.some(date => 
                new Date(date).toISOString().split('T')[0] === today
            );
            
            if (isCompletedToday) {
                // Returns status 200 with a message that the client side checks
                return res.status(200).send({ message: "Habit already completed today.", acknowledged: true });
            }

            // Use MongoDB $push to add a timestamp
            const updateDoc = { $push: { completionHistory: new Date() } };
            
            const result = await habitCollection.updateOne(filter, updateDoc);
            res.send(result);
        });
        
        // Ping to confirm successful connection
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
