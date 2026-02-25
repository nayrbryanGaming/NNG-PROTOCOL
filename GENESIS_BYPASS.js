const https = require('https');
const {
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
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
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    createMintToCheckedInstruction,
    createTransferCheckedInstruction,
    createSetAuthorityInstruction,
    AuthorityType,
} = require('@solana/spl-token');

// PARAMETERS
const DECIMALS = 9;
const FEE_BPS = 10;
const MAX_FEE = BigInt(5000) * BigInt(10 ** 9);
const TOTAL_SUPPLY = BigInt(1000000000) * BigInt(10 ** 9);
const DEV_ALLOCATION = BigInt(50000000) * BigInt(10 ** 9);
const SATOSHI_WALLET = new PublicKey("35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr");

async function sendRpc(method, params) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
        const options = {
            hostname: 'devnet-rpc.solayer.org',
            port: 443,
            path: '/',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function run() {
    console.log("--- NNG BYPASS GENESIS START ---");
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const secretKey = Uint8Array.from([87, 68, 219, 149, 118, 168, 203, 106, 197, 62, 228, 150, 218, 79, 95, 78, 6, 39, 148, 196, 64, 34, 209, 131, 33, 151, 241, 241, 219, 120, 105, 50, 172, 173, 120, 219, 141, 89, 194, 47, 74, 113, 128, 124, 204, 79, 114, 40, 129, 225, 235, 169, 155, 229, 51, 19, 225, 237, 137, 210, 179, 252, 243, 51]);
    const payer = Keypair.fromSecretKey(secretKey);
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    const extensions = [ExtensionType.TransferFeeConfig, ExtensionType.MetadataPointer];
    const mintLen = getMintLen(extensions) + 512;
    const rent = await connection.getMinimumBalanceForRentExemption(mintLen);

    console.log(`[1] Mint: ${mint.toBase58()}`);

    const tx1 = new Transaction();
    tx1.add(
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

    const bh1 = await connection.getLatestBlockhash();
    tx1.recentBlockhash = bh1.blockhash;
    tx1.feePayer = payer.publicKey;
    tx1.sign(payer, mintKeypair);

    console.log("Broadcasting Phase 1...");
    const rawTx1 = tx1.serialize().toString('base64');
    const res1 = await sendRpc('sendTransaction', [rawTx1]);

    if (res1.error) {
        console.error("RPC Error:", res1.error);
        process.exit(1);
    }
    console.log("Sig:", res1.result);

    // Phase 2: ATA and Mint
    const payerAta = getAssociatedTokenAddressSync(mint, payer.publicKey, false, TOKEN_2022_PROGRAM_ID);
    const devAta = getAssociatedTokenAddressSync(mint, SATOSHI_WALLET, false, TOKEN_2022_PROGRAM_ID);

    const tx2 = new Transaction();
    tx2.add(
        createAssociatedTokenAccountInstruction(payer.publicKey, payerAta, payer.publicKey, mint, TOKEN_2022_PROGRAM_ID),
        createAssociatedTokenAccountInstruction(payer.publicKey, devAta, SATOSHI_WALLET, mint, TOKEN_2022_PROGRAM_ID),
        createMintToCheckedInstruction(mint, payerAta, payer.publicKey, TOTAL_SUPPLY, 9, [], TOKEN_2022_PROGRAM_ID),
        createTransferCheckedInstruction(payerAta, mint, devAta, payer.publicKey, DEV_ALLOCATION, 9, [], TOKEN_2022_PROGRAM_ID),
        createSetAuthorityInstruction(mint, payer.publicKey, AuthorityType.MintTokens, null, [], TOKEN_2022_PROGRAM_ID),
        createSetAuthorityInstruction(mint, payer.publicKey, AuthorityType.FreezeAccount, null, [], TOKEN_2022_PROGRAM_ID),
        createSetAuthorityInstruction(mint, payer.publicKey, AuthorityType.MetadataPointer, null, [], TOKEN_2022_PROGRAM_ID)
    );

    // Wait a bit for block propagation
    await new Promise(r => setTimeout(r, 5000));

    const bh2 = await connection.getLatestBlockhash();
    tx2.recentBlockhash = bh2.blockhash;
    tx2.feePayer = payer.publicKey;
    tx2.sign(payer);

    console.log("Broadcasting Phase 2...");
    const rawTx2 = tx2.serialize().toString('base64');
    const res2 = await sendRpc('sendTransaction', [rawTx2]);
    console.log("Sig:", res2.result);

    console.log("--- GENESIS COMPLETE ---");
    console.log(`MINT: ${mint.toBase58()}`);
    require('fs').writeFileSync('SOVEREIGN_MINT_FINAL.txt', mint.toBase58());
}

run().catch(e => console.error(e));
