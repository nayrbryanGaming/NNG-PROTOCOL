const { execSync } = require('child_process');
const fs = require('fs');

fs.writeFileSync('my_config.yml', `json_rpc_url: "https://api.devnet.solana.com"
websocket_url: ""
keypair_path: "e:\\\\000VSCODE PROJECT MULAI DARI DESEMBER 2025\\\\nayrbryanGaming utility token NNG\\\\wallet.json"
address_labels: {}
commitment: "confirmed"
`);

function execCmd(cmd) {
    try {
        console.log(`Executing: ${cmd}`);
        return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    } catch (e) {
        console.error(`ERROR EXEC => ${e.message}`);
        if (e.stdout) console.error(`STDOUT => ${e.stdout.toString()}`);
        if (e.stderr) console.error(`STDERR => ${e.stderr.toString()}`);
        throw e;
    }
}

const SPL_TOKEN = '"C:\\Users\\arche\\solana-release\\solana-release\\bin\\spl-token.exe"';
const SOLANA = '"C:\\Users\\arche\\solana-release\\solana-release\\bin\\solana.exe"';

try {
    try {
        console.log("REQUESTING AIRDROP TO ENSURE FUNDS...");
        execCmd(`${SOLANA} airdrop 2 --config my_config.yml`);
    } catch (e) {
        console.log("Airdrop warning/limit reached, continuing...");
    }

    console.log("\\n>>> [1/6] CREATING NNG TOKEN (TOKEN-2022) WITH 0.1% TRANSFER FEE...");
    const createOutput = execCmd(`${SPL_TOKEN} create-token --program-id TokenzQdBNbLqP5VEhdkThT9PzZBm9GGr359Cr9 --decimals 9 --transfer-fee 10 5000 --config my_config.yml`);
    console.log(createOutput);

    // Extract Token Address
    const addrReq1 = createOutput.match(/Creating token\\s+([A-Za-z0-9]{32,44})/);
    const addrReq2 = createOutput.match(/Address:\\s*([A-Za-z0-9]{32,44})/);
    const tokenAddress = (addrReq1 && addrReq1[1]) || (addrReq2 && addrReq2[1]);

    if (!tokenAddress) {
        throw new Error("Could not parse Token Address from output!");
    }
    console.log(`\\n>>> EXTRACTED NNG TOKEN ADDRESS: ${tokenAddress} <<<\\n`);

    console.log("\\n>>> [2/6] INITIALIZING METADATA ON-CHAIN...");
    const metaOutput = execCmd(`${SPL_TOKEN} initialize-metadata ${tokenAddress} "nayrbryanGaming" "NNG" "https://nng-ecosystem.com/metadata.json" --config my_config.yml`);
    console.log(metaOutput);

    console.log("\\n>>> [3/6] MINTING MAXIMUM SUPPLY (1,000,000,000 NNG)...");
    const mintOutput = execCmd(`${SPL_TOKEN} mint ${tokenAddress} 1000000000 --config my_config.yml`);
    console.log(mintOutput);

    console.log("\\n>>> [4/6] TRANSFERRING 5% (50,000,000 NNG) DEV ALLOCATION TO SATOSHI WALLET...");
    const transferOutput = execCmd(`${SPL_TOKEN} transfer ${tokenAddress} 50000000 35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr --config my_config.yml`);
    console.log(transferOutput);

    console.log("\\n>>> [5/6] REVOKING MINT AUTHORITY (PERMANENT SECURE)...");
    const auth1 = execCmd(`${SPL_TOKEN} authorize ${tokenAddress} mint --disable --config my_config.yml`);
    console.log(auth1);

    console.log("\\n>>> [6/6] REVOKING FREEZE AUTHORITY (PERMANENT SECURE)...");
    const auth2 = execCmd(`${SPL_TOKEN} authorize ${tokenAddress} freeze --disable --config my_config.yml`);
    console.log(auth2);

    console.log("\\n========================================================");
    console.log("✅ SATOSHI 2.0 PROTOCOL ACTIVATED: $NNG");
    console.log("✅ THE TOKEN IS NOW IN AUTONOMOUS MODE. NO INFLATION. NO CENSORSHIP.");
    console.log(`✅ VERIFY ON EXPLORER: https://explorer.solana.com/address/${tokenAddress}?cluster=devnet`);
    console.log("========================================================\\n");

} catch (error) {
    console.error("\\n❌ DEPLOYMENT FAILED:", error.message);
    process.exit(1);
}
