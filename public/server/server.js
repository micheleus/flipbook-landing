const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Demo users
const users = {
    'demo@gmail.com': 'password123',
    'user@example.com': 'demo123'
};

// API Routes
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    if (users[email] && users[email] === password) {
        res.json({
            success: true,
            user: { email, name: 'Demo User' },
            token: 'demo-token-' + Date.now()
        });
    } else {
        res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
});

app.get('/api/flipbook-url', (req, res) => {
    res.json({
        url: process.env.FLIPBOOK_URL || 'https://online.flipbuilder.com/demo'
    });
});

app.get('/api/verify', (req, res) => {
    res.json({ message: 'Token verified', user: { email: 'demo@gmail.com' } });
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// For Vercel serverless
module.exports = app;

// For local development
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
