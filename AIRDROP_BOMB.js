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
    // CORRECTED 44-CHAR ADDRESS
    const address = "Cd4YXjihT6wtjMQi5oxZocHSKhbEwfE3VnGa9X2s68Yi";
    console.log(`Starting airdrop bombardment for ${address} on global Devnet...`);

    for (let i = 0; i < 20; i++) {
        console.log(`[Attempt ${i + 1}] Requesting 0.05 SOL...`);
        try {
            const res = await sendRpc('requestAirdrop', [address, 50000000]);
            if (res.result) {
                console.log("SUCCESS! Airdrop signature: " + res.result);
            } else {
                console.log("FAILED: " + (res.error ? res.error.message : "Rate limit"));
            }
        } catch (e) {
            console.error(`Attempt ${i + 1} error: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 1000));
    }
}

run();
