const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const {
    TOKEN_2022_PROGRAM_ID,
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    transfer,
    setAuthority,
    AuthorityType
} = require('@solana/spl-token');

async function run() {
    console.log("--- nayrbryanGaming ($NNG) SIMPLE SOVEREIGN GENESIS ---");
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    const secretKey = Uint8Array.from([87, 68, 219, 149, 118, 168, 203, 106, 197, 62, 228, 150, 218, 79, 95, 78, 6, 39, 148, 196, 64, 34, 209, 131, 33, 151, 241, 241, 219, 120, 105, 50, 172, 173, 120, 219, 141, 89, 194, 47, 74, 113, 128, 124, 204, 79, 114, 40, 129, 225, 235, 169, 155, 229, 51, 19, 225, 237, 137, 210, 179, 252, 243, 51]);
    const payer = Keypair.fromSecretKey(secretKey);
    const satoshiWallet = new PublicKey('35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr');

    console.log(`Payer Authority: ${payer.publicKey.toBase58()}`);

    console.log("[1] Creating Mint (Token-2022 Core)...");
    const mint = await createMint(
        connection,
        payer,
        payer.publicKey,
        payer.publicKey,
        9,
        undefined,
        { commitment: 'confirmed' },
        TOKEN_2022_PROGRAM_ID
    );
    console.log(`   -> SUCCESS: Mint Address: ${mint.toBase58()}`);

    console.log("[2] Generating Protocol Accounts...");
    const payerAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey, false, 'confirmed', undefined, TOKEN_2022_PROGRAM_ID);
    const devAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, satoshiWallet, false, 'confirmed', undefined, TOKEN_2022_PROGRAM_ID);

    console.log("[3] Minting 1 Billion $NNG...");
    await mintTo(connection, payer, mint, payerAta.address, payer, BigInt(1000000000) * BigInt(10 ** 9), [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);

    console.log("[4] Distributing 5% allocation...");
    await transfer(connection, payer, payerAta.address, devAta.address, payer, BigInt(50000000) * BigInt(10 ** 9), [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);

    console.log("[5] REVOKING AUTHORITIES...");
    await setAuthority(connection, payer, mint, payer, AuthorityType.MintTokens, null, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);
    await setAuthority(connection, payer, mint, payer, AuthorityType.FreezeAccount, null, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);

    console.log("\n--- SEMPURNA GENESIS COMPLETE ---");
    console.log(`MINT ADDRESS: ${mint.toBase58()}`);
    console.log(`SOLSCAN: https://solscan.io/token/${mint.toBase58()}?cluster=devnet`);
    require('fs').writeFileSync('SUCCESS_MINT_SIMPLE.txt', mint.toBase58());
}

run().catch(e => {
    console.error(`\n--- FATAL GENESIS ERROR: ${e.message} ---`);
    process.exit(1);
});
