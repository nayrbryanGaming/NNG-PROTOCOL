const {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
} = require('@solana/web3.js');
const {
    TOKEN_2022_PROGRAM_ID,
    getMintLen,
    ExtensionType,
    createInitializeMintInstruction,
    createInitializeTransferFeeConfigInstruction,
    createInitializeMetadataPointerInstruction,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    setAuthority,
    AuthorityType,
    tokenMetadataInitialize,
    transfer,
} = require('@solana/spl-token');

// PARAMS
const TOTAL_SUPPLY = BigInt(1000000000) * BigInt(10 ** 9);
const DEV_ALLOCATION = BigInt(50000000) * BigInt(10 ** 9);
const DECIMALS = 9;
const FEE_BPS = 10; // 0.1%
const MAX_FEE = BigInt(5000) * BigInt(10 ** 9);
const SATOSHI_WALLET = new PublicKey("35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr");

async function main() {
    console.log("--- nayrbryanGaming ($NNG) ABSOLUTE MASTER GENESIS ---");
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // Satoshi Wallet 2.0 (Local Key)
    const secretKey = Uint8Array.from([87, 68, 219, 149, 118, 168, 203, 106, 197, 62, 228, 150, 218, 79, 95, 78, 6, 39, 148, 196, 64, 34, 209, 131, 33, 151, 241, 241, 219, 120, 105, 50, 172, 173, 120, 219, 141, 89, 194, 47, 74, 113, 128, 124, 204, 79, 114, 40, 129, 225, 235, 169, 155, 229, 51, 19, 225, 237, 137, 210, 179, 252, 243, 51]);
    const payer = Keypair.fromSecretKey(secretKey);
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    console.log(`[1] Mint: ${mint.toBase58()}`);

    const extensions = [ExtensionType.TransferFeeConfig, ExtensionType.MetadataPointer];
    const mintLen = getMintLen(extensions);
    const space = mintLen + 300; // Buffer for metadata
    const rent = await connection.getMinimumBalanceForRentExemption(space);

    // PHASE 1: CREATE & INIT
    console.log("[2] Anchoring Sovereign Mint Account...");
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

    // PHASE 2: METADATA & SUPPLY
    console.log("[3] Immobilizing Metadata & Generating 1B Supply...");
    await tokenMetadataInitialize(
        connection,
        payer,
        mint,
        payer.publicKey,
        mint,
        "nayrbryanGaming",
        "NNG",
        "https://nng-ecosystem.com/metadata.json",
        [mintKeypair],
        { commitment: 'confirmed' },
        TOKEN_2022_PROGRAM_ID
    );

    const payerAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey, false, 'confirmed', undefined, TOKEN_2022_PROGRAM_ID);
    await mintTo(connection, payer, mint, payerAta.address, payer, TOTAL_SUPPLY, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);

    // PHASE 3: DISTRIBUTION & REVOCATION
    console.log("[4] Distributing 5% & Revoking Authorities (SOVEREIGN MODE)...");
    const devAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, SATOSHI_WALLET, false, 'confirmed', undefined, TOKEN_2022_PROGRAM_ID);
    await transfer(connection, payer, payerAta.address, devAta.address, payer, DEV_ALLOCATION, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);

    await setAuthority(connection, payer, mint, payer, AuthorityType.MintTokens, null, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);
    await setAuthority(connection, payer, mint, payer, AuthorityType.FreezeAccount, null, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);
    await setAuthority(connection, payer, mint, payer, AuthorityType.MetadataPointer, null, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);

    console.log("\n--- SEMPURNA GENESIS COMPLETE ---");
    console.log(`MINT ADDRESS: ${mint.toBase58()}`);
    console.log(`SOLSCAN: https://solscan.io/token/${mint.toBase58()}?cluster=devnet`);
    require('fs').writeFileSync('ULTIMATE_SUCCESS_MINT.txt', mint.toBase58());
}

main().catch(err => {
    console.error("GENESIS FAILED:", err);
    process.exit(1);
});
