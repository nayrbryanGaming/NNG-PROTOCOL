const https = require('https');

const data = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'getBalance',
    params: ['35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr']
});

const options = {
    hostname: 'api.devnet.solana.com',
    port: 443,
    path: '/',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    let responseData = '';
    res.on('data', (d) => { responseData += d; });
    res.on('end', () => {
        console.log('--- RPC RESPONSE ---');
        console.log(responseData);
    });
});

req.on('error', (error) => { console.error(error); });
req.write(data);
req.end();
