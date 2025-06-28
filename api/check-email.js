// api/check-email.js

// Danh sách email được phép truy cập
const ALLOWED_EMAILS = process.env.ALLOWED_EMAILS 
  ? process.env.ALLOWED_EMAILS.split(',').map(email => email.trim())
  : [
    'demo@gmail.com',
    'user1@gmail.com', 
    'user2@company.com',
    'admin@yourdomain.com'
  ];

// Mapping email to display names (optional)
const EMAIL_NAMES = {
  'demo@gmail.com': 'Demo User',
  'user1@gmail.com': 'User One',
  'user2@company.com': 'Company User',
  'admin@yourdomain.com': 'Administrator'
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method === 'GET') {
    // Return list of allowed emails (without exposing all emails)
    return res.json({
      message: 'Email whitelist check endpoint',
      totalAllowed: ALLOWED_EMAILS.length,
      sampleEmails: ALLOWED_EMAILS.slice(0, 2) // Only show first 2 for security
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
    
    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if email is in allowed list
    const isAllowed = ALLOWED_EMAILS.some(allowedEmail => 
      allowedEmail.toLowerCase() === normalizedEmail
    );
    
    if (isAllowed) {
      console.log(`✅ Email check passed: ${normalizedEmail}`);
      res.json({
        allowed: true,
        email: normalizedEmail,
        name: EMAIL_NAMES[normalizedEmail] || 'Authorized User'
      });
    } else {
      console.log(`❌ Email check failed: ${normalizedEmail}`);
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
