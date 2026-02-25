const { Connection, PublicKey, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const { TOKEN_2022_PROGRAM_ID, getMintLen, ExtensionType, createInitializeMintInstruction, createInitializeTransferFeeConfigInstruction, getOrCreateAssociatedTokenAccount, mintTo, setAuthority, AuthorityType, createMintToInstruction, createSetAuthorityInstruction, createTransferInstruction } = require('@solana/spl-token');

async function run() {
    const rpcs = ['https://devnet-rpc.solayer.org', 'https://api.devnet.solana.com'];
    let connection;
    for (const url of rpcs) {
        try {
            connection = new Connection(url, 'confirmed');
            await connection.getSlot();
            console.log(`Using RPC: ${url}`);
            break;
        } catch (e) { }
    }
    const secretKey = Uint8Array.from([87, 68, 219, 149, 118, 168, 203, 106, 197, 62, 228, 150, 218, 79, 95, 78, 6, 39, 148, 196, 64, 34, 209, 131, 33, 151, 241, 241, 219, 120, 105, 50, 172, 173, 120, 219, 141, 89, 194, 47, 74, 113, 128, 124, 204, 79, 114, 40, 129, 225, 235, 169, 155, 229, 51, 19, 225, 237, 137, 210, 179, 252, 243, 51]);
    const payer = Keypair.fromSecretKey(secretKey);
    const satoshiWallet = new PublicKey('35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr');

    console.log(`Payer: ${payer.publicKey.toBase58()}`);

    const bal = await connection.getBalance(payer.publicKey);
    console.log(`Balance: ${bal / 1e9} SOL`);

    if (bal < 0.1 * 1e9) {
        console.log("Low balance. Attempting emergency airdrop...");
        try {
            const sig = await connection.requestAirdrop(payer.publicKey, 1e9);
            await connection.confirmTransaction(sig);
            console.log("Airdrop success.");
        } catch (e) {
            console.log("Airdrop failed. Trying alternate RPC...");
        }
    }

    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;
    const extensions = [ExtensionType.TransferFeeConfig];
    const mintLen = getMintLen(extensions);
    const rent = await connection.getMinimumBalanceForRentExemption(mintLen);

    console.log(`[1] Creating Mint: ${mint.toBase58()}`);
    const tx1 = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint,
            space: mintLen,
            lamports: rent,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeTransferFeeConfigInstruction(mint, payer.publicKey, payer.publicKey, 10, BigInt(5000 * 10 ** 9), TOKEN_2022_PROGRAM_ID),
        createInitializeMintInstruction(mint, 9, payer.publicKey, null, TOKEN_2022_PROGRAM_ID)
    );
    await sendAndConfirmTransaction(connection, tx1, [payer, mintKeypair]);
    console.log("   -> Step 1: Mint Account Live.");

    const ata = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey, false, 'confirmed', undefined, TOKEN_2022_PROGRAM_ID);
    await mintTo(connection, payer, mint, ata.address, payer, BigInt(1000000000) * BigInt(10 ** 9), [], { commitment: 'confirmed' }, TOKEN_2022_PROGRAM_ID);
    console.log("   -> Step 2: 1B Supply Minted.");

    const devAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, satoshiWallet, false, 'confirmed', undefined, TOKEN_2022_PROGRAM_ID);
    const tx3 = new Transaction().add(
        createTransferInstruction(ata.address, devAta.address, payer.publicKey, BigInt(50000000) * BigInt(10 ** 9), [], TOKEN_2022_PROGRAM_ID),
        createSetAuthorityInstruction(mint, payer.publicKey, AuthorityType.MintTokens, null, [], TOKEN_2022_PROGRAM_ID)
    );
    await sendAndConfirmTransaction(connection, tx3, [payer]);
    console.log("   -> Step 3: Sovereign State Established.");

    console.log("\n--- SEMPURNA GENESIS COMPLETE ---");
    console.log(`MINT ADDRESS: ${mint.toBase58()}`);
    require('fs').writeFileSync('FINAL_SUCCESS_MINT.txt', mint.toBase58());
}

run().catch(console.error);
