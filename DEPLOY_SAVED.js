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
    getMintLen,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    setAuthority,
    AuthorityType,
    transfer,
    createMintToInstruction,
} = require('@solana/spl-token');

// PARAMS
const TOTAL_SUPPLY = BigInt(1000000000) * BigInt(10 ** 9);
const DECIMALS = 9;
const FEE_BPS = 10; // 0.1%
const MAX_FEE = BigInt(5000) * BigInt(10 ** 9);
const SATOSHI_WALLET = new PublicKey("35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr");

async function main() {
    console.log("--- nayrbryanGaming ($NNG) LIFE-SAVER GENESIS ---");
    const connection = new Connection('https://devnet-rpc.solayer.org', 'confirmed');

    const secretKey = Uint8Array.from([87, 68, 219, 149, 118, 168, 203, 106, 197, 62, 228, 150, 218, 79, 95, 78, 6, 39, 148, 196, 64, 34, 209, 131, 33, 151, 241, 241, 219, 120, 105, 50, 172, 173, 120, 219, 141, 89, 194, 47, 74, 113, 128, 124, 204, 79, 114, 40, 129, 225, 235, 169, 155, 229, 51, 19, 225, 237, 137, 210, 179, 252, 243, 51]);
    const payer = Keypair.fromSecretKey(secretKey);
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    const mintLen = getMintLen([ExtensionType.TransferFeeConfig]);
    const rent = await connection.getMinimumBalanceForRentExemption(mintLen);

    console.log(`[1] Mint Created At: ${mint.toBase58()}`);

    // ATOMIC START
    const tx1 = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint,
            space: mintLen,
            lamports: rent,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeTransferFeeConfigInstruction(mint, payer.publicKey, payer.publicKey, FEE_BPS, MAX_FEE, TOKEN_2022_PROGRAM_ID),
        createInitializeMintInstruction(mint, DECIMALS, payer.publicKey, null, TOKEN_2022_PROGRAM_ID)
    );
    await sendAndConfirmTransaction(connection, tx1, [payer, mintKeypair]);
    console.log("   -> 0.1% Fee Engine ACTIVE.");

    // MINT & DISTRIBUTE
    const ata = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey, false, 'confirmed', undefined, TOKEN_2022_PROGRAM_ID);
    await mintTo(connection, payer, mint, ata.address, payer, TOTAL_SUPPLY, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);
    console.log("   -> 1B Supply Live.");

    const { createTransferInstruction: cT, createSetAuthorityInstruction: cA } = require('@solana/spl-token');
    const devAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, SATOSHI_WALLET, false, 'confirmed', undefined, TOKEN_2022_PROGRAM_ID);
    const txFinal = new Transaction().add(
        cT(ata.address, devAta.address, payer.publicKey, BigInt(50000000) * BigInt(10 ** 9), [], TOKEN_2022_PROGRAM_ID),
        cA(mint, payer.publicKey, AuthorityType.MintTokens, null, [], TOKEN_2022_PROGRAM_ID)
    );
    await sendAndConfirmTransaction(connection, txFinal, [payer]);

    console.log("\n--- SEMPURNA GENESIS COMPLETE (SAVED) ---");
    console.log(`MINT ADDRESS: ${mint.toBase58()}`);
    console.log(`SOLSCAN: https://solscan.io/token/${mint.toBase58()}?cluster=devnet`);
    require('fs').writeFileSync('SAVED_MINT.txt', mint.toBase58());
}

main().catch(err => {
    console.error("GENESIS FAILED:", err);
    process.exit(1);
});
