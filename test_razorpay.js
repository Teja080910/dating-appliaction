const axios = require('axios');

(async () => {
    try {
        const uniqueMobile = '89' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
        console.log('Registering with mobile:', uniqueMobile);
        
        // 1. Register
        const regRes = await axios.post('http://165.22.218.70:9395/register', {
            name: 'Test Razorpay',
            mobile: uniqueMobile,
            password: 'Password@123',
            confirmPassword: 'Password@123',
            otp: '1234'
        });
        
        // 2. Login
        const loginRes = await axios.post('http://165.22.218.70:9395/login', {
            mobile: uniqueMobile,
            password: 'Password@123'
        });
        
        const token = loginRes.data.token || loginRes.data.jwt;
        const userId = loginRes.data.user?.id || loginRes.data.id || 1;
        
        console.log('Login success! UserID:', userId);
        
        const testPlans = [
            'BASIC', 'basic', 'Standard', 'STANDARD',
            'PREMIUM', 'premium', 'Premium',
            'ELITE', 'elite', 'Elite', 
            '1', '2', '3'
        ];
        
        for (const plan of testPlans) {
            try {
                const res = await axios.post(`http://165.22.218.70:9395/razorpay/create-order?userId=${userId}&plan=${plan}`, null, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log(`✅ Plan '${plan}' SUCCESS:`, res.status, res.data);
                break;
            } catch (err) {
                console.log(`❌ Plan '${plan}' FAILED:`, err.response?.status, err.response?.data);
            }
        }
    } catch (e) {
        console.error('Script Error:', e.response?.data || e.message);
    }
})();
