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
    console.log("--- nayrbryanGaming ($NNG) ULTIMATE SEMPURNA GENESIS ---");

    const rpcs = [
        'https://devnet-rpc.solayer.org',
        'https://api.devnet.solana.com'
    ];

    let connection;
    for (const url of rpcs) {
        try {
            connection = new Connection(url, 'confirmed');
            await connection.getSlot();
            console.log(`Using RPC: ${url}`);
            break;
        } catch (e) {
            console.log(`RPC Failed: ${url}`);
        }
    }

    const secretKey = Uint8Array.from([87, 68, 219, 149, 118, 168, 203, 106, 197, 62, 228, 150, 218, 79, 95, 78, 6, 39, 148, 196, 64, 34, 209, 131, 33, 151, 241, 241, 219, 120, 105, 50, 172, 173, 120, 219, 141, 89, 194, 47, 74, 113, 128, 124, 204, 79, 114, 40, 129, 225, 235, 169, 155, 229, 51, 19, 225, 237, 137, 210, 179, 252, 243, 51]);
    const payer = Keypair.fromSecretKey(secretKey);
    const satoshiWallet = new PublicKey('35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr');

    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    const extensions = [ExtensionType.TransferFeeConfig];
    const mintLen = getMintLen(extensions);
    const rent = await connection.getMinimumBalanceForRentExemption(mintLen);

    console.log(`[1] Genesis Broadcast Start: ${mint.toBase58()}`);

    // Step 1: Create Mint
    const tx1 = new Transaction().add(
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 }),
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
            10, // 0.1%
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

    try {
        await sendAndConfirmTransaction(connection, tx1, [payer, mintKeypair], { commitment: 'confirmed' });
        console.log("   -> Success: Mint Live.");
    } catch (e) {
        console.error(`Genesis Anchor Failure: ${e.message}`);
        if (e.logs) console.error(e.logs);
        process.exit(1);
    }

    console.log("[2] Generating Protocol Liquidity Paths...");
    const payerAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey, false, 'confirmed', undefined, TOKEN_2022_PROGRAM_ID);
    const devAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, satoshiWallet, false, 'confirmed', undefined, TOKEN_2022_PROGRAM_ID);

    console.log("[3] Minting 1,000,000,000 $NNG...");
    await mintToChecked(connection, payer, mint, payerAta.address, payer, BigInt(1000000000) * BigInt(10 ** 9), 9, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);

    console.log("[4] Executing 5% Dev Allocation...");
    await transferChecked(connection, payer, payerAta.address, mint, devAta.address, payer, BigInt(50000000) * BigInt(10 ** 9), 9, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);

    console.log("[5] SEALING PROTOCOL AUTHORITIES (NULL/PERMANENT)...");
    const txFinal = new Transaction().add(
        createSetAuthorityInstruction(mint, payer.publicKey, AuthorityType.MintTokens, null, [], TOKEN_2022_PROGRAM_ID),
        createSetAuthorityInstruction(mint, payer.publicKey, AuthorityType.FreezeAccount, null, [], TOKEN_2022_PROGRAM_ID)
    );
    await sendAndConfirmTransaction(connection, txFinal, [payer], { commitment: 'confirmed' });

    console.log("\n--- SEMPURNA GENESIS COMPLETE ---");
    console.log(`MINT ADDRESS: ${mint.toBase58()}`);
    console.log(`SOLSCAN: https://solscan.io/token/${mint.toBase58()}?cluster=devnet`);
    require('fs').writeFileSync('SUCCESS_MINT_FINAL.txt', mint.toBase58());
}

run().catch(console.error);
