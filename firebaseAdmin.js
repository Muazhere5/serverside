const admin = require('firebase-admin');
require('dotenv').config();

// Construct the service account object using environment variables
// The private key must be decoded from Base64 back into its original multi-line format
const serviceAccount = {
    "type": "service_account",
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
    // Decode the Base64 string back to its original format for the Admin SDK
    "private_key": Buffer.from(process.env.FIREBASE_PRIVATE_KEY, 'base64').toString('ascii'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": "107834388490322370420", // Hardcoded from your JSON
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40habit-tracker-bbf8a.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
};


if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

module.exports = admin;