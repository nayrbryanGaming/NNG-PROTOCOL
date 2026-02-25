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
    const mint = "3daMX7utMqBT4j2YqUib2ZwoWxMC1gmssQU2qRWnC1uT";
    const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkThT9PzZBm9GGr359Cr9";

    console.log(`--- $NNG ACCOUNT SCAN ---`);
    const res = await sendRpc('getProgramAccounts', [
        TOKEN_2022_PROGRAM_ID,
        {
            filters: [
                { dataSize: 165 + 17 }, // Total size for Token-2022 accounts varies, let's try just filtering by mint
                {
                    memcmp: {
                        offset: 0,
                        bytes: mint
                    }
                }
            ],
            encoding: 'jsonParsed'
        }
    ]);
    console.log(JSON.stringify(res, null, 2));
}

run();
