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
    console.log("--- nayrbryanGaming ($NNG) ABSOLUTE GENESIS 2026 ---");
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

    console.log("[1] Anchoring Sovereign Mint...");
    const tx1 = new Transaction().add(
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200000 }),
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint,
            space: mintLen,
            lamports: rent,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeTransferFeeConfigInstruction(mint, payer.publicKey, payer.publicKey, 10, BigInt(5000 * 10 ** 9), TOKEN_2022_PROGRAM_ID),
        createInitializeMintInstruction(mint, 9, payer.publicKey, payer.publicKey, TOKEN_2022_PROGRAM_ID)
    );
    await sendAndConfirmTransaction(connection, tx1, [payer, mintKeypair], { commitment: 'confirmed' });

    console.log("[2] Generating Vaults...");
    const tx2 = new Transaction().add(
        createAssociatedTokenAccountInstruction(payer.publicKey, payerAta, payer.publicKey, mint, TOKEN_2022_PROGRAM_ID),
        createAssociatedTokenAccountInstruction(payer.publicKey, devAta, satoshiWallet, mint, TOKEN_2022_PROGRAM_ID)
    );
    await sendAndConfirmTransaction(connection, tx2, [payer], { commitment: 'confirmed' });

    console.log("[3] Minting 1B Supply...");
    const tx3 = new Transaction().add(
        createMintToCheckedInstruction(mint, payerAta, payer.publicKey, BigInt(1000000000) * BigInt(10 ** 9), 9, [], TOKEN_2022_PROGRAM_ID)
    );
    await sendAndConfirmTransaction(connection, tx3, [payer], { commitment: 'confirmed' });

    console.log("[4] Distributing 5% allocation...");
    const tx4 = new Transaction().add(
        createTransferCheckedInstruction(payerAta, mint, devAta, payer.publicKey, BigInt(50000000) * BigInt(10 ** 9), 9, [], TOKEN_2022_PROGRAM_ID)
    );
    await sendAndConfirmTransaction(connection, tx4, [payer], { commitment: 'confirmed' });

    console.log("[5] REVOKING AUTHORITIES...");
    const tx5 = new Transaction().add(
        createSetAuthorityInstruction(mint, payer.publicKey, AuthorityType.MintTokens, null, [], TOKEN_2022_PROGRAM_ID),
        createSetAuthorityInstruction(mint, payer.publicKey, AuthorityType.FreezeAccount, null, [], TOKEN_2022_PROGRAM_ID)
    );
    await sendAndConfirmTransaction(connection, tx5, [payer], { commitment: 'confirmed' });

    console.log("\n--- SEMPURNA GENESIS COMPLETE ---");
    console.log(`MINT ADDRESS: ${mint.toBase58()}`);
    console.log(`SOLSCAN: https://solscan.io/token/${mint.toBase58()}?cluster=devnet`);
    require('fs').writeFileSync('FINAL_REAL_MINT.txt', mint.toBase58());
}

run().catch(e => {
    console.error(`ERROR: ${e.message}`);
    process.exit(1);
});
