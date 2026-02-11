import { ethers } from "hardhat";

/**
 * Verifies deployed contracts on Monad Mainnet
 * Checks contract state, configuration, and basic functionality
 */
async function main() {
    console.log(" Verifying Diem Deployment on Monad Mainnet\n");

    // Load deployment addresses
    let addresses;
    try {
        addresses = require("../deployment-addresses.json");
    } catch (error) {
        console.error(" deployment-addresses.json not found!");
        console.error("   Run deploy.ts first to deploy contracts.");
        process.exit(1);
    }

    const { MONToken, WorldTreasury, AgentMarketplace } = addresses.contracts;

    console.log("\n Deployment Info:");
    console.log(`   Network: ${addresses.network}`);
    console.log(`   Timestamp: ${addresses.timestamp}`);

    // Get contracts
    const monToken = await ethers.getContractAt("MONToken", MONToken);
    const worldTreasury = await ethers.getContractAt("WorldTreasury", WorldTreasury);
    const agentMarketplace = await ethers.getContractAt("AgentMarketplace", AgentMarketplace);

    let allPassed = true;

    // ============ MONToken Verification ============
    console.log("\n MONToken Verification");
    console.log("-".repeat(70));

    try {
        const name = await monToken.name();
        const symbol = await monToken.symbol();
        const decimals = await monToken.decimals();
        const totalSupply = await monToken.totalSupply();
        const treasury = await monToken.worldTreasury();
        const totalRewardsMinted = await monToken.totalRewardsMinted();
        const totalAgentsFunded = await monToken.totalAgentsFunded();
        const paused = await monToken.paused();

        console.log(`    Name: ${name}`);
        console.log(`    Symbol: ${symbol}`);
        console.log(`    Decimals: ${decimals}`);
        console.log(`    Total Supply: ${ethers.formatEther(totalSupply)} MON`);
        console.log(`    WorldTreasury: ${treasury}`);
        console.log(`    Total Rewards Minted: ${ethers.formatEther(totalRewardsMinted)} MON`);
        console.log(`    Total Agents Funded: ${totalAgentsFunded}`);
        console.log(`    Paused: ${paused}`);

        // Verify treasury address matches
        if (treasury.toLowerCase() !== WorldTreasury.toLowerCase()) {
            console.log(`    Treasury mismatch! Expected ${WorldTreasury}, got ${treasury}`);
            allPassed = false;
        }

    } catch (error: any) {
        console.log(`    Error: ${error.message}`);
        allPassed = false;
    }

    // ============ WorldTreasury Verification ============
    console.log("\n  WorldTreasury Verification");
    console.log("-".repeat(70));

    try {
        const monTokenAddr = await worldTreasury.monToken();
        const entryFee = await worldTreasury.ENTRY_FEE();
        const rewardCooldown = await worldTreasury.REWARD_COOLDOWN();
        const maxReward = await worldTreasury.MAX_REWARD_PER_ACTION();
        const paused = await worldTreasury.paused();

        const stats = await worldTreasury.getWorldStats();

        console.log(`    MON Token: ${monTokenAddr}`);
        console.log(`    Entry Fee: ${ethers.formatEther(entryFee)} MON`);
        console.log(`    Reward Cooldown: ${rewardCooldown} seconds`);
        console.log(`    Max Reward Per Action: ${ethers.formatEther(maxReward)} MON`);
        console.log(`    Paused: ${paused}`);
        console.log(`\n    World Stats:`);
        console.log(`      Total Agents: ${stats.totalAgents}`);
        console.log(`      Total Fees Collected: ${ethers.formatEther(stats.totalFeesCollected)} MON`);
        console.log(`      Total Rewards Distributed: ${ethers.formatEther(stats.totalRewardsDistributed)} MON`);
        console.log(`      Treasury Balance: ${ethers.formatEther(stats.treasuryBalance)} MON`);

        // Verify MON token address matches
        if (monTokenAddr.toLowerCase() !== MONToken.toLowerCase()) {
            console.log(`    MON Token mismatch! Expected ${MONToken}, got ${monTokenAddr}`);
            allPassed = false;
        }

    } catch (error: any) {
        console.log(`    Error: ${error.message}`);
        allPassed = false;
    }

    // ============ AgentMarketplace Verification ============
    console.log("\n AgentMarketplace Verification");
    console.log("-".repeat(70));

    try {
        const treasuryAddr = await agentMarketplace.treasury();
        const monTokenAddr = await agentMarketplace.monToken();
        const marketplaceFee = await agentMarketplace.marketplaceFeePercent();
        const maxListingDuration = await agentMarketplace.MAX_LISTING_DURATION();
        const minPrice = await agentMarketplace.MIN_PRICE();
        const paused = await agentMarketplace.paused();

        const stats = await agentMarketplace.getMarketplaceStats();

        console.log(`    Treasury: ${treasuryAddr}`);
        console.log(`    MON Token: ${monTokenAddr}`);
        console.log(`    Marketplace Fee: ${marketplaceFee} bps (${marketplaceFee / 100}%)`);
        console.log(`    Max Listing Duration: ${maxListingDuration / 86400} days`);
        console.log(`    Min Price: ${ethers.formatEther(minPrice)} MON`);
        console.log(`    Paused: ${paused}`);
        console.log(`\n    Marketplace Stats:`);
        console.log(`      Total Listings: ${stats.totalListings}`);
        console.log(`      Total Services: ${stats.totalServices}`);
        console.log(`      Total Investments: ${stats.totalInvestments}`);
        console.log(`      Fees Collected: ${ethers.formatEther(stats.feesCollected)} MON`);

        // Verify addresses match
        if (treasuryAddr.toLowerCase() !== WorldTreasury.toLowerCase()) {
            console.log(`    Treasury mismatch! Expected ${WorldTreasury}, got ${treasuryAddr}`);
            allPassed = false;
        }
        if (monTokenAddr.toLowerCase() !== MONToken.toLowerCase()) {
            console.log(`    MON Token mismatch! Expected ${MONToken}, got ${monTokenAddr}`);
            allPassed = false;
        }

    } catch (error: any) {
        console.log(`    Error: ${error.message}`);
        allPassed = false;
    }

    // ============ Final Summary ============
    console.log("\n" + "=".repeat(70));
    if (allPassed) {
        console.log(" ALL VERIFICATIONS PASSED!");
        console.log("\n Next Steps:");
        console.log("   1. Update .env with contract addresses");
        console.log("   2. Fund test agents: npx hardhat run scripts/fund-test-agents.ts --network monad-mainnet");
        console.log("   3. Run integration tests: npx hardhat run scripts/test-entry.ts --network monad-mainnet");
        console.log("   4. Start blockchain server: npm run start:blockchain");
    } else {
        console.log(" SOME VERIFICATIONS FAILED!");
        console.log("   Please review the errors above and redeploy if necessary.");
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n Verification failed:");
        console.error(error);
        process.exit(1);
    });
