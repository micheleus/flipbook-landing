// api/login.js
import jwt from 'jsonwebtoken';

// Demo users database
const DEMO_USERS = {
  'demo@gmail.com': { 
    password: 'password123', 
    name: 'Demo User',
    id: 1 
  },
  'user@example.com': { 
    password: 'demo123', 
    name: 'Test User',
    id: 2 
  }
};

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
    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email và password là bắt buộc' 
      });
    }
    
    // Check user exists
    const user = DEMO_USERS[email.toLowerCase()];
    if (!user) {
      return res.status(401).json({ 
        message: 'Email hoặc mật khẩu không đúng' 
      });
    }
    
    // Verify password
    if (user.password !== password) {
      return res.status(401).json({ 
        message: 'Email hoặc mật khẩu không đúng' 
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: email,
        name: user.name,
        loginMethod: 'email'
      },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('✅ Login successful for:', email);
    
    // Success response
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: email,
        name: user.name
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Lỗi server. Vui lòng thử lại.' 
    });
  }
}
