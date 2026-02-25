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
    createInitializeInstruction,
} = require('@solana/spl-token');

const DECIMALS = 9;
const FEE_BPS = 10;
const MAX_FEE = BigInt(5000) * BigInt(10 ** 9);

async function phase1() {
    console.log("--- nayrbryanGaming ($NNG) GENESIS PHASE 1: ANCHORING ---");
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    const secretKey = Uint8Array.from([87, 68, 219, 149, 118, 168, 203, 106, 197, 62, 228, 150, 218, 79, 95, 78, 6, 39, 148, 196, 64, 34, 209, 131, 33, 151, 241, 241, 219, 120, 105, 50, 172, 173, 120, 219, 141, 89, 194, 47, 74, 113, 128, 124, 204, 79, 114, 40, 129, 225, 235, 169, 155, 229, 51, 19, 225, 237, 137, 210, 179, 252, 243, 51]);
    const payer = Keypair.fromSecretKey(secretKey);
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    const extensions = [ExtensionType.TransferFeeConfig, ExtensionType.MetadataPointer];
    const mintLen = getMintLen(extensions) + 512;
    const rent = await connection.getMinimumBalanceForRentExemption(mintLen);

    const tx = new Transaction().add(
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200000 }),
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint,
            space: mintLen,
            lamports: rent,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeTransferFeeConfigInstruction(mint, payer.publicKey, payer.publicKey, FEE_BPS, MAX_FEE, TOKEN_2022_PROGRAM_ID),
        createInitializeMetadataPointerInstruction(mint, payer.publicKey, mint, TOKEN_2022_PROGRAM_ID),
        createInitializeMintInstruction(mint, DECIMALS, payer.publicKey, payer.publicKey, TOKEN_2022_PROGRAM_ID),
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

    console.log(`Target Mint: ${mint.toBase58()}`);
    await sendAndConfirmTransaction(connection, tx, [payer, mintKeypair], { commitment: 'confirmed' });
    console.log("PHASE 1 SUCCESS.");
    require('fs').writeFileSync('STEP1_MINT.txt', mint.toBase58());
}

phase1().catch(err => {
    console.error("PHASE 1 ERROR:", err);
    process.exit(1);
});
