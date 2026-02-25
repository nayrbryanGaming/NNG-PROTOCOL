const { Connection, PublicKey, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction, ComputeBudgetProgram } = require('@solana/web3.js');
const {
    TOKEN_2022_PROGRAM_ID,
    getMintLen,
    ExtensionType,
    createInitializeMintInstruction,
    createInitializeTransferFeeConfigInstruction,
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    createMintToCheckedInstruction,
    createTransferCheckedInstruction,
    createSetAuthorityInstruction,
    AuthorityType
} = require('@solana/spl-token');

async function run() {
    console.log("--- nayrbryanGaming ($NNG) MONOLITH GENESIS ---");
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    const secretKey = Uint8Array.from([87, 68, 219, 149, 118, 168, 203, 106, 197, 62, 228, 150, 218, 79, 95, 78, 6, 39, 148, 196, 64, 34, 209, 131, 33, 151, 241, 241, 219, 120, 105, 50, 172, 173, 120, 219, 141, 89, 194, 47, 74, 113, 128, 124, 204, 79, 114, 40, 129, 225, 235, 169, 155, 229, 51, 19, 225, 237, 137, 210, 179, 252, 243, 51]);
    const payer = Keypair.fromSecretKey(secretKey);
    const satoshiWallet = new PublicKey('35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr');

    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    console.log(`Payer: ${payer.publicKey.toBase58()}`);
    console.log(`Mint: ${mint.toBase58()}`);

    const extensions = [ExtensionType.TransferFeeConfig];
    const mintLen = getMintLen(extensions);
    const rent = await connection.getMinimumBalanceForRentExemption(mintLen);

    const payerAta = getAssociatedTokenAddressSync(mint, payer.publicKey, false, TOKEN_2022_PROGRAM_ID);
    const devAta = getAssociatedTokenAddressSync(mint, satoshiWallet, false, TOKEN_2022_PROGRAM_ID);

    console.log("[1] Constructing Monolith Transaction...");
    const tx = new Transaction().add(
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200000 }),
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint,
            space: mintLen,
            lamports: rent,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeTransferFeeConfigInstruction(mint, payer.publicKey, payer.publicKey, 10, BigInt(5000 * 10 ** 9), TOKEN_2022_PROGRAM_ID),
        createInitializeMintInstruction(mint, 9, payer.publicKey, null, TOKEN_2022_PROGRAM_ID),
        createAssociatedTokenAccountInstruction(payer.publicKey, payerAta, payer.publicKey, mint, TOKEN_2022_PROGRAM_ID),
        createAssociatedTokenAccountInstruction(payer.publicKey, devAta, satoshiWallet, mint, TOKEN_2022_PROGRAM_ID),
        createMintToCheckedInstruction(mint, payerAta, payer.publicKey, BigInt(1000000000) * BigInt(10 ** 9), 9, [], TOKEN_2022_PROGRAM_ID),
        createTransferCheckedInstruction(payerAta, mint, devAta, payer.publicKey, BigInt(50000000) * BigInt(10 ** 9), 9, [], TOKEN_2022_PROGRAM_ID),
        createSetAuthorityInstruction(mint, payer.publicKey, AuthorityType.MintTokens, null, [], TOKEN_2022_PROGRAM_ID)
    );

    console.log("[2] Broadcasting to Blockchain...");
    try {
        const sig = await sendAndConfirmTransaction(connection, tx, [payer, mintKeypair], { commitment: 'confirmed' });
        console.log(`\n--- SEMPURNA GENESIS COMPLETE ---`);
        console.log(`SIG: ${sig}`);
        console.log(`MINT ADDRESS: ${mint.toBase58()}`);
        console.log(`EXPLORER: https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`);
        require('fs').writeFileSync('SUCCESS_MINT_ABSOLUTE.txt', mint.toBase58());
    } catch (e) {
        console.error(`ERROR: ${e.message}`);
        if (e.logs) console.error(e.logs);
        process.exit(1);
    }
}

run();
