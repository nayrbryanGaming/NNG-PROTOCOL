const { execSync } = require('child_process');
const fs = require('fs');

const CLI_PATH = '"C:\\Users\\arche\\solana-release\\solana-release\\bin\\spl-token.exe"';
const WALLET_PATH = 'wallet.json';
const PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkThT9PzZBm9GGr359Cr9';
const RPC_URL = 'https://devnet-rpc.solayer.org';

function run() {
    console.log("--- nayrbryanGaming ($NNG) PROTOCOL GENESIS: CLI BRIDGE ---");

    try {
        console.log("[1/4] Creating Token-2022 with 0.1% Transfer Fee...");
        const createCmd = `${CLI_PATH} create-token --program-id ${PROGRAM_ID} --transfer-fee 10 5000 --url ${RPC_URL} --keypair ${WALLET_PATH}`;
        const createOut = execSync(createCmd).toString();
        const mintMatch = createOut.match(/Creating token (\w+)/);
        if (!mintMatch) throw new Error(`Mint not found in output: ${createOut}`);
        const mint = mintMatch[1];
        console.log(`   -> MINT: ${mint}`);

        console.log("[2/4] Initializing Metadata...");
        const metaCmd = `${CLI_PATH} initialize-metadata ${mint} "nayrbryanGaming" "NNG" "https://nng-ecosystem.com/metadata.json" --url ${RPC_URL} --keypair ${WALLET_PATH}`;
        execSync(metaCmd);
        console.log("   -> Metadata OK.");

        console.log("[3/4] Creating Account & Minting 1B Supply...");
        const accountCmd = `${CLI_PATH} create-account ${mint} --url ${RPC_URL} --keypair ${WALLET_PATH}`;
        execSync(accountCmd);
        const mintCmd = `${CLI_PATH} mint ${mint} 1000000000 --url ${RPC_URL} --keypair ${WALLET_PATH}`;
        execSync(mintCmd);
        console.log("   -> Minted 1B.");

        console.log("[4/4] Distributing 5% & Revoking Authorities...");
        const distCmd = `${CLI_PATH} transfer ${mint} 50000000 35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr --url ${RPC_URL} --keypair ${WALLET_PATH} --fund-recipient`;
        execSync(distCmd);
        const revokeMint = `${CLI_PATH} authorize ${mint} mint --disable --url ${RPC_URL} --keypair ${WALLET_PATH}`;
        execSync(revokeMint);
        const revokeFreeze = `${CLI_PATH} authorize ${mint} freeze --disable --url ${RPC_URL} --keypair ${WALLET_PATH}`;
        execSync(revokeFreeze);

        console.log(`\n=================================================`);
        console.log(`$NNG GENESIS SUCCESSFUL (BRIDGE MODE)`);
        console.log(`MINT: ${mint}`);
        console.log(`SOLSCAN: https://solscan.io/token/${mint}?cluster=devnet`);
        console.log(`=================================================\n`);

        fs.writeFileSync('NNG_GENESIS_REPORT.txt', `Mint: ${mint}\nStatus: Sovereign\nSatoshi 2.0 Mode: Active`);
    } catch (e) {
        console.error(`BRIDGE FAILURE: ${e.message}`);
        if (e.stdout) console.error(e.stdout.toString());
        if (e.stderr) console.error(e.stderr.toString());
        process.exit(1);
    }
}

run();
