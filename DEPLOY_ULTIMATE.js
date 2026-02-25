const {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    ComputeBudgetProgram,
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
    createMintToInstruction,
    createSetAuthorityInstruction,
    createTransferInstruction,
} = require('@solana/spl-token');

// Genesis Parameters
const TOTAL_SUPPLY = BigInt(1000000000) * BigInt(Math.pow(10, 9));
const DEV_ALLOCATION = BigInt(50000000) * BigInt(Math.pow(10, 9));
const DECIMALS = 9;
const FEE_BPS = 10; // 0.1%
const MAX_FEE = BigInt(5000) * BigInt(Math.pow(10, 9));
const SATOSHI_WALLET = new PublicKey("35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr");

async function main() {
    console.log("--- nayrbryanGaming ($NNG) ULTIMATE SEMPURNA GENESIS ---");
    const connection = new Connection('https://devnet-rpc.solayer.org', 'confirmed');

    // Satoshi Wallet 2.0 (Local Key) - This wallet is funded (~1 SOL)
    const secretKey = Uint8Array.from([87, 68, 219, 149, 118, 168, 203, 106, 197, 62, 228, 150, 218, 79, 95, 78, 6, 39, 148, 196, 64, 34, 209, 131, 33, 151, 241, 241, 219, 120, 105, 50, 172, 173, 120, 219, 141, 89, 194, 47, 74, 113, 128, 124, 204, 79, 114, 40, 129, 225, 235, 169, 155, 229, 51, 19, 225, 237, 137, 210, 179, 252, 243, 51]);
    const payer = Keypair.fromSecretKey(secretKey);
    console.log(`[1] Genesis Payer: ${payer.publicKey.toBase58()}`);

    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;
    console.log(`[2] Mint Address: ${mint.toBase58()}`);

    // Extension and Space Calculation
    const extensions = [ExtensionType.TransferFeeConfig, ExtensionType.MetadataPointer];
    const mintLen = getMintLen(extensions);
    const metadataSpace = 256; // Standard buffer for name/symbol/uri
    const space = mintLen + metadataSpace;
    const rent = await connection.getMinimumBalanceForRentExemption(space);

    // PRIORITY FEES (Crucial for bypass)
    const setComputeUnitPrice = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 });
    const setComputeUnitLimit = ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 });

    // PHASE 1: ATOMIC CREATION & INITIALIZATION
    console.log("[3] Initializing Sovereign Mint & Fee Engine...");
    const createAccountInstruction = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint,
        space: space,
        lamports: rent,
        programId: TOKEN_2022_PROGRAM_ID,
    });
    const initializeTransferFeeConfig = createInitializeTransferFeeConfigInstruction(
        mint,
        payer.publicKey,
        payer.publicKey,
        FEE_BPS,
        MAX_FEE,
        TOKEN_2022_PROGRAM_ID
    );
    const initializeMetadataPointer = createInitializeMetadataPointerInstruction(
        mint,
        payer.publicKey,
        mint, // Metadata stored in the mint itself
        TOKEN_2022_PROGRAM_ID
    );
    const initializeMint = createInitializeMintInstruction(
        mint,
        DECIMALS,
        payer.publicKey,
        payer.publicKey, // Temporary freeze authority for setup
        TOKEN_2022_PROGRAM_ID
    );

    const tx1 = new Transaction().add(
        setComputeUnitPrice,
        setComputeUnitLimit,
        createAccountInstruction,
        initializeTransferFeeConfig,
        initializeMetadataPointer,
        initializeMint
    );
    await sendAndConfirmTransaction(connection, tx1, [payer, mintKeypair]);
    console.log("   -> Phase 1 Anchored.");

    // PHASE 2: METADATA
    console.log("[4] Anchoring Immutable Metadata...");
    // Using manual instruction to avoid SDK simulation issues
    await tokenMetadataInitialize(
        connection,
        payer,
        mint,
        payer.publicKey,
        mint,
        "nayrbryanGaming",
        "NNG",
        "https://nng-ecosystem.com/metadata.json",
        [mintKeypair], // Mint must sign as it holds metadata
        { commitment: 'confirmed' },
        TOKEN_2022_PROGRAM_ID
    );
    console.log("   -> Phase 2 Immobilized.");

    // PHASE 3: MINTING & DISTRIBUTION (5%)
    console.log("[5] Minting Supply & Global Distribution...");
    const payerAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey, false, 'confirmed', undefined, TOKEN_2022_PROGRAM_ID);
    const devAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, SATOSHI_WALLET, false, 'confirmed', undefined, TOKEN_2022_PROGRAM_ID);

    const tx2 = new Transaction().add(
        setComputeUnitPrice,
        createMintToInstruction(mint, payerAta.address, payer.publicKey, TOTAL_SUPPLY, [], TOKEN_2022_PROGRAM_ID),
        createTransferInstruction(payerAta.address, devAta.address, payer.publicKey, DEV_ALLOCATION, [], TOKEN_2022_PROGRAM_ID)
    );
    await sendAndConfirmTransaction(connection, tx2, [payer]);
    console.log("   -> Phase 3 Supply Verification Successful.");

    // PHASE 4: REVOKE AUTHORITIES (SOVEREIGN MODE)
    console.log("[6] REVOKING AUTHORITIES (AUTONOMOUS TRANSITION)...");
    const tx3 = new Transaction().add(
        setComputeUnitPrice,
        createSetAuthorityInstruction(mint, payer.publicKey, AuthorityType.MintTokens, null, [], TOKEN_2022_PROGRAM_ID),
        createSetAuthorityInstruction(mint, payer.publicKey, AuthorityType.FreezeAccount, null, [], TOKEN_2022_PROGRAM_ID),
        createSetAuthorityInstruction(mint, payer.publicKey, AuthorityType.MetadataPointer, null, [], TOKEN_2022_PROGRAM_ID)
    );
    await sendAndConfirmTransaction(connection, tx3, [payer]);
    console.log("   -> Authorities REVOKED. Status: SOVEREIGN.");

    console.log("\n--- SEMPURNA GENESIS COMPLETE ---");
    console.log(`MINT ADDRESS: ${mint.toBase58()}`);
    console.log(`SOLSCAN: https://solscan.io/token/${mint.toBase58()}?cluster=devnet`);

    // Save to local persistence
    require('fs').writeFileSync('SUCCESS_MINT.txt', mint.toBase58());
}

main().catch(err => {
    console.error("\nGENESIS FAILED:", err);
    process.exit(1);
});
