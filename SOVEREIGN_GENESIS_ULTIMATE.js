const {
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    PublicKey,
    ComputeBudgetProgram,
} = require('@solana/web3.js');
const {
    TOKEN_2022_PROGRAM_ID,
    ExtensionType,
    createInitializeMintInstruction,
    createInitializeTransferFeeConfigInstruction,
    createInitializeMetadataPointerInstruction,
    getMintLen,
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    createMintToCheckedInstruction,
    createTransferCheckedInstruction,
    createSetAuthorityInstruction,
    createInitializeInstruction, // This is for metadata
    AuthorityType,
} = require('@solana/spl-token');

// PARAMETERS
const TOTAL_SUPPLY = BigInt(1000000000) * BigInt(10 ** 9);
const DEV_ALLOCATION = BigInt(50000000) * BigInt(10 ** 9);
const DECIMALS = 9;
const FEE_BPS = 10; // 0.1%
const MAX_FEE = BigInt(5000) * BigInt(10 ** 9);
const SATOSHI_WALLET = new PublicKey("35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr");

async function main() {
    console.log("--- nayrbryanGaming ($NNG) SOVEREIGN GENESIS START ---");
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    const secretKey = Uint8Array.from([87, 68, 219, 149, 118, 168, 203, 106, 197, 62, 228, 150, 218, 79, 95, 78, 6, 39, 148, 196, 64, 34, 209, 131, 33, 151, 241, 241, 219, 120, 105, 50, 172, 173, 120, 219, 141, 89, 194, 47, 74, 113, 128, 124, 204, 79, 114, 40, 129, 225, 235, 169, 155, 229, 51, 19, 225, 237, 137, 210, 179, 252, 243, 51]);
    const payer = Keypair.fromSecretKey(secretKey);
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    // Extension Setup
    const extensions = [
        ExtensionType.TransferFeeConfig,
        ExtensionType.MetadataPointer,
    ];

    // Space for extensions + metadata
    const mintLen = getMintLen(extensions) + 512;
    const rent = await connection.getMinimumBalanceForRentExemption(mintLen);

    console.log(`[1] Protocol Target: ${mint.toBase58()}`);

    // PHASE 1: ATOMIC GENESIS
    console.log("[2] Anchoring Sovereign Mint with Extensions...");
    const tx1 = new Transaction().add(
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200000 }), // Priority gas
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint,
            space: mintLen,
            lamports: rent,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeTransferFeeConfigInstruction(
            mint,
            payer.publicKey,
            payer.publicKey,
            FEE_BPS,
            MAX_FEE,
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMetadataPointerInstruction(
            mint,
            payer.publicKey,
            mint,
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(
            mint,
            DECIMALS,
            payer.publicKey,
            payer.publicKey,
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            metadata: mint,
            updateAuthority: payer.publicKey,
            mint: mint,
            name: "nayrbryanGaming",
            symbol: "NNG",
            uri: "https://nng-ecosystem.com/metadata.json",
        })
    );

    await sendAndConfirmTransaction(connection, tx1, [payer, mintKeypair], { commitment: 'confirmed' });
    console.log("   -> Mint Successfully Anchored.");

    // PHASE 2: VAULT CREATION & MINTING
    console.log("[3] Generating 1 Billion $NNG...");
    const payerAta = getAssociatedTokenAddressSync(mint, payer.publicKey, false, TOKEN_2022_PROGRAM_ID);
    const devAta = getAssociatedTokenAddressSync(mint, SATOSHI_WALLET, false, TOKEN_2022_PROGRAM_ID);

    const tx2 = new Transaction().add(
        createAssociatedTokenAccountInstruction(payer.publicKey, payerAta, payer.publicKey, mint, TOKEN_2022_PROGRAM_ID),
        createAssociatedTokenAccountInstruction(payer.publicKey, devAta, SATOSHI_WALLET, mint, TOKEN_2022_PROGRAM_ID),
        createMintToCheckedInstruction(mint, payerAta, payer.publicKey, TOTAL_SUPPLY, DECIMALS, [], TOKEN_2022_PROGRAM_ID)
    );
    await sendAndConfirmTransaction(connection, tx2, [payer], { commitment: 'confirmed' });

    // PHASE 3: DISTRIBUTION
    console.log("[4] Distributing 5% to Satoshi Wallet 2.0...");
    const tx3 = new Transaction().add(
        createTransferCheckedInstruction(payerAta, mint, devAta, payer.publicKey, DEV_ALLOCATION, DECIMALS, [], TOKEN_2022_PROGRAM_ID)
    );
    await sendAndConfirmTransaction(connection, tx3, [payer], { commitment: 'confirmed' });

    // PHASE 4: ABSOLUTE SOVEREIGNTY (REVOKING AUTHORITIES)
    console.log("[5] Achieving Absolute Autonomy (IRREVERSIBLE)...");
    const tx4 = new Transaction().add(
        createSetAuthorityInstruction(mint, payer.publicKey, AuthorityType.MintTokens, null, [], TOKEN_2022_PROGRAM_ID),
        createSetAuthorityInstruction(mint, payer.publicKey, AuthorityType.FreezeAccount, null, [], TOKEN_2022_PROGRAM_ID),
        createSetAuthorityInstruction(mint, payer.publicKey, AuthorityType.MetadataPointer, null, [], TOKEN_2022_PROGRAM_ID)
    );
    await sendAndConfirmTransaction(connection, tx4, [payer], { commitment: 'confirmed' });

    console.log("\n--- PROTOCOL SUCCESSFULLY AUTONOMOUS ---");
    console.log(`MINT ADDRESS: ${mint.toBase58()}`);
    console.log(`VERIFY: https://solscan.io/token/${mint.toBase58()}?cluster=devnet`);

    require('fs').writeFileSync('SOVEREIGN_MINT_FINAL.txt', mint.toBase58());
    require('fs').appendFileSync('GENESIS_HISTORY.log', `${new Date().toISOString()} - ${mint.toBase58()}\n`);
}

main().catch(err => {
    console.error("GENESIS FAILED:", err);
    process.exit(1);
});
