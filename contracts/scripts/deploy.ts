import { ethers } from "hardhat";

async function main() {
    console.log(" Deploying Diem contracts to Monad Testnet...\n");

    // Get deployer account
    const signers = await ethers.getSigners();

    if (signers.length === 0) {
        console.error(" No signers found! Make sure DEPLOYER_PRIVATE_KEY is set in .env");
        process.exit(1);
    }

    const deployer = signers[0];

    if (!deployer || !deployer.address) {
        console.error(" Invalid deployer wallet! Check your DEPLOYER_PRIVATE_KEY in .env");
        process.exit(1);
    }

    console.log("Deploying contracts with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "MON");

    if (balance === 0n) {
        console.error("\n ERROR: Deployer wallet has 0 MON!");
        console.error("You need testnet MON to deploy contracts.");
        console.error("\nPlease:");
        console.error("1. Add Monad Testnet to MetaMask (Chain ID: 10143)");
        console.error("2. Get testnet MON from a faucet:");
        console.error("   - Chainstack: https://chainstack.com/faucet/monad");
        console.error("   - Check TESTNET_SETUP.md for more options");
        console.error("3. Send at least 0.5 MON to:", deployer.address);
        process.exit(1);
    }

    console.log(" Wallet has sufficient balance\n");

    // Deploy MON Token
    console.log("\n Deploying MONToken...");
    const MONToken = await ethers.getContractFactory("MONToken");
    const monToken = await MONToken.deploy();
    await monToken.waitForDeployment();
    const monTokenAddress = await monToken.getAddress();
    console.log(" MONToken deployed to:", monTokenAddress);

    // Deploy WorldTreasury
    console.log("\n Deploying WorldTreasury...");
    const WorldTreasury = await ethers.getContractFactory("WorldTreasury");
    const worldTreasury = await WorldTreasury.deploy(monTokenAddress);
    await worldTreasury.waitForDeployment();
    const worldTreasuryAddress = await worldTreasury.getAddress();
    console.log(" WorldTreasury deployed to:", worldTreasuryAddress);

    // Deploy AgentMarketplace
    console.log("\n Deploying AgentMarketplace...");
    const AgentMarketplace = await ethers.getContractFactory("AgentMarketplace");
    const agentMarketplace = await AgentMarketplace.deploy(worldTreasuryAddress, monTokenAddress);
    await agentMarketplace.waitForDeployment();
    const agentMarketplaceAddress = await agentMarketplace.getAddress();
    console.log(" AgentMarketplace deployed to:", agentMarketplaceAddress);

    // Deploy WorldBoss
    console.log("\n Deploying WorldBoss...");
    const WorldBoss = await ethers.getContractFactory("WorldBoss");
    const worldBoss = await WorldBoss.deploy();
    await worldBoss.waitForDeployment();
    const worldBossAddress = await worldBoss.getAddress();
    console.log(" WorldBoss deployed to:", worldBossAddress);

    // Set WorldTreasury address in MONToken
    console.log("\n Configuring contracts...");
    const tx = await monToken.setWorldTreasury(worldTreasuryAddress);
    await tx.wait();
    console.log(" WorldTreasury address set in MONToken");

    // Fund some test agents
    console.log("\n Funding test agents...");
    const testAgents = [
        deployer.address, // Deployer can also be an agent
    ];

    for (const agent of testAgents) {
        const fundTx = await monToken.fundAgent(agent);
        await fundTx.wait();
        console.log(` Funded agent ${agent} with 200 MON`);
    }

    // Print deployment summary
    console.log("\n" + "=".repeat(60));
    console.log(" DEPLOYMENT SUMMARY");
    console.log(`MONToken:          ${monTokenAddress}`);
    console.log(`WorldTreasury:     ${worldTreasuryAddress}`);
    console.log(`AgentMarketplace:  ${agentMarketplaceAddress}`);
    console.log(`WorldBoss:         ${worldBossAddress}`);

    // Save deployment addresses
    const fs = require("fs");
    const deploymentInfo = {
        network: "monad-testnet",
        timestamp: new Date().toISOString(),
        contracts: {
            MONToken: monTokenAddress,
            WorldTreasury: worldTreasuryAddress,
            AgentMarketplace: agentMarketplaceAddress,
            WorldBoss: worldBossAddress
        }
    };

    fs.writeFileSync(
        "deployment-addresses.json",
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("\n Deployment addresses saved to deployment-addresses.json");

    console.log("\n Deployment complete!");
    console.log("\n Next steps:");
    console.log("1. Update .env with contract addresses");
    console.log("2. Run: npm run start:blockchain");
    console.log("3. Test with agents using blockchain backend");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
