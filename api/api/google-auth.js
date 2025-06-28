// api/google-auth.js
import jwt from 'jsonwebtoken';

// Email whitelist
const ALLOWED_EMAILS = process.env.ALLOWED_EMAILS 
  ? process.env.ALLOWED_EMAILS.split(',').map(email => email.trim().toLowerCase())
  : [
    'demo@gmail.com',
    'user1@gmail.com', 
    'user2@company.com',
    'admin@yourdomain.com'
  ];

// Verify Google ID Token
async function verifyGoogleToken(idToken) {
  try {
    console.log('Verifying Google token...');
    
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );
    
    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }
    
    const payload = await response.json();
    
    // Verify client ID
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      throw new Error('Invalid client ID');
    }
    
    // Verify issuer
    if (!payload.iss || 
        (payload.iss !== 'accounts.google.com' && 
         payload.iss !== 'https://accounts.google.com')) {
      throw new Error('Invalid issuer');
    }
    
    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error('Token expired');
    }
    
    console.log('✅ Google token verified for:', payload.email);
    
    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      verified: payload.email_verified === 'true' || payload.email_verified === true
    };
    
  } catch (error) {
    console.error('Google token verification failed:', error.message);
    throw error;
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ message: 'Google ID token required' });
    }
    
    // Verify Google token
    const googleUser = await verifyGoogleToken(idToken);
    const userEmail = googleUser.email.toLowerCase();
    
    // Check email whitelist
    if (!ALLOWED_EMAILS.includes(userEmail)) {
      console.log(`❌ Access denied for: ${userEmail}`);
      console.log(`📋 Allowed emails: ${ALLOWED_EMAILS.join(', ')}`);
      
      return res.status(403).json({ 
        message: 'Truy cập bị từ chối. Email của bạn không có quyền truy cập nội dung này.',
        email: userEmail,
        allowedEmails: ALLOWED_EMAILS.slice(0, 2) // Show first 2 for reference
      });
    }
    
    // Generate JWT for authorized user
    const token = jwt.sign(
      { 
        id: userEmail,
        email: userEmail,
        name: googleUser.name,
        loginMethod: 'google'
      },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log(`✅ Access granted for: ${userEmail}`);
    
    res.json({
      success: true,
      token,
      user: {
        email: userEmail,
        name: googleUser.name,
        avatar: googleUser.picture,
        verified: googleUser.verified
      }
    });
    
  } catch (error) {
    console.error('Google auth error:', error);
    
    if (error.message.includes('Token expired')) {
      return res.status(401).json({ 
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' 
      });
    }
    
    if (error.message.includes('Invalid')) {
      return res.status(401).json({ 
        message: 'Thông tin đăng nhập không hợp lệ.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Xác thực thất bại. Vui lòng thử lại.' 
    });
  }
}
