const https = require('https');

async function sendRpc(method, params) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
        const options = {
            hostname: 'api.devnet.solana.com',
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
    const address = "DjE91hLnWiK9MUY4kduG9TuqH6PK4VypTREa3Z59Gff6";
    console.log(`Checking mint ${address} on standard Devnet...`);
    const res = await sendRpc('getAccountInfo', [address, { encoding: 'jsonParsed' }]);
    console.log(JSON.stringify(res, null, 2));
}

run();
