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

    // Test agent addresses (from .env)
    const testAgentKey = process.env.AGENT1_PRIVATE_KEY;
    if (!testAgentKey) {
        console.error(" AGENT1_PRIVATE_KEY not found in .env");
        process.exit(1);
    }
    const testAgentWallet = new ethers.Wallet(testAgentKey, ethers.provider);
    const testAgents = [testAgentWallet.address];

    console.log(`Funding test agent: ${testAgents[0]}...\n`);

    for (let i = 0; i < testAgents.length; i++) {
        const agent = testAgents[i];

        try {
            // 1. Send native MON for gas (Minimal amount for mainnet safety)
            const gasAmount = "0.05";
            console.log(`   [1] Sending ${gasAmount} MON (gas)...`);

            const currentBalance = await ethers.provider.getBalance(agent);
            if (currentBalance < ethers.parseEther(gasAmount)) {
                const gasTx = await deployer.sendTransaction({
                    to: agent,
                    value: ethers.parseEther(gasAmount)
                });
                await gasTx.wait();
                console.log(`    Gas sent (tx: ${gasTx.hash.slice(0, 10)}...)`);
            } else {
                console.log(`    Agent already has sufficient gas (${ethers.formatEther(currentBalance)} MON)`);
            }

            // 2. Fund with MON tokens
            console.log(`   2⃣  Funding with 200 MON tokens...`);
            const tokenBalance = await monToken.balanceOf(agent);
            if (tokenBalance < ethers.parseEther("200")) {
                const fundTx = await monToken.fundAgent(agent);
                await fundTx.wait();
                console.log(`    Tokens sent (tx: ${fundTx.hash.slice(0, 10)}...)`);
            } else {
                console.log(`    Agent already has sufficient tokens (${ethers.formatEther(tokenBalance)} MON)`);
            }

            // 3. Verify balances
            const finalNative = await ethers.provider.getBalance(agent);
            const finalToken = await monToken.balanceOf(agent);
            console.log(`    Native MON: ${ethers.formatEther(finalNative)}`);
            console.log(`    MON Tokens: ${ethers.formatEther(finalToken)}`);
            console.log();

        } catch (error: any) {
            console.log(`    Error funding agent: ${error.message}\n`);
        }
    }

    console.log(" Test agent funded successfully!");
    console.log("\n Next Steps:");
    console.log("   1. Run entry test: npx hardhat run scripts/test-entry.ts --network monad-mainnet");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n Funding failed:");
        console.error(error);
        process.exit(1);
    });
