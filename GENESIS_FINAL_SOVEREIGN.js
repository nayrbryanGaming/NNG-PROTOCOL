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
    console.log("--- nayrbryanGaming ($NNG) FINAL SOVEREIGN GENESIS ---");
    const connection = new Connection('https://devnet-rpc.solayer.org', 'confirmed');

    const secretKey = Uint8Array.from([87, 68, 219, 149, 118, 168, 203, 106, 197, 62, 228, 150, 218, 79, 95, 78, 6, 39, 148, 196, 64, 34, 209, 131, 33, 151, 241, 241, 219, 120, 105, 50, 172, 173, 120, 219, 141, 89, 194, 47, 74, 113, 128, 124, 204, 79, 114, 40, 129, 225, 235, 169, 155, 229, 51, 19, 225, 237, 137, 210, 179, 252, 243, 51]);
    const payer = Keypair.fromSecretKey(secretKey);
    const satoshiWallet = new PublicKey('35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr');

    console.log(`Authority: ${payer.publicKey.toBase58()}`);

    try {
        console.log("[1/5] Creating Mint with Extensions...");
        // Note: For Transfer Fee, we need to pass the BPS. 
        // createMint helper might not support Transfer Fee directly without manual tx.
        // Let's use the manual transaction logic but with the FIX for the program ID.

        const { Transaction, SystemProgram, sendAndConfirmTransaction, ComputeBudgetProgram } = require('@solana/web3.js');
        const { getMintLen, createInitializeMintInstruction, createInitializeTransferFeeConfigInstruction, ExtensionType } = require('@solana/spl-token');

        const mintKeypair = Keypair.generate();
        const mint = mintKeypair.publicKey;

        const extensions = [ExtensionType.TransferFeeConfig];
        const mintLen = getMintLen(extensions);
        const rent = await connection.getMinimumBalanceForRentExemption(mintLen + 600); // Buffer for metadata

        const createTx = new Transaction().add(
            ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
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

        await sendAndConfirmTransaction(connection, createTx, [payer, mintKeypair]);
        console.log(`   -> Mint Created: ${mint.toBase58()}`);

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

        console.log("[3/5] Creating ATAs...");
        const payerAta = await createAssociatedTokenAccount(connection, payer, mint, payer.publicKey, { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);
        const devAta = await createAssociatedTokenAccount(connection, payer, mint, satoshiWallet, { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);

        console.log("[4/5] Minting 1B & Distributing 5%...");
        await mintTo(connection, payer, mint, payerAta, payer, BigInt(1000000000) * BigInt(10 ** 9), [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);
        await transfer(connection, payer, payerAta, devAta, payer, BigInt(50000000) * BigInt(10 ** 9), [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);

        console.log("[5/5] Hardening Autonomy...");
        await setAuthority(connection, payer, mint, payer, AuthorityType.MintTokens, null, [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);

        console.log(`\n=================================================`);
        console.log(`$NNG GENESIS SUCCESSFUL`);
        console.log(`MINT: ${mint.toBase58()}`);
        console.log(`=================================================\n`);

        require('fs').writeFileSync('NNG_GENESIS_SUCCESS.txt', mint.toBase58());
    } catch (e) {
        console.error(`GENESIS FAILED: ${e.message}`);
        process.exit(1);
    }
}

genesis();
