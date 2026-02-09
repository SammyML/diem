import { ethers } from "hardhat";

/**
 * Funds test agents with native MON (for gas) and MON tokens (for gameplay)
 */
async function main() {
    console.log(" Funding Test Agents on Monad Testnet\n");

    // Load deployment addresses
    const addresses = require("../deployment-addresses.json");
    const monToken = await ethers.getContractAt("MONToken", addresses.contracts.MONToken);

    // Get deployer
    const deployer = (await ethers.getSigners())[0];
    console.log(`Deployer: ${deployer.address}`);

    const deployerBalance = await ethers.provider.getBalance(deployer.address);
    console.log(`Deployer Balance: ${ethers.formatEther(deployerBalance)} MON\n`);

    if (deployerBalance < ethers.parseEther("2")) {
        console.error(" Deployer has insufficient balance!");
        console.error("   Need at least 2 MON to fund test agents.");
        process.exit(1);
    }

    // Test agent addresses (you can customize these)
    const testAgents = [
        // Add your test agent addresses here
        // Example: "0x1234567890123456789012345678901234567890",
    ];

    // If no agents specified, create some
    if (testAgents.length === 0) {
        console.log(" No test agents specified. Generating 3 test wallets...\n");

        for (let i = 1; i <= 3; i++) {
            const wallet = ethers.Wallet.createRandom();
            testAgents.push(wallet.address);
            console.log(`Agent ${i}:`);
            console.log(`   Address: ${wallet.address}`);
            console.log(`   Private Key: ${wallet.privateKey}`);
            console.log(`     SAVE THIS PRIVATE KEY SECURELY!\n`);
        }

        console.log(" Add these addresses to .env.testnet for future use\n");
    }

    console.log(`Funding ${testAgents.length} test agents...\n`);

    for (let i = 0; i < testAgents.length; i++) {
        const agent = testAgents[i];
        console.log(`Agent ${i + 1}: ${agent}`);

        try {
            // 1. Send native MON for gas
            console.log(`   1⃣  Sending 0.5 MON (gas)...`);
            const gasTx = await deployer.sendTransaction({
                to: agent,
                value: ethers.parseEther("0.5")
            });
            await gasTx.wait();
            console.log(`    Gas sent (tx: ${gasTx.hash.slice(0, 10)}...)`);

            // 2. Fund with MON tokens
            console.log(`   2⃣  Funding with 200 MON tokens...`);
            const fundTx = await monToken.fundAgent(agent);
            const fundReceipt = await fundTx.wait();
            console.log(`    Tokens sent (tx: ${fundTx.hash.slice(0, 10)}...)`);
            console.log(`    Gas used: ${fundReceipt.gasUsed}`);

            // 3. Verify balances
            const nativeBalance = await ethers.provider.getBalance(agent);
            const tokenBalance = await monToken.balanceOf(agent);
            console.log(`    Native MON: ${ethers.formatEther(nativeBalance)}`);
            console.log(`    MON Tokens: ${ethers.formatEther(tokenBalance)}`);
            console.log();

        } catch (error: any) {
            console.log(`    Error funding agent: ${error.message}\n`);
        }
    }

    console.log(" Test agents funded successfully!");
    console.log("\n Next Steps:");
    console.log("   1. Import agent private keys into MetaMask");
    console.log("   2. Add MON token to MetaMask (address: " + addresses.contracts.MONToken + ")");
    console.log("   3. Run entry test: npx hardhat run scripts/test-entry.ts --network monad-testnet");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n Funding failed:");
        console.error(error);
        process.exit(1);
    });
