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
    // We need to find the signature in the history.
    // I saw 4XeQT9uTn2gVLmq1... and 5rFMC1nbxAQsbqWK...
    // Let's check 4XeQT9uTn2gVLmq1 (Wait, I need the full sig)
    // Actually, I'll just check getSignaturesForAddress again and take the full strings.
    const address = "Cd4YXjihT6wtjMQi5oxZocHSKhbEwfE3VnGa9X2s68Yi";
    const res = await sendRpc('getSignaturesForAddress', [address, { limit: 2 }]);
    const sig1 = res.result[0].signature;
    const sig2 = res.result[1].signature;

    console.log(`Sig 1: ${sig1}`);
    console.log(`Sig 2: ${sig2}`);

    // Get Tx detail for sig 2 (Phase 1)
    const txDetail = await sendRpc('getTransaction', [sig2, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]);
    console.log(JSON.stringify(txDetail, null, 2));
}

run();
