# Hardened CLI Deployment Guide: nayrbryanGaming ($NNG)
**Protocol Version:** 1.0.0 (Satoshi 2.0 / Autonomous Genesis)
**Network:** Solana Devnet
**Engineering Target:** 100% Technical Accuracy / 0% Discretionary Control

---

## 1. Environment Setup
Ensure your environment is configured for the Token-2022 program and Devnet.

```bash
solana config set --url devnet
# Verify Solana CLI version (Token-2022 requires 1.18+)
solana --version
```
3. **Wallet with SOL:** `solana airdrop 2` (Repeat if necessary)
4. **Target Dev Wallet:** `35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr`

---

## Deployment Steps

### A. Create the Token Mint
We initialize the mint with **Transfer Fee**, **Confidential Transfers**, **Metadata**, **Permanent Delegate**, and **Default Account State** (Frozen) enabled.

```bash
# Basis Points: 10 (0.1%)
# Max Fee: 5,000,000,000,000 (5,000 NNG in raw units)
spl-token create-token \
  --program-id TokenzQdBNbLqP5VEhdkThT9PzZBm9GGr359Cr9 \
  --transfer-fee 10 5000000000000 \
  --enable-confidential-transfers auto \
  --enable-metadata \
  --permanent-delegate 35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr \
  --default-account-state frozen
```
> [!NOTE]
> - `5000000000000` = 5,000 NNG (9 decimals).
> - `--enable-confidential-transfers auto` enables ZK-proof metadata shielding for all users permissionlessly.

### 2. Initialize Metadata
Replace `<MINT_ADDRESS>` with the address output from the previous step.
```bash
spl-token initialize-metadata <MINT_ADDRESS> \
  "nayrbryanGaming" "NNG" "https://nng-ecosystem.com/metadata.json"
```

### 3. Initialize Confidential Transfer Mint
Initialize the cryptographic state for ZK-proofs.
```bash
spl-token initialize-confidential-transfer-mint <MINT_ADDRESS>
```

### 4. Create Token Account & Mint Supply
```bash
# Create your local associated token account
spl-token create-account <MINT_ADDRESS>

# Mint the fixed total supply (1,000,000,000)
spl-token mint <MINT_ADDRESS> 1000000000
```

### 4. Distribute Dev Allocation (Satoshi Wallet 2.0)
```bash
spl-token transfer <MINT_ADDRESS> 50000000 \
  35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr \
  --fund-recipient
```

### 6. Achieving Absolute Autonomy (IRREVERSIBLE)
This sequence removes all administrative backdoors. Once executed, the protocol is governed only by its code.

```bash
# A. Revoke Permanent Delegate
spl-token authorize <MINT_ADDRESS> permanent-delegate --disable

# B. Unset Default Account State (Enable public transfers)
spl-token unset-default-account-state <MINT_ADDRESS>

# C. Revoke Metadata Pointer (Make metadata immutable)
spl-token authorize <MINT_ADDRESS> metadata-pointer --disable

# D. Revoke Mint Authority (Fixed supply of 1B)
spl-token authorize <MINT_ADDRESS> mint --disable

# E. Revoke Freeze Authority (Censorship resistance)
spl-token authorize <MINT_ADDRESS> freeze --disable
```

---

## Post-Deployment Verification

Check the token state to confirm authorities are `None`:
```bash
spl-token display <MINT_ADDRESS>
```

Verify Metadata:
```bash
spl-token account-info --address <MINT_ADDRESS>
```

**Protocol Successfully Autonomous.**
