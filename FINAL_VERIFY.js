const { Connection, PublicKey } = require('@solana/web3.js');

async function verify() {
    const connection = new Connection('https://devnet-rpc.solayer.org', 'confirmed');
    const mintAddress = "chbgZkJJA7dN9BNspDay7Doq9Lp7fqSKRkb";
    const pubkey = new PublicKey(mintAddress);

    console.log(`Verifying $NNG Protocol: ${mintAddress}...`);
    const accountInfo = await connection.getAccountInfo(pubkey);

    if (accountInfo) {
        console.log("STATUS: LIVE ON-CHAIN (SEMPURNA)");
        console.log(`Program Owner: ${accountInfo.owner.toBase58()}`);
        console.log(`Data Space: ${accountInfo.data.length} bytes`);
        console.log(`Sovereign Verification Link: https://solscan.io/token/${mintAddress}?cluster=devnet`);
    } else {
        console.log("STATUS: ERROR - NOT FOUND");
    }
}

verify();
