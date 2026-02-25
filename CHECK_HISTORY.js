const https = require('https');

async function sendRpc(method, params) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
        const options = {
            hostname: 'devnet-rpc.solayer.org',
            port: 443,
            path: '/',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function run() {
    const address = "Cd4YXjihT6wtjMQi5oxZocHSKhbEwfE3VnGa9X2s68Yi";
    console.log(`Checking history for ${address}...`);
    const res = await sendRpc('getSignaturesForAddress', [address, { limit: 5 }]);
    console.log(JSON.stringify(res, null, 2));
}

run();
