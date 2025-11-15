const admin = require('firebase-admin');
require('dotenv').config();

// WARNING: This method is used to guarantee local parsing success, bypassing 
// the Base64 error. The 'private_key' is manually pasted with line breaks.
const serviceAccount = {
    "type": "service_account",
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
    // 💥 CRITICAL FIX: The key is embedded directly as a literal string.
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCuSZJEtj3maPES\n9Z0jHkdKXj6AekmLAJXKyazTAz1FJ+b0dg5zLgTyWHXyXElIQ/tNpA1SWNibfzbR\nFpD9x5CtJ6/FzXkI5ISevKPcehE83f2Af2Ky8ZQQq/xKJ8cfyTfC/myAuFHZBgj/\niA4hsRQZHRKN2onOWy5hVEDmekeD7H1QYzPgPqbDBL8xSTwez6bpbzvIyHo7mXsY\ngdIR8rjHmafFZ99oY17qqOPIeiyGfLEe5dp92eq87nqwtXq6XFzM0qtBCxzpQFT6\nZbOq5u9a7BL39zqiMXit58v8qleaaVoy2DwSwkYTQwTgGN8l7GPUKcxa/ychmWsR\n13l+Pci5AgMBAAECggEAAcVK34t8FwnxE+KHCwx4s6bllTEo3JZA/mUyQPHbigcX\nV0yWzzqF7rIGUibK7qD2aw6iJppRTFhOWK1ZA9+9Onynu5/2QSDQv2gbVwRE0WNQ\nNz+UELaje9Ac6Uu43f+ClEiiQ5F2LUvcsca76NgSPn7WeKeH6ZdSvGxnl3Odwgh1\nu8beQsxNSZileQtaPEvm46ECZUVIrgxQmuW1Yn9dvJdxoP8YmD8GMvyMx58VBoy8\nLuYRwhx0lZ0J8p8Kx1dfcGOaEsROk0aXxegXls+qVZcR6O/dFXHK7xp9KdDDimDZ\nZ2BPr/NpUNZDv6pFTL+Z+/bln0dgQIUhw5uNA6+W/QKBgQDo/BlqOduNDOHfafyT\nrid1dPXMaRYHI7WxrNxE/Pue5xev31f1C1CZtWHyjrcsYKnAFj4cG3wIEjwkfGQ0\nKvlpOkoT9rn6wLbqDnKbUOdzYC4eGkbaUt68L95Pkzeic4+MBnLTlt4c/nd37tQr\nxu7QCJgCtTv7tBLaS0vB0O8JswKBgQC/gRZGTnw3rDXStjkZkZolA+GqqHFmZAUk\n7+cID5Z1sepZy8YpLLTrj+im7mkH43e9cyyF+e41Ge91NP/4/si4ok3tEeZoonHa\n0ZW+6qATZDULo3J9ErZaiJJ8lsFG/5LlFotyprZTpB78LSxD7jc3o+CbpScFvjAg\nuASL2FGV4wKBgQC3NR6LIKob1Yh8laxvOOCAhZOPxQb0YElNSUAA4+q9fr1qqDdT\nUy1zYWV/RmiV9gEmMpdupNI4ypYOnt5xA2YTMCn2XurKWua7UNcgeVM3r+cz9rfG\nkKnj08R+UKbMERFNK/j5l8ZbiGLLpbukHQ/H+SoH3xonCOhWTiVpaHG/7wKBgFk5\nBW3AR3OQ0orXx4a4Jb81LcDbNepkk1kARP2mdY1kVTF9FVg9shVGOTj9PwYj3rfv\nn0DUjz1CViSfitsxqccMJ45alqUNekpe94u5uNcQCv7fKgpH25oWo1lUy7wOexwt\nAs9qCOyzPJR1X3hO1n8f5RffPG0ajUXRNp0JLgnNAoGBANXw7/yPgSDAuXJQJ1yW\nhRQdibuuQYLHK9cPBy90gw28i+biWntOAo+nZ7GOJCNPzrFaj7DAqwCbCZMyy4oE\naDSb9T6Z4KNa/+IhaO8Uf6cb1SIwsvlz2I0YDnJYVNDaTIfShpY7zemyexoXDSzv\ng3EpiaS+KtSXAwgXb/tj8pPa\n-----END PRIVATE KEY-----",
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": "107834388490322370420", 
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40habit-tracker-bbf8a.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
};

// Initialize the Firebase Admin SDK if it hasn't been done already
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

module.exports = admin;