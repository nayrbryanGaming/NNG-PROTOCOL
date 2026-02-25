const { Connection, PublicKey } = require('@solana/web3.js');

async function verify() {
    const connection = new Connection('https://devnet-rpc.solayer.org', 'confirmed');
    const mintAddress = "4S4zq1ZcUPDuqGLCAKZrBFms68Yi";
    const pubkey = new PublicKey(mintAddress);

    console.log(`Verifying Mint: ${mintAddress}...`);
    const accountInfo = await connection.getAccountInfo(pubkey);

    if (accountInfo) {
        console.log("STATUS: LIVE ON-CHAIN (SEMPURNA)");
        console.log(`Program Owner: ${accountInfo.owner.toBase58()}`);
        console.log(`Data Length: ${accountInfo.data.length} bytes`);
        console.log(`Explorer: https://solscan.io/token/${mintAddress}?cluster=devnet`);
    } else {
        console.log("STATUS: NOT FOUND (STILL PROPAGATING)");
    }
}

verify();
