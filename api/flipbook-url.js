// api/flipbook-url.js
import jwt from 'jsonwebtoken';

// Verify JWT token
function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Verify authentication
    const user = verifyToken(req.headers.authorization);
    
    console.log(`📖 Flipbook access requested by: ${user.email}`);
    
    // Return flipbook URL
    const flipbookUrl = process.env.FLIPBOOK_URL || 'https://online.fliphtml5.com/gfqeu/wswt/';
    
    res.json({
      success: true,
      url: flipbookUrl,
      user: {
        email: user.email,
        name: user.name
      }
    });
    
  } catch (error) {
    console.error('Flipbook access error:', error);
    
    if (error.message.includes('token')) {
      return res.status(401).json({ 
        message: 'Authentication required. Please login again.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Unable to access flipbook. Please try again.' 
    });
  }
}
