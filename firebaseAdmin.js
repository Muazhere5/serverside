// firebaseAdmin.js
// Robust Firebase Admin initializer that accepts multiple shapes of FIREBASE_PRIVATE_KEY
const admin = require('firebase-admin');
require('dotenv').config();

/**
 * Reconstruct the private key from various possible environment formats:
 * - Full PEM (multi-line) already present
 * - Single-line PEM that contains literal backslash-n sequences (\\n)
 * - Base64-encoded PEM string
 *
 * Returns a string that starts with "-----BEGIN" and contains actual newlines.
 */
function reconstructPrivateKey(rawKey) {
  if (!rawKey) {
    throw new Error('FIREBASE_PRIVATE_KEY environment variable is not set.');
  }

  // 1) If it already looks like a PEM (contains BEGIN), replace escaped newlines and return.
  if (rawKey.includes('-----BEGIN')) {
    // Replace any escaped newline sequences with real newlines in case user pasted with \n
    return rawKey.replace(/\\n/g, '\n');
  }

  // 2) If it contains literal "\n" sequences (common when put into .env as single-line),
  // replace them and check if result looks valid.
  if (rawKey.includes('\\n')) {
    const replaced = rawKey.replace(/\\n/g, '\n');
    if (replaced.includes('-----BEGIN')) return replaced;
  }

  // 3) Try Base64 decode and check.
  try {
    const decoded = Buffer.from(rawKey, 'base64').toString('utf8');
    if (decoded.includes('-----BEGIN')) {
      return decoded.replace(/\\n/g, '\n');
    }
  } catch (err) {
    // ignore decoding errors; will fall through to fallback
  }

  // 4) Fallback: try to treat the provided string by replacing escaped newlines.
  // If still invalid, let the Admin SDK throw a descriptive error when it tries to parse.
  return rawKey.replace(/\\n/g, '\n');
}

// Build service account using environment variables (keep other fields identical to your original)
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: reconstructPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID || undefined,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL || undefined,
  universe_domain: 'googleapis.com'
};

// Helpful, non-sensitive debug info (DOES NOT print the key)
// - logs length and whether it appears to contain BEGIN header.
// - remove these logs in production if you prefer.
try {
  const keyPreview = serviceAccount.private_key ? serviceAccount.private_key.slice(0, 30) : '(no key)';
  console.info('🔐 Firebase serviceAccount prepared. key length:', serviceAccount.private_key ? serviceAccount.private_key.length : 0);
  console.info('🔍 key contains BEGIN header:', !!(serviceAccount.private_key && serviceAccount.private_key.includes('-----BEGIN')));
} catch (e) {
  console.info('🔐 Firebase key debug info unavailable.');
}

// Initialize the Firebase Admin SDK (idempotent)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized.');
  } catch (err) {
    // Provide a helpful error message that includes the Admin error message
    console.error('❌ Firebase Admin initialization failed:', err.message || err);
    // Re-throw so your node process fails loudly (as before) but with clearer debug log
    throw err;
  }
}

module.exports = admin;
