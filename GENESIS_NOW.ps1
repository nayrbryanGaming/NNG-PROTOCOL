# nayrbryanGaming ($NNG) - GENESIS AUTOMATION SCRIPT
# Status: SEMPURNA (Perfect)
# Goal: Deploy to Solana Devnet and verify on Explorer

Write-Host "--- nayrbryanGaming ($NNG) PROTOCOL GENESIS ---" -ForegroundColor Cyan

# 1. Verification
if (!(Get-Command spl-token -ErrorAction SilentlyContinue)) {
    Write-Host "[!] ERROR: Solana CLI (spl-token) not found in PATH." -ForegroundColor Red
    Write-Host "Please install Solana CLI: sh -c ""$(curl -sSfL https://release.solana.com/v1.18.4/install)"""
    exit
}

# 2. Configuration
$MINT_AUTHORITY = "35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr"
Write-Host "[*] Target Dev Wallet: $MINT_AUTHORITY" -ForegroundColor Yellow

# 3. Genesis Execution
Write-Host "[*] Step 1: Creating Token-2022 Mint..." -ForegroundColor Yellow
$MINT = spl-token create-token --program-id TokenzQdBNbLqP5VEhdkThT9PzZBm9GGr359Cr9 --transfer-fee 10 5000000000000 --enable-confidential-transfers auto --enable-metadata --permanent-delegate $MINT_AUTHORITY --default-account-state frozen | Select-String -Pattern "Address: ([a-zA-Z0-9]+)" | ForEach-Object { $_.Matches.Groups[1].Value }

if (!$MINT) {
    Write-Host "[!] FAILURE: Token creation failed. Check SOL balance or network." -ForegroundColor Red
    exit
}

Write-Host "[+] MINT ADDRESS: $MINT" -ForegroundColor Green

Write-Host "[*] Step 2: Initializing Metadata..." -ForegroundColor Yellow
spl-token initialize-metadata $MINT "nayrbryanGaming" "NNG" "https://nng-ecosystem.com/metadata.json"

Write-Host "[*] Step 3: Minting 1 Billion NNG..." -ForegroundColor Yellow
spl-token create-account $MINT
spl-token mint $MINT 1000000000

Write-Host "[*] Step 4: Transferring Dev Allocation..." -ForegroundColor Yellow
spl-token transfer $MINT 50000000 $MINT_AUTHORITY --fund-recipient

Write-Host "[*] Step 5: REVOKING AUTHORITIES (AUTONOMOUS MODE)..." -ForegroundColor Red
spl-token authorize $MINT permanent-delegate --disable
spl-token authorize $MINT mint --disable
spl-token authorize $MINT freeze --disable
spl-token authorize $MINT metadata-pointer --disable
spl-token unset-default-account-state $MINT

Write-Host "--- GENESIS COMPLETE ---" -ForegroundColor Green
Write-Host "View on Solscan: https://solscan.io/token/$($MINT)?cluster=devnet" -ForegroundColor Cyan

# Autoload explorer
Start-Process "https://solscan.io/token/$($MINT)?cluster=devnet"
