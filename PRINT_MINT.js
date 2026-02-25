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
    const res = await sendRpc('getSignaturesForAddress', [address, { limit: 2 }]);
    const sig2 = res.result[1].signature; // The first one sent (Phase 1)

    const txDetail = await sendRpc('getTransaction', [sig2, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]);
    // The mint is the new account created in the first instruction (SystemProgram.createAccount)
    const mint = txDetail.result.transaction.message.accountKeys[1].pubkey;
    console.log(`FULL_MINT_ADDRESS: ${mint}`);
}

run();
