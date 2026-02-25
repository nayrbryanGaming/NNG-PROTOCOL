const {
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    PublicKey,
} = require('@solana/web3.js');
const {
    TOKEN_2022_PROGRAM_ID,
    ExtensionType,
    createInitializeMintInstruction,
    createInitializeTransferFeeConfigInstruction,
    createInitializeMetadataPointerInstruction,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    setAuthority,
    AuthorityType,
    transfer,
    getMintLen,
} = require('@solana/spl-token');

// DEFINITIVE PARAMETERS
const TOTAL_SUPPLY = BigInt(1000000000) * BigInt(10 ** 9);
const DEV_ALLOCATION = BigInt(50000000) * BigInt(10 ** 9);
const DECIMALS = 9;
const FEE_BPS = 10;
const MAX_FEE = BigInt(5000) * BigInt(10 ** 9);
const SATOSHI_WALLET = new PublicKey("35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr");

async function main() {
    console.log("--- nayrbryanGaming ($NNG) ABSOLUTE GENESIS START ---");
    const connection = new Connection('https://devnet-rpc.solayer.org', 'confirmed');

    const secretKey = Uint8Array.from([87, 68, 219, 149, 118, 168, 203, 106, 197, 62, 228, 150, 218, 79, 95, 78, 6, 39, 148, 196, 64, 34, 209, 131, 33, 151, 241, 241, 219, 120, 105, 50, 172, 173, 120, 219, 141, 89, 194, 47, 74, 113, 128, 124, 204, 79, 114, 40, 129, 225, 235, 169, 155, 229, 51, 19, 225, 237, 137, 210, 179, 252, 243, 51]);
    const payer = Keypair.fromSecretKey(secretKey);
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    // Use 1024 bytes to override any extension space issues
    const space = 1024;
    const rent = await connection.getMinimumBalanceForRentExemption(space);

    console.log(`[1] Mint Target: ${mint.toBase58()}`);

    // PHASE 1: ATOMIC GENESIS
    console.log("[2] Broadcasting Atomic Genesis Instruction...");
    const tx1 = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint,
            space: space,
            lamports: rent,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeTransferFeeConfigInstruction(mint, payer.publicKey, payer.publicKey, FEE_BPS, MAX_FEE, TOKEN_2022_PROGRAM_ID),
        createInitializeMetadataPointerInstruction(mint, payer.publicKey, mint, TOKEN_2022_PROGRAM_ID),
        createInitializeMintInstruction(mint, DECIMALS, payer.publicKey, payer.publicKey, TOKEN_2022_PROGRAM_ID)
    );
    await sendAndConfirmTransaction(connection, tx1, [payer, mintKeypair]);
    console.log("   -> Mint Successfully Anchored.");

    // PHASE 2: MINTING & DISTRIBUTION
    console.log("[3] Generating 1 Billion $NNG & Distributing 5%...");
    const payerAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey, false, 'confirmed', undefined, TOKEN_2022_PROGRAM_ID);
    const devAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, SATOSHI_WALLET, false, 'confirmed', undefined, TOKEN_2022_PROGRAM_ID);

    await mintTo(connection, payer, mint, payerAta.address, payer, TOTAL_SUPPLY, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);
    await transfer(connection, payer, payerAta.address, devAta.address, payer, DEV_ALLOCATION, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);
    console.log("   -> Supply & Distribution Confirmed.");

    // PHASE 3: AUTHORITY REVOCATION
    console.log("[4] Revoking Authorities (SOVEREIGN MODE)...");
    await setAuthority(connection, payer, mint, payer, AuthorityType.MintTokens, null, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);
    await setAuthority(connection, payer, mint, payer, AuthorityType.FreezeAccount, null, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);

    console.log("--- SEMPURNA GENESIS COMPLETE ---");
    console.log(`MINT ADDRESS: ${mint.toBase58()}`);
    console.log(`VERIFY: https://solscan.io/token/${mint.toBase58()}?cluster=devnet`);
    require('fs').writeFileSync('FINAL_MINT.txt', mint.toBase58());
}

main().catch(err => {
    console.error("GENESIS ERROR:", err);
    process.exit(1);
});
