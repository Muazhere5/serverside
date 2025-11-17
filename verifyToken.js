// verifyToken.js
const admin = require('./firebaseAdmin');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send({ error: 'Unauthorized: Access token required.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('verifyToken error:', error && error.message ? error.message : error);
    return res.status(403).send({ error: 'Unauthorized: Invalid or expired token.' });
  }
};

module.exports = verifyToken;
