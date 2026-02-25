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
    const address = "Cd4YXjihT6wtjMQi5oxZocHSKhbEwfE3VnGa9X2s68Yi";
    console.log(`Starting microscopic airdrop bombardment for ${address}...`);

    for (let i = 0; i < 20; i++) {
        const amount = 1000000; // 0.001 SOL
        console.log(`[Attempt ${i + 1}] Requesting 0.001 SOL...`);
        try {
            const res = await sendRpc('requestAirdrop', [address, amount]);
            console.log(JSON.stringify(res));
            if (res.result) {
                console.log("SUCCESS! A portion of gas acquired.");
            }
        } catch (e) {
            console.error(`Attempt ${i + 1} failed: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 500));
    }
}

run();
