const https = require('https');

async function sendRpc(url, method, params) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname,
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
    const solayerUrl = "https://devnet-rpc.solayer.org";
    console.log(`Checking balance for ${address} on ${solayerUrl}...`);
    const res = await sendRpc(solayerUrl, 'getBalance', [address]);
    console.log(JSON.stringify(res, null, 2));
}

run();
