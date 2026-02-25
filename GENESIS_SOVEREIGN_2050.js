const {
    Connection,
    PublicKey,
    Keypair,
    Transaction,
    sendAndConfirmTransaction,
    ComputeBudgetProgram,
    SystemProgram,
} = require('@solana/web3.js');
const {
    TOKEN_2022_PROGRAM_ID,
    ExtensionType,
    getMintLen,
    createInitializeMintInstruction,
    createInitializeTransferFeeConfigInstruction,
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    createMintToCheckedInstruction,
    createTransferCheckedInstruction,
    createSetAuthorityInstruction,
    AuthorityType,
    createInitializeMetadataPointerInstruction,
} = require('@solana/spl-token');
const { createInitializeInstruction, pack } = require('@solana/spl-token-metadata');

// PARAMS
const DECIMALS = 9;
const TOTAL_SUPPLY = BigInt(1000000000) * BigInt(10 ** DECIMALS);
const DEV_ALLOCATION = BigInt(50000000) * BigInt(10 ** DECIMALS);
const SATOSHI_WALLET = new PublicKey('35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr');
const TRANSFER_FEE_BPS = 10; // 0.1%
const MAX_FEE = BigInt(5000) * BigInt(10 ** DECIMALS);

async function genesis() {
    console.log("--- nayrbryanGaming ($NNG) PROTOCOL GENESIS ---");
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    const secretKey = Uint8Array.from([87, 68, 219, 149, 118, 168, 203, 106, 197, 62, 228, 150, 218, 79, 95, 78, 6, 39, 148, 196, 64, 34, 209, 131, 33, 151, 241, 241, 219, 120, 105, 50, 172, 173, 120, 219, 141, 89, 194, 47, 74, 113, 128, 124, 204, 79, 114, 40, 129, 225, 235, 169, 155, 229, 51, 19, 225, 237, 137, 210, 179, 252, 243, 51]);
    const payer = Keypair.fromSecretKey(secretKey);
    console.log(`Authority Wallet: ${payer.publicKey.toBase58()}`);

    try {
        console.log("Ensuring SOL balance via airdrop...");
        const airdropSig = await connection.requestAirdrop(payer.publicKey, 2 * 10 ** 9);
        await connection.confirmTransaction(airdropSig);
    } catch (e) { console.log("Airdrop skipped/limit."); }

    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;
    console.log(`Target Mint Address: ${mint.toBase58()}`);

    // Extension configuration
    const extensions = [ExtensionType.TransferFeeConfig, ExtensionType.MetadataPointer];
    const mintLen = getMintLen(extensions);

    // Metadata configuration
    const metaData = {
        name: 'nayrbryanGaming',
        symbol: 'NNG',
        uri: 'https://nng-ecosystem.com/metadata.json',
    };
    // Reserve space for metadata + extensions
    const metadataLen = 1000; // Safe buffer for metadata in account
    const rent = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

    const payerAta = getAssociatedTokenAddressSync(mint, payer.publicKey, false, TOKEN_2022_PROGRAM_ID);
    const devAta = getAssociatedTokenAddressSync(mint, SATOSHI_WALLET, false, TOKEN_2022_PROGRAM_ID);

    console.log("[1] Constructing Atomic Genesis Transaction...");
    const transaction = new Transaction().add(
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000000 }),
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
            TRANSFER_FEE_BPS,
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
            null,
            TOKEN_2022_PROGRAM_ID
        ),
        // Built-in metadata init
        createInitializeInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            metadata: mint,
            updateAuthority: payer.publicKey,
            mint: mint,
            mintAuthority: payer.publicKey,
            name: metaData.name,
            symbol: metaData.symbol,
            uri: metaData.uri,
        }),
        createAssociatedTokenAccountInstruction(payer.publicKey, payerAta, payer.publicKey, mint, TOKEN_2022_PROGRAM_ID),
        createAssociatedTokenAccountInstruction(payer.publicKey, devAta, SATOSHI_WALLET, mint, TOKEN_2022_PROGRAM_ID),
        createMintToCheckedInstruction(mint, payerAta, payer.publicKey, TOTAL_SUPPLY, DECIMALS, [], TOKEN_2022_PROGRAM_ID),
        createTransferCheckedInstruction(payerAta, mint, devAta, payer.publicKey, DEV_ALLOCATION, DECIMALS, [], TOKEN_2022_PROGRAM_ID),
        createSetAuthorityInstruction(mint, payer.publicKey, AuthorityType.MintTokens, null, [], TOKEN_2022_PROGRAM_ID)
    );

    console.log("[2] Broadcasting to Devnet...");
    try {
        const signature = await sendAndConfirmTransaction(connection, transaction, [payer, mintKeypair], { commitment: 'confirmed' });
        console.log(`\\nSUCCESS: $NNG IS LIVE AT GENESIS`);
        console.log(`SIG: ${signature}`);
        console.log(`MINT: ${mint.toBase58()}`);
        console.log(`EXPLORER: https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`);
    } catch (e) {
        console.error(`\\nDEPLOYMENT FAILED: ${e.message}`);
        if (e.logs) console.error(e.logs);
        process.exit(1);
    }
}

genesis();
