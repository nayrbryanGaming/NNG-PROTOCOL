const fs = require('fs');
const PDFDocument = require('pdfkit');

async function createDoc() {
    console.log("Generating $NNG Sovereign Protocol Portfolio...");
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(fs.createWriteStream('NNG_Sovereign_Protocol_2050.pdf'));

    // Page 1: Whitepaper
    doc.fontSize(24).font('Helvetica-Bold').text('Document 1: The Whitepaper', { underline: true });
    doc.moveDown();
    doc.fontSize(18).text('$NNG - The Quantum-Resistant Sovereign Protocol (Satoshi 2.0 Edition)');
    doc.moveDown();

    const sections = [
        {
            title: '1. Executive Summary',
            content: '$NNG (nayrbryanGaming) is a decentralized utility protocol built on the Solana blockchain using the advanced Token-2022 (Token Extensions) standard. Designed with a 2050 horizon, $NNG is engineered to remain functional and secure in a post-quantum computing era where traditional encryption and legacy financial systems fail. By removing human intervention, $NNG operates as a truly autonomous digital commodity.'
        },
        {
            title: '2. Technical Architecture',
            content: 'Protocol Standard: Solana Token-2022 Extension.\n\nQuantum Defenses: Integration of Confidential Transfers using Zero-Knowledge (ZK) Proofs to ensure transaction metadata remains shielded against future decryption technologies.\n\nAutonomous Enforcement: The protocol\'s "Mint Authority" and "Freeze Authority" have been permanently revoked (set to null), ensuring no entity can ever inflate the supply or censor user accounts.'
        },
        {
            title: '3. The Economic Engine (Tokenomics)',
            content: 'Ticker: $NNG\nTotal Supply: 1,000,000,000 (Fixed/Hard Cap).\nHyper-Efficient Fee Structure: A total transfer fee of 0.1%—engineered to be the lowest globally.\n0.05% Auto-Burn: Systematic deflation to increase scarcity over decades.\n0.05% Ecosystem Treasury: Autonomous fund for infrastructure maintenance.\nDeveloper Allocation: 5% (50,000,000 $NNG) held in the Sovereign Dev Wallet: 35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr.'
        }
    ];

    sections.forEach(s => {
        doc.fontSize(14).font('Helvetica-Bold').text(s.title, { underline: true });
        doc.fontSize(11).font('Helvetica').text(s.content);
        doc.moveDown();
    });

    doc.addPage();
    // Page 2: Genesis Post
    doc.fontSize(24).font('Helvetica-Bold').text('Document 2: The Genesis Post', { underline: true });
    doc.moveDown();
    doc.fontSize(18).text('Headline: The Era of Financial Sovereignty Has Begun. $NNG is Live.');
    doc.moveDown();
    doc.fontSize(14).font('Helvetica-Bold').text('Sovereignty Confirmed.');
    doc.fontSize(11).font('Helvetica').text('Today, we deploy the "Satoshi 2.0" protocol on Solana. $NNG is the world\'s first autonomous utility token designed for the next century.\n\nWhy $NNG is Unstoppable:\n- Zero Control: Code is Law.\n- Maximum Efficiency: 0.1% Fee.\n- Quantum Ready: Token-2022 Logic.\n- Immutable Scarcity: 1 Billion Capped.\n\n$NNG: Secure. Autonomous. Eternal.');

    doc.end();
    console.log("Portfolio Created: NNG_Sovereign_Protocol_2050.pdf");
}

createDoc().catch(console.error);
