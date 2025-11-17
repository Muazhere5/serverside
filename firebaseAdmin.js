const admin = require('firebase-admin');
// *** CRITICAL FIX FOR LOCAL DEVELOPMENT ***
// This line ensures that all variables in your local .env file 
// (including FIREBASE_PRIVATE_KEY) are loaded into process.env 
// before this file attempts to read them.
require('dotenv').config(); 


if (!global.__firebaseAdmin) {
  global.__firebaseAdmin = {};
}

/**
 * Normalizes the raw private key string from the environment variable,
 * handling escaped newlines, quotes, and base64 encoding.
 */
function normalizeKey(raw) {
  if (!raw) throw new Error('Missing FIREBASE_PRIVATE_KEY');
  let key = raw.trim();

  // 1. Remove accidental wrapping quotes
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }

  // 2. If it looks base64 encoded, try decoding it
  if (!key.includes('-----BEGIN')) {
    try {
      const decoded = Buffer.from(key, 'base64').toString('utf8');
      if (decoded.includes('-----BEGIN')) {
        key = decoded;
      }
 } catch (e) {
 // If decoding fails, treat it as plain text
 }
 }

 // 3. Replace escaped newlines (\\n) and normalize line endings
 key = key.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

 // 4. Ensure it ends with a newline
 if (key.indexOf('-----END PRIVATE KEY-----') !== -1 && !key.endsWith('\n')) {
 key = key + '\n';
 }

 return key;
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
// Only throw the error if the key is explicitly missing
 if (err.message.includes('Missing FIREBASE_PRIVATE_KEY')) {
 throw err;
 }
 }
}

module.exports = admin;