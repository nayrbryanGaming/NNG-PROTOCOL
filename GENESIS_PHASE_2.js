const {
    Connection,
    Keypair,
    Transaction,
    sendAndConfirmTransaction,
    PublicKey,
} = require('@solana/web3.js');
const {
    TOKEN_2022_PROGRAM_ID,
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    createMintToCheckedInstruction,
    createTransferCheckedInstruction,
    createSetAuthorityInstruction,
    AuthorityType,
} = require('@solana/spl-token');

const TOTAL_SUPPLY = BigInt(1000000000) * BigInt(10 ** 9);
const DEV_ALLOCATION = BigInt(50000000) * BigInt(10 ** 9);
const SATOSHI_WALLET = new PublicKey("35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr");

async function phase2() {
    console.log("--- nayrbryanGaming ($NNG) GENESIS PHASE 2: SUPPLY & SOVEREIGNTY ---");
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const mintStr = require('fs').readFileSync('STEP1_MINT.txt', 'utf8').trim();
    const mint = new PublicKey(mintStr);

    const secretKey = Uint8Array.from([87, 68, 219, 149, 118, 168, 203, 106, 197, 62, 228, 150, 218, 79, 95, 78, 6, 39, 148, 196, 64, 34, 209, 131, 33, 151, 241, 241, 219, 120, 105, 50, 172, 173, 120, 219, 141, 89, 194, 47, 74, 113, 128, 124, 204, 79, 114, 40, 129, 225, 235, 169, 155, 229, 51, 19, 225, 237, 137, 210, 179, 252, 243, 51]);
    const payer = Keypair.fromSecretKey(secretKey);

    const payerAta = getAssociatedTokenAddressSync(mint, payer.publicKey, false, TOKEN_2022_PROGRAM_ID);
    const devAta = getAssociatedTokenAddressSync(mint, SATOSHI_WALLET, false, TOKEN_2022_PROGRAM_ID);

    console.log("[1] Generating Supply...");
    const tx1 = new Transaction().add(
        createAssociatedTokenAccountInstruction(payer.publicKey, payerAta, payer.publicKey, mint, TOKEN_2022_PROGRAM_ID),
        createAssociatedTokenAccountInstruction(payer.publicKey, devAta, SATOSHI_WALLET, mint, TOKEN_2022_PROGRAM_ID),
        createMintToCheckedInstruction(mint, payerAta, payer.publicKey, TOTAL_SUPPLY, 9, [], TOKEN_2022_PROGRAM_ID),
        createTransferCheckedInstruction(payerAta, mint, devAta, payer.publicKey, DEV_ALLOCATION, 9, [], TOKEN_2022_PROGRAM_ID)
    );
    await sendAndConfirmTransaction(connection, tx1, [payer], { commitment: 'confirmed' });

    console.log("[2] Achieving Sovereignty...");
    const tx2 = new Transaction().add(
        createSetAuthorityInstruction(mint, payer.publicKey, AuthorityType.MintTokens, null, [], TOKEN_2022_PROGRAM_ID),
        createSetAuthorityInstruction(mint, payer.publicKey, AuthorityType.FreezeAccount, null, [], TOKEN_2022_PROGRAM_ID),
        createSetAuthorityInstruction(mint, payer.publicKey, AuthorityType.MetadataPointer, null, [], TOKEN_2022_PROGRAM_ID)
    );
    await sendAndConfirmTransaction(connection, tx2, [payer], { commitment: 'confirmed' });

    console.log("PHASE 2 SUCCESS. PROTOCOL IS AUTONOMOUS.");
    console.log(`MINT: ${mint.toBase58()}`);
    require('fs').writeFileSync('SOVEREIGN_MINT_FINAL.txt', mint.toBase58());
}

phase2().catch(err => {
    console.error("PHASE 2 ERROR:", err);
    process.exit(1);
});
