const {
    Connection,
    Keypair,
    PublicKey,
} = require('@solana/web3.js');
const {
    TOKEN_2022_PROGRAM_ID,
    createMint,
    mintTo,
    getOrCreateAssociatedTokenAccount,
    setAuthority,
    AuthorityType,
    transfer,
} = require('@solana/spl-token');
const fs = require('fs');

// Genesis Parameters
const DECIMALS = 9;
const TOTAL_SUPPLY = BigInt(1000000000) * BigInt(Math.pow(10, 9));
const DEV_ALLOCATION = BigInt(50000000) * BigInt(Math.pow(10, 9));
const SATOSHI_WALLET = new PublicKey("35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr");

async function main() {
    console.log("--- nayrbryanGaming ($NNG) DEFINITIVE GENESIS START ---");
    const connection = new Connection('https://devnet-rpc.solayer.org', 'confirmed');

    // Satoshi Wallet 2.0 (Local Key)
    const secretKey = Uint8Array.from([87, 68, 219, 149, 118, 168, 203, 106, 197, 62, 228, 150, 218, 79, 95, 78, 6, 39, 148, 196, 64, 34, 209, 131, 33, 151, 241, 241, 219, 120, 105, 50, 172, 173, 120, 219, 141, 89, 194, 47, 74, 113, 128, 124, 204, 79, 114, 40, 129, 225, 235, 169, 155, 229, 51, 19, 225, 237, 137, 210, 179, 252, 243, 51]);
    const payer = Keypair.fromSecretKey(secretKey);

    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    console.log(`[1] Creating Mint: ${mint.toBase58()}...`);
    await createMint(connection, payer, payer.publicKey, null, DECIMALS, mintKeypair, { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);

    console.log("[2] Minting 1B Supply...");
    const payerAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey, false, 'confirmed', undefined, TOKEN_2022_PROGRAM_ID);
    await mintTo(connection, payer, mint, payerAta.address, payer, TOTAL_SUPPLY, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);

    console.log("[3] Distributing 5%...");
    const devAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, SATOSHI_WALLET, false, 'confirmed', undefined, TOKEN_2022_PROGRAM_ID);
    await transfer(connection, payer, payerAta.address, devAta.address, payer, DEV_ALLOCATION, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);

    console.log("[4] Revoking Authorities...");
    await setAuthority(connection, payer, mint, payer, AuthorityType.MintTokens, null, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);

    console.log("--- GENESIS COMPLETE ---");
    console.log(`MINT ADDRESS: ${mint.toBase58()}`);
    fs.writeFileSync('mint_address.txt', mint.toBase58());
    console.log(`SOLSCAN: https://solscan.io/token/${mint.toBase58()}?cluster=devnet`);
}

main().catch(err => {
    console.error("GENESIS FAILED:", err.message);
    process.exit(1);
});
