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
    const sig = "5rFNC1nbxAQsbaKTFR2JABnT3xwQ89ge9ZkXKbcpW7E99fT5zKj5WwY6ZkX..."; // Partial from screenshot, I'll get signatures first
    const mint = "3daMX7utMqBT4j2YqUib2ZwoWxMC1gmssQU2qRWnC1uT";

    console.log(`--- $NNG FOOTPRINT EXTRACTION ---`);
    const history = await sendRpc('getSignaturesForAddress', [mint]);
    console.log("HISTORY:");
    console.log(JSON.stringify(history, null, 2));

    if (history.result && history.result[0]) {
        const fullSig = history.result[0].signature;
        console.log(`\n--- DETAILS FOR ${fullSig} ---`);
        const details = await sendRpc('getTransaction', [fullSig, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]);
        console.log(JSON.stringify(details, null, 2));
    }
}

run();
