// api/check-email.js

const ALLOWED_EMAILS = process.env.ALLOWED_EMAILS 
  ? process.env.ALLOWED_EMAILS.split(',').map(email => email.trim().toLowerCase())
  : [
    'demo@gmail.com',
    'user1@gmail.com', 
    'user2@company.com',
    'admin@yourdomain.com'
  ];

const EMAIL_NAMES = {
  'demo@gmail.com': 'Demo User',
  'user1@gmail.com': 'User One',
  'user2@company.com': 'Company User',
  'admin@yourdomain.com': 'Administrator'
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    return res.json({
      message: 'Email whitelist checker',
      totalAllowed: ALLOWED_EMAILS.length,
      sampleEmails: ALLOWED_EMAILS.slice(0, 2)
    });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    const isAllowed = ALLOWED_EMAILS.includes(normalizedEmail);
    
    console.log(`📧 Email check: ${normalizedEmail} - ${isAllowed ? 'ALLOWED' : 'DENIED'}`);
    
    if (isAllowed) {
      res.json({
        allowed: true,
        email: normalizedEmail,
        name: EMAIL_NAMES[normalizedEmail] || 'Authorized User'
      });
    } else {
      res.json({
        allowed: false,
        email: normalizedEmail,
        message: 'Email not in whitelist'
      });
    }
    
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
