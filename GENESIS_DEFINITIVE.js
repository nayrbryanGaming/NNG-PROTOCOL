const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const {
    TOKEN_2022_PROGRAM_ID,
    createMint,
    createAssociatedTokenAccount,
    mintTo,
    transfer,
    setAuthority,
    AuthorityType,
    tokenMetadataInitialize
} = require('@solana/spl-token');

async function genesis() {
    console.log("--- nayrbryanGaming ($NNG) DEFINITIVE GENESIS ---");
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    const secretKey = Uint8Array.from([87, 68, 219, 149, 118, 168, 203, 106, 197, 62, 228, 150, 218, 79, 95, 78, 6, 39, 148, 196, 64, 34, 209, 131, 33, 151, 241, 241, 219, 120, 105, 50, 172, 173, 120, 219, 141, 89, 194, 47, 74, 113, 128, 124, 204, 79, 114, 40, 129, 225, 235, 169, 155, 229, 51, 19, 225, 237, 137, 210, 179, 252, 243, 51]);
    const payer = Keypair.fromSecretKey(secretKey);
    const satoshiWallet = new PublicKey('35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr');

    // CORRECT ADDRESS: Cd4YXjihT6wtjMQi5oxZocHSKhbEwfE3VnGa9X2s68Yi
    console.log(`Authority Address: ${payer.publicKey.toBase58()}`);

    try {
        console.log("[1/5] Creating Token-2022 Core...");
        // Manual construction to ensure EXACT Token-2022 & Transfer Fee
        const { Transaction, SystemProgram, sendAndConfirmTransaction, ComputeBudgetProgram } = require('@solana/web3.js');
        const { getMintLen, createInitializeMintInstruction, createInitializeTransferFeeConfigInstruction, ExtensionType } = require('@solana/spl-token');

        const mintKeypair = Keypair.generate();
        const mint = mintKeypair.publicKey;

        const extensions = [ExtensionType.TransferFeeConfig, ExtensionType.MetadataPointer];
        const mintLen = getMintLen(extensions);
        const rent = await connection.getMinimumBalanceForRentExemption(mintLen + 600);

        const tx1 = new Transaction().add(
            ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 }),
            SystemProgram.createAccount({
                fromPubkey: payer.publicKey,
                newAccountPubkey: mint,
                space: mintLen + 600,
                lamports: rent,
                programId: TOKEN_2022_PROGRAM_ID,
            }),
            createInitializeTransferFeeConfigInstruction(mint, payer.publicKey, payer.publicKey, 10, BigInt(5000 * 10 ** 9), TOKEN_2022_PROGRAM_ID),
            createInitializeMintInstruction(mint, 9, payer.publicKey, null, TOKEN_2022_PROGRAM_ID)
        );

        const sig1 = await sendAndConfirmTransaction(connection, tx1, [payer, mintKeypair]);
        console.log(`   -> Core Proof: ${sig1}`);

        console.log("[2/5] Initializing Metadata...");
        await tokenMetadataInitialize(
            connection,
            payer,
            mint,
            payer.publicKey,
            payer.publicKey,
            'nayrbryanGaming',
            'NNG',
            'https://nng-ecosystem.com/metadata.json',
            [],
            { commitment: 'confirmed' },
            TOKEN_2022_PROGRAM_ID
        );
        console.log("   -> Metadata OK.");

        console.log("[3/5] Syncing ATAs...");
        const payerAta = await createAssociatedTokenAccount(connection, payer, mint, payer.publicKey, { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);
        const devAta = await createAssociatedTokenAccount(connection, payer, mint, satoshiWallet, { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);

        console.log("[4/5] Minting 1B & Sending Dev Allocation...");
        await mintTo(connection, payer, mint, payerAta, payer, BigInt(1000000000) * BigInt(10 ** 9), [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);
        await transfer(connection, payer, payerAta, devAta, payer, BigInt(50000000) * BigInt(10 ** 9), [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);

        console.log("[5/5] ACTIBATING SOVEREIGN MODE (SATOSHI 2.0)...");
        await setAuthority(connection, payer, mint, payer, AuthorityType.MintTokens, null, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);

        console.log(`\n=================================================`);
        console.log(`$NNG GENESIS SUCCESSFUL (DEFINITIVE)`);
        console.log(`MINT: ${mint.toBase58()}`);
        console.log(`URL: https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`);
        console.log(`=================================================\n`);

        require('fs').writeFileSync('NNG_DEFINITIVE_REPORT.txt', `Mint: ${mint.toBase58()}\nSig: ${sig1}`);
    } catch (e) {
        console.error(`GENESIS FAILURE: ${e.message}`);
        if (e.logs) e.logs.forEach(l => console.log(l));
        process.exit(1);
    }
}

genesis();
