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
} = require('@solana/spl-token');

// PARAMS
const TOTAL_SUPPLY = BigInt(1000000000) * BigInt(10 ** 9);
const DEV_ALLOCATION = BigInt(50000000) * BigInt(10 ** 9);
const DECIMALS = 9;
const FEE_BPS = 10; // 0.1%
const MAX_FEE = BigInt(5000) * BigInt(10 ** 9);
const SATOSHI_WALLET = new PublicKey("35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr");

async function main() {
    console.log("--- nayrbryanGaming ($NNG) MASTER GENESIS ---");
    const connection = new Connection('https://devnet-rpc.solayer.org', 'confirmed');

    const secretKey = Uint8Array.from([87, 68, 219, 149, 118, 168, 203, 106, 197, 62, 228, 150, 218, 79, 95, 78, 6, 39, 148, 196, 64, 34, 209, 131, 33, 151, 241, 241, 219, 120, 105, 50, 172, 173, 120, 219, 141, 89, 194, 47, 74, 113, 128, 124, 204, 79, 114, 40, 129, 225, 235, 169, 155, 229, 51, 19, 225, 237, 137, 210, 179, 252, 243, 51]);
    const payer = Keypair.fromSecretKey(secretKey);
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    // Use a safe, larger space
    const space = getMintLen([ExtensionType.TransferFeeConfig, ExtensionType.MetadataPointer]) + 200;
    const rent = await connection.getMinimumBalanceForRentExemption(space);

    console.log(`[1] Mint: ${mint.toBase58()}`);

    // STEP 1: CREATE & INIT MINT (CORE)
    const tx1 = new Transaction().add(
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 }),
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
    console.log("   -> Mint Live with 0.1% Fee engine.");

    // STEP 2: MINT SUPPLY
    const ata = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey, false, 'confirmed', undefined, TOKEN_2022_PROGRAM_ID);
    await mintTo(connection, payer, mint, ata.address, payer, TOTAL_SUPPLY, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);
    console.log("   -> 1 Billion Supply Minted.");

    // STEP 3: DISTRIBUTE & REVOKE
    const devAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, SATOSHI_WALLET, false, 'confirmed', undefined, TOKEN_2022_PROGRAM_ID);
    const txFinal = new Transaction().add(
        transfer(connection, payer, ata.address, devAta.address, payer, DEV_ALLOCATION, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID), // WRONG TYPE, use createTransferInstruction
        setAuthority(connection, payer, mint, payer, AuthorityType.MintTokens, null, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID)
    );
    // Fix: Using individual confirms to avoid anySDK ambiguity
    const { createTransferInstruction: createT } = require('@solana/spl-token');
    const tx3 = new Transaction().add(
        createT(ata.address, devAta.address, payer.publicKey, DEV_ALLOCATION, [], TOKEN_2022_PROGRAM_ID),
        createSetAuthorityInstruction(mint, payer.publicKey, AuthorityType.MintTokens, null, [], TOKEN_2022_PROGRAM_ID),
        createSetAuthorityInstruction(mint, payer.publicKey, AuthorityType.FreezeAccount, null, [], TOKEN_2022_PROGRAM_ID)
    );
    await sendAndConfirmTransaction(connection, tx3, [payer]);

    console.log("\n--- GENESIS SEMPURNA COMPLETE ---");
    console.log(`MINT ADDRESS: ${mint.toBase58()}`);
    console.log(`SOLSCAN: https://solscan.io/token/${mint.toBase58()}?cluster=devnet`);
}

main().catch(err => {
    console.error("GENESIS FAILED:", err);
    process.exit(1);
});
