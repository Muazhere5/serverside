const admin = require('./firebaseAdmin'); // Import the initialized Admin SDK

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    // 1. Check if token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ error: 'Unauthorized: Access token required.' });
    }
    
    const token = authHeader.split(' ')[1];

    try {
        // 2. Verify the token using Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // 3. Attach user data (UID, email) to the request object for use in CRUD routes
        req.user = decodedToken; 
        
        next(); // Move to the actual route handler (app.post, app.put, etc.)
    } catch (error) {
        // Token is expired, malformed, or invalid
        return res.status(403).send({ error: 'Unauthorized: Invalid or expired token.' });
    }
};

module.exports = verifyToken;