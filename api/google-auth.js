// api/google-auth.js
import jwt from 'jsonwebtoken';

// Whitelist của các email được phép truy cập
const ALLOWED_EMAILS = process.env.ALLOWED_EMAILS 
  ? process.env.ALLOWED_EMAILS.split(',').map(email => email.trim())
  : [
    'demo@gmail.com',
    'user1@gmail.com', 
    'user2@company.com',
    'admin@yourdomain.com'
  ];

// Verify Google ID Token
async function verifyGoogleToken(idToken) {
  try {
    // Call Google's token verification endpoint
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );
    
    if (!response.ok) {
      throw new Error('Invalid token');
    }
    
    const payload = await response.json();
    
    // Verify audience (your client ID)
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      throw new Error('Invalid audience');
    }
    
    // Verify issuer
    if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
      throw new Error('Invalid issuer');
    }
    
    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error('Token expired');
    }
    
    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      verified: payload.email_verified
    };
    
  } catch (error) {
    console.error('Google token verification failed:', error);
    throw new Error('Token verification failed');
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ message: 'ID token required' });
    }
    
    // Verify Google ID token
    const googleUser = await verifyGoogleToken(idToken);
    
    // Check if email is in whitelist
    if (!ALLOWED_EMAILS.includes(googleUser.email)) {
      console.log(`❌ Access denied for: ${googleUser.email}`);
      return res.status(403).json({ 
        message: 'Access denied. Your email is not authorized to access this content.',
        email: googleUser.email
      });
    }
    
    // Generate JWT token for authorized user
    const token = jwt.sign(
      { 
        id: googleUser.email,
        email: googleUser.email,
        name: googleUser.name,
        loginMethod: 'google'
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );
    
    console.log(`✅ Access granted for: ${googleUser.email}`);
    
    res.json({
      success: true,
      token,
      user: {
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
        verified: googleUser.verified
      }
    });
    
  } catch (error) {
    console.error('Google auth error:', error);
    
    // Return specific error messages
    if (error.message.includes('Token expired')) {
      return res.status(401).json({ message: 'Login session expired. Please sign in again.' });
    }
    
    if (error.message.includes('Invalid')) {
      return res.status(401).json({ message: 'Invalid login credentials.' });
    }
    
    res.status(500).json({ message: 'Authentication failed. Please try again.' });
  }
}
