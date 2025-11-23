const admin = require('firebase-admin');
require('dotenv').config();

if (!global.__firebaseAdmin) {
  global.__firebaseAdmin = {};
}


function normalizeKey(raw) {
  if (!raw) throw new Error('Missing FIREBASE_PRIVATE_KEY');

  
  return raw.replace(/\\n/g, '\n');
}

if (!global.__firebaseAdmin.app) {
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;

  try {
    const privateKey = normalizeKey(rawKey);

    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase Admin initialized.');
    global.__firebaseAdmin.app = admin;
  } catch (err) {
    console.error('❌ Firebase Admin initialization failed:', err.message || err);

    if (err.message.includes('Missing FIREBASE_PRIVATE_KEY')) {
      throw err;
    }
  }
}

module.exports = admin;
