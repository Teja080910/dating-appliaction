const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Helper for unified success response
const successAuth = (body) => ({ 
    token: 'mock-jwt-token-123', 
    user: { 
      id: 1, 
      userId: '1',
      username: body.username || body.name || 'Savej Ali',
      phoneNumber: body.phoneNumber || body.mobile || '1234567890',
      email: 'test@example.com'
    } 
});

// Auth Controller (Swagger)
app.post('/auth/register', (req, res) => {
    console.log('Received /auth/register request:', req.body);
    res.json('User registered successfully');
});

app.post('/auth/login', (req, res) => {
    console.log('Received /auth/login request:', req.body);
    res.json(successAuth(req.body));
});

// Auth Controller (Legacy / DattingApp.txt)
app.post('/register', (req, res) => {
    console.log('Received Legacy /register request:', req.body);
    res.json({ message: 'User registered successfully', data: req.body });
});

app.post('/login', (req, res) => {
    console.log('Received Legacy /login request:', req.body);
    if ((req.body.mobile || req.body.phoneNumber) && req.body.password) {
        res.json(successAuth(req.body));
    } else {
        res.status(400).json({ message: 'Invalid credentials' });
    }
});

// OTP Controller
app.post(['/auth/sentOtp', '/auth/sent-otp', '/sent-otp'], (req, res) => {
    console.log('Received /sent-otp request:', req.body);
    res.json({ status: 'success', message: 'OTP sent' });
});

app.post(['/auth/verifyOtp', '/auth/verify-otp', '/verify-otp'], (req, res) => {
    console.log('Received /verify-otp request:', req.body);
    res.json({ status: 'success', message: 'OTP verified' });
});

// User Controller
app.post(['/auth/user/updateUser', '/user/update'], (req, res) => {
    console.log('Received update user request:', req.body);
    res.json({ ...req.body, message: 'Updated successfully' });
});

app.post(['/auth/user/getUser', '/user/get'], (req, res) => {
    res.json({ id: 1, username: 'Savej Ali' });
});

// Razorpay
app.post(['/auth/user/razorpay/webhook', '/razorpay/webhook'], (req, res) => {
    res.json({ status: "webhook received" });
});

app.post(['/razorpay/create-order', '/order/create'], (req, res) => {
    res.json({ id: "order_mock_123", amount: 100 });
});

// Discovery
app.post(['/auth/user/searchCriteria', '/search'], (req, res) => {
    const results = [
        { id: 2, username: 'Priya', age: 24, gender: 'FEMALE' },
        { id: 3, username: 'Anita', age: 26, gender: 'FEMALE' }
    ];
    // Support both direct array and content wrapper
    res.json(req.path.includes('Criteria') ? { content: results } : results);
});

app.post(['/auth/user/filter', '/users/filter'], (req, res) => {
    res.json([{ id: 2, username: 'Priya', age: 24, gender: 'FEMALE' }]);
});

// Connection Control
app.post(['/auth/user/send', '/connections/send'], (req, res) => {
    res.json("Request Sent");
});

app.post(['/auth/user/sendList', '/connections/sent'], (req, res) => {
    res.json([{ id: 2, username: 'Priya' }]);
});

const PORT = 9395;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dual Mode Mock Server is running on http://0.0.0.0:${PORT}`);
    console.log(`Supporting both Swagger (/auth/...) and Legacy (/...) paths.`);
});


