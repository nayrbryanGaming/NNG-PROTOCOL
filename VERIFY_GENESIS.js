const { Connection, PublicKey } = require('@solana/web3.js');

async function check() {
    const rpcs = ['https://api.devnet.solana.com', 'https://devnet-rpc.solayer.org'];
    const mintStr = 'chbgZkJJA7dN9BNspDay7Doq9Lp7fqSKRkb';
    const payerStr = 'Cd4YXjihT6wtjMQi5oxZocHSKhbEwfE3VnGa9X2s68Yi';

    for (const url of rpcs) {
        console.log(`Checking RPC: ${url}`);
        try {
            const conn = new Connection(url, 'confirmed');
            const mint = new PublicKey(mintStr);
            const payer = new PublicKey(payerStr);

            const [mInfo, pBal] = await Promise.all([
                conn.getAccountInfo(mint),
                conn.getBalance(payer)
            ]);

            console.log(`  Mint Found: ${mInfo !== null}`);
            console.log(`  Payer Balance: ${pBal / 1e9} SOL`);
            if (mInfo) {
                console.log(`  Mint Owner: ${mInfo.owner.toBase58()}`);
            }
        } catch (e) {
            console.log(`  Error: ${e.message}`);
        }
    }
}

check();
