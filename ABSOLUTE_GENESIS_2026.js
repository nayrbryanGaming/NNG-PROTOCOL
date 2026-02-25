const { Connection, PublicKey, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction, ComputeBudgetProgram } = require('@solana/web3.js');
const {
    TOKEN_2022_PROGRAM_ID,
    getMintLen,
    ExtensionType,
    createInitializeMintInstruction,
    createInitializeTransferFeeConfigInstruction,
    getOrCreateAssociatedTokenAccount,
    mintToChecked,
    transferChecked,
    setAuthority,
    AuthorityType
} = require('@solana/spl-token');

async function run() {
    console.log("--- nayrbryanGaming ($NNG) ABSOLUTE GENESIS 2026 ---");
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // Satoshi 2.0 Payer Keypair
    const secretKey = Uint8Array.from([87, 68, 219, 149, 118, 168, 203, 106, 197, 62, 228, 150, 218, 79, 95, 78, 6, 39, 148, 196, 64, 34, 209, 131, 33, 151, 241, 241, 219, 120, 105, 50, 172, 173, 120, 219, 141, 89, 194, 47, 74, 113, 128, 124, 204, 79, 114, 40, 129, 225, 235, 169, 155, 229, 51, 19, 225, 237, 137, 210, 179, 252, 243, 51]);
    const payer = Keypair.fromSecretKey(secretKey);
    const satoshiWallet = new PublicKey('35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr');

    console.log(`Payer Authority: ${payer.publicKey.toBase58()}`);
    console.log(`Target Dev Wallet: ${satoshiWallet.toBase58()}`);

    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    const extensions = [ExtensionType.TransferFeeConfig];
    const mintLen = getMintLen(extensions);
    const rent = await connection.getMinimumBalanceForRentExemption(mintLen);

    console.log(`[1] Initiating Mint Broadcast: ${mint.toBase58()}`);
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 });
    const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10000 });

    const tx1 = new Transaction().add(
        modifyComputeUnits,
        addPriorityFee,
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint,
            space: mintLen,
            lamports: rent,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeTransferFeeConfigInstruction(
            mint,
            payer.publicKey, // fee config authority
            payer.publicKey, // withdraw authority
            10, // 0.1% FEE
            BigInt(5000 * 10 ** 9),
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(
            mint,
            9,
            payer.publicKey,
            payer.publicKey,
            TOKEN_2022_PROGRAM_ID
        )
    );

    const sig1 = await sendAndConfirmTransaction(connection, tx1, [payer, mintKeypair]);
    console.log(`   -> Genesis Anchor Sig: ${sig1}`);

    console.log("[2] Generating Protocol Vaults...");
    const payerAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey, false, 'confirmed', undefined, TOKEN_2022_PROGRAM_ID);
    const devAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, satoshiWallet, false, 'confirmed', undefined, TOKEN_2022_PROGRAM_ID);

    console.log("[3] Forging 1,000,000,000 $NNG supply...");
    const sigMint = await mintToChecked(connection, payer, mint, payerAta.address, payer, BigInt(1000000000) * BigInt(10 ** 9), 9, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);
    console.log(`   -> Proof of Mint: ${sigMint}`);

    console.log("[4] Broadcasting 5% Dev Allocation...");
    const sigDev = await transferChecked(connection, payer, payerAta.address, mint, devAta.address, payer, BigInt(50000000) * BigInt(10 ** 9), 9, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);
    console.log(`   -> Proof of Distribution: ${sigDev}`);

    console.log("[5] REVOKING ALL AUTHORITIES (SOVEREIGN MODE)...");
    await setAuthority(connection, payer, mint, payer, AuthorityType.MintTokens, null, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);
    await setAuthority(connection, payer, mint, payer, AuthorityType.FreezeAccount, null, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);

    console.log("\n--- SEMPURNA GENESIS COMPLETE ---");
    console.log(`MINT ADDRESS: ${mint.toBase58()}`);
    console.log(`SOLSCAN: https://solscan.io/token/${mint.toBase58()}?cluster=devnet`);
    require('fs').writeFileSync('SUCCESS_MINT_FINAL.txt', mint.toBase58());
}

run().catch(e => {
    console.error("--- GENESIS FAILURE ---");
    console.error(e.message);
    process.exit(1);
});
