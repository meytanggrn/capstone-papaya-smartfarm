// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  // Format header: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // ambil token
  
  if (!token) return res.status(401).json({ error: 'Akses ditolak, token hilang!' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token tidak valid!' });
    req.user = user; // taruh user info ke request
    next();
  });
}

module.exports = authenticateToken;
