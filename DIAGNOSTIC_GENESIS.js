const { Connection, PublicKey, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction, ComputeBudgetProgram } = require('@solana/web3.js');
const {
    TOKEN_2022_PROGRAM_ID,
    getMintLen,
    createInitializeMintInstruction,
    createInitializeTransferFeeConfigInstruction,
    ExtensionType
} = require('@solana/spl-token');

async function run() {
    const connection = new Connection('https://devnet-rpc.solayer.org', 'confirmed');
    const secretKey = Uint8Array.from([87, 68, 219, 149, 118, 168, 203, 106, 197, 62, 228, 150, 218, 79, 95, 78, 6, 39, 148, 196, 64, 34, 209, 131, 33, 151, 241, 241, 219, 120, 105, 50, 172, 173, 120, 219, 141, 89, 194, 47, 74, 113, 128, 124, 204, 79, 114, 40, 129, 225, 235, 169, 155, 229, 51, 19, 225, 237, 137, 210, 179, 252, 243, 51]);
    const payer = Keypair.fromSecretKey(secretKey);
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    const extensions = [ExtensionType.TransferFeeConfig];
    const mintLen = getMintLen(extensions);
    // Use a very generous rent to avoid InvalidAccountData from low balance
    const rent = 20000000; // 0.02 SOL

    const tx = new Transaction().add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
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

    try {
        await sendAndConfirmTransaction(connection, tx, [payer, mintKeypair], { skipPreflight: false });
        console.log(`MINT_SUCCESS: ${mint.toBase58()}`);
    } catch (e) {
        console.log("--- ERROR ---");
        console.log(e.message);
        if (e.logs) e.logs.forEach(l => console.log(l));
        process.exit(1);
    }
}

run();
