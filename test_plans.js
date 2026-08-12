const axios = require('axios');

(async () => {
    try {
        const loginRes = await axios.post('http://168.144.95.58:9395/login', {
            mobile: '9876501000',
            password: 'Seed@123'
        });
        const token = loginRes.data.token || loginRes.data.jwt;
        console.log('Login success!', token ? 'Token received' : 'No token');
        
        const testPlans = ['BASIC', 'basic', 'PREMIUM', 'premium', 'ELITE', 'elite', '1', '2', '3'];
        
        for (const plan of testPlans) {
            try {
                const res = await axios.post(`http://168.144.95.58:9395/razorpay/create-order?userId=1&plan=${plan}`, null, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log(`Plan '${plan}' SUCCESS:`, res.status);
                break; // stop when we found the right one!
            } catch (err) {
                console.log(`Plan '${plan}' FAILED:`, err.response?.status, err.response?.data);
            }
        }
    } catch (e) {
        console.error('Error:', e.response?.data || e.message);
    }
})();
