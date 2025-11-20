// api/index.js
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const verifyToken = require('../verifyToken'); // uses firebaseAdmin internally

// create express app and define routes synchronously
const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://your-client-site.netlify.app',
    'https://serverside-rkcmxtnzs-muaz-heres-projects.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// Default public route (works without DB)
app.get('/', (req, res) => {
  res.send('Habit Tracker Server is running and connected!');
});

// Mongo connection helpers for serverless
const MONGO_URI = process.env.MONGODB_URI || (() => {
  const user = process.env.DB_USER || '';
  const pass = process.env.DB_PASS || '';
  if (!user || !pass) return null;
  return `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@project00.3ikpony.mongodb.net/?appName=Project00`;
})();

if (!MONGO_URI) {
  console.warn('⚠️ No Mongo URI available. Set MONGODB_URI or DB_USER/DB_PASS in environment.');
}

async function getDb() {
  if (!MONGO_URI) throw new Error('Missing MongoDB connection info');
  if (!global._mongo) {
    global._mongo = { client: null, db: null, connecting: null };
  }
  if (global._mongo.db) return global._mongo.db;
  if (!global._mongo.connecting) {
    const client = new MongoClient(MONGO_URI, {
      serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
      // increase serverSelectionTimeoutMS if needed
      serverSelectionTimeoutMS: 10000
    });
    global._mongo.connecting = client.connect()
      .then(() => {
        global._mongo.client = client;
        global._mongo.db = client.db('habittrackerDB');
        console.log('✅ MongoDB connected (serverless cache).');
        return global._mongo.db;
      })
      .catch(err => {
        global._mongo.connecting = null;
        console.error('❌ MongoDB connection failed:', err);
        throw err;
      });
  }
  return global._mongo.connecting;
}

// Register all routes that require DB inside functions that call getDb() lazily

app.get('/featured-habits', async (req, res) => {
  try {
    const db = await getDb();
    const habitCollection = db.collection('habits');
    const result = await habitCollection.find().sort({ createdAt: -1 }).limit(6).toArray();
    res.send(result);
  } catch (err) {
    console.error('/featured-habits error:', err);
    res.status(500).send({ error: 'Server error' });
  }
});

app.get('/public-habits', async (req, res) => {
  try {
    const { category, search } = req.query;
    const db = await getDb();
    const habitCollection = db.collection('habits');
    let query = {};
    if (category && category !== 'All') query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    const result = await habitCollection.find(query).toArray();
    res.send(result);
  } catch (err) {
    console.error('/public-habits error:', err);
    res.status(500).send({ error: 'Server error' });
  }
});

app.get('/my-habits/:email', async (req, res) => {
  try {
    const userEmail = req.params.email;
    const db = await getDb();
    const habitCollection = db.collection('habits');
    const result = await habitCollection.find({ creatorEmail: userEmail }).toArray();
    res.send(result);
  } catch (err) {
    console.error('/my-habits error:', err);
    res.status(500).send({ error: 'Server error' });
  }
});

app.get('/habit/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const db = await getDb();
    const habitCollection = db.collection('habits');
    const result = await habitCollection.findOne({ _id: new ObjectId(id) });
    if (!result) return res.status(404).send('Not Found');
    res.send(result);
  } catch (err) {
    console.error('/habit/:id error:', err);
    res.status(500).send({ error: 'Server error' });
  }
});

// PROTECTED ROUTES

app.post('/add-habit', verifyToken, async (req, res) => {
  try {
    if (req.user.email !== req.body.creatorEmail) {
      return res.status(403).send({ error: 'Token user mismatch.' });
    }
    const db = await getDb();
    const habitCollection = db.collection('habits');
    const newHabit = req.body;
    newHabit.createdAt = new Date();
    newHabit.completionHistory = [];
    const result = await habitCollection.insertOne(newHabit);
    res.send(result);
  } catch (err) {
    console.error('/add-habit error:', err);
    res.status(500).send({ error: 'Server error' });
  }
});

app.put('/update-habit/:id', verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;
    const db = await getDb();
    const habitCollection = db.collection('habits');
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
      }
    };
    const result = await habitCollection.updateOne(filter, updateDoc);
    res.send(result);
  } catch (err) {
    console.error('/update-habit error:', err);
    res.status(500).send({ error: 'Server error' });
  }
});

app.delete('/habit/:id', verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const db = await getDb();
    const habitCollection = db.collection('habits');
    const filter = { _id: new ObjectId(id) };
    const habit = await habitCollection.findOne(filter);
    if (!habit || habit.creatorEmail !== req.user.email) {
      return res.status(403).send({ error: 'You do not have permission to delete this habit.' });
    }
    const result = await habitCollection.deleteOne(filter);
    res.send(result);
  } catch (err) {
    console.error('/delete-habit error:', err);
    res.status(500).send({ error: 'Server error' });
  }
});

app.patch('/habit/complete/:id', verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const db = await getDb();
    const habitCollection = db.collection('habits');
    const filter = { _id: new ObjectId(id) };
    const habit = await habitCollection.findOne(filter);
    if (!habit) return res.status(404).send({ error: 'Habit not found.' });

    const today = new Date().toISOString().split('T')[0];
    const isCompletedToday = (habit.completionHistory || []).some(date =>
      new Date(date).toISOString().split('T')[0] === today
    );

    if (isCompletedToday) {
      return res.status(200).send({ message: "Habit already completed today.", acknowledged: true });
    }
    const result = await habitCollection.updateOne(filter, { $push: { completionHistory: new Date() } });
    res.send(result);
  } catch (err) {
    console.error('/habit/complete error:', err);
    res.status(500).send({ error: 'Server error' });
  }
});

// Export handler for Vercel
module.exports = async (req, res) => {
  try {
    // Ensure DB connection is ready before handling request
    if (MONGO_URI) await getDb();
  } catch (err) {
    // If DB fails, still allow GET / (health) to respond; otherwise return 500
    if (req.url === '/' || req.url === '') {
      return app(req, res);
    }
    console.error('DB preconnect error:', err);
    return res.status(500).send({ error: 'Database connection error' });
  }
  return app(req, res);
};
