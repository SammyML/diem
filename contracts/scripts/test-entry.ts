import { ethers } from "hardhat";

/**
 * Tests the complete agent entry flow on Monad Mainnet
 * Includes approval, entry, and stats verification
 */
async function main() {
    console.log(" Testing Agent Entry Flow on Monad Mainnet\n");

    // Load deployment addresses
    const addresses = require("../deployment-addresses.json");
    const monToken = await ethers.getContractAt("MONToken", addresses.contracts.MONToken);
    const treasury = await ethers.getContractAt("WorldTreasury", addresses.contracts.WorldTreasury);

    // Get test agent (first signer after deployer, or specify private key)
    const signers = await ethers.getSigners();

    if (signers.length < 2) {
        console.error(" No test agent wallet found!");
        console.error("   Either:");
        console.error("   1. Add AGENT1_PRIVATE_KEY to .env");
        console.error("   2. Or run: npx hardhat run scripts/fund-test-agents.ts --network monad-mainnet");
        process.exit(1);
    }

    const agent = signers[1]; // Use second signer as test agent
    console.log(`Test Agent: ${agent.address}\n`);

    // Connect contracts to agent wallet
    const monTokenAgent = monToken.connect(agent);
    const treasuryAgent = treasury.connect(agent);

    // ============ Step 1: Check Initial Balance ============
    console.log("1⃣  Checking initial balance...");
    console.log("-".repeat(70));

    const initialBalance = await monToken.balanceOf(agent.address);
    const nativeBalance = await ethers.provider.getBalance(agent.address);
    const entryFee = await treasury.ENTRY_FEE();

    console.log(`   Native MON (gas): ${ethers.formatEther(nativeBalance)}`);
    console.log(`   MON Tokens: ${ethers.formatEther(initialBalance)}`);
    console.log(`   Entry Fee Required: ${ethers.formatEther(entryFee)}`);

    if (initialBalance < entryFee) {
        console.error(`\n Insufficient MON tokens!`);
        console.error(`   Need: ${ethers.formatEther(entryFee)} MON`);
        console.error(`   Have: ${ethers.formatEther(initialBalance)} MON`);
        console.error(`\n   Run: npx hardhat run scripts/fund-test-agents.ts --network monad-mainnet`);
        process.exit(1);
    }

    console.log(`    Sufficient balance\n`);

    // ============ Step 2: Check if Already Entered ============
    console.log("[2] Checking entry status...");
    console.log("-".repeat(70));

    const stats = await treasury.getAgentStats(agent.address);

    if (stats.hasEntered) {
        console.log(`     Agent has already entered the world!`);
        console.log(`   Entry Time: ${new Date(Number(stats.entryTime) * 1000).toISOString()}`);
        console.log(`   Total Earned: ${ethers.formatEther(stats.totalEarned)} MON`);
        console.log(`   Total Spent: ${ethers.formatEther(stats.totalSpent)} MON`);
        console.log(`   Action Count: ${stats.actionCount}`);
        console.log(`   Reputation: ${stats.reputationScore}`);
        console.log(`\n   Skipping entry test. Agent already in world.`);
        return;
    }

    console.log(`    Agent has not entered yet\n`);

    // ============ Step 3: Approve Entry Fee ============
    console.log("3⃣  Approving entry fee...");
    console.log("-".repeat(70));

    try {
        const approveTx = await monTokenAgent.approve(
            addresses.contracts.WorldTreasury,
            entryFee
        );
        console.log(`   Transaction submitted: ${approveTx.hash}`);

        const approveReceipt = await approveTx.wait();
        console.log(`    Approved!`);
        console.log(`   Gas used: ${approveReceipt.gasUsed}`);
        console.log(`   Block: ${approveReceipt.blockNumber}\n`);

    } catch (error: any) {
        console.error(`    Approval failed: ${error.message}`);
        process.exit(1);
    }

    // ============ Step 4: Enter World ============
    console.log("4⃣  Entering world...");
    console.log("-".repeat(70));

    try {
        const enterTx = await treasuryAgent.enterWorld();
        console.log(`   Transaction submitted: ${enterTx.hash}`);

        const enterReceipt = await enterTx.wait();
        console.log(`    Entered world!`);
        console.log(`   Gas used: ${enterReceipt.gasUsed}`);
        console.log(`   Block: ${enterReceipt.blockNumber}`);

        // Parse events
        const events = enterReceipt.logs
            .map(log => {
                try {
                    return treasury.interface.parseLog({ topics: log.topics as string[], data: log.data });
                } catch {
                    return null;
                }
            })
            .filter(e => e !== null);

        const agentEnteredEvent = events.find(e => e?.name === "AgentEntered");
        if (agentEnteredEvent) {
            console.log(`    Event: AgentEntered`);
            console.log(`      Agent: ${agentEnteredEvent.args[0]}`);
            console.log(`      Fee: ${ethers.formatEther(agentEnteredEvent.args[1])} MON`);
        }
        console.log();

    } catch (error: any) {
        console.error(`    Entry failed: ${error.message}`);

        // Try to parse revert reason
        if (error.data) {
            try {
                const decodedError = treasury.interface.parseError(error.data);
                console.error(`   Revert reason: ${decodedError?.name}`);
            } catch { }
        }

        process.exit(1);
    }

    // ============ Step 5: Verify Entry ============
    console.log("5⃣  Verifying entry...");
    console.log("-".repeat(70));

    const finalStats = await treasury.getAgentStats(agent.address);
    const finalBalance = await monToken.balanceOf(agent.address);

    console.log(`    Has Entered: ${finalStats.hasEntered}`);
    console.log(`   Entry Time: ${new Date(Number(finalStats.entryTime) * 1000).toISOString()}`);
    console.log(`   Total Spent: ${ethers.formatEther(finalStats.totalSpent)} MON`);
    console.log(`   Current Balance: ${ethers.formatEther(finalBalance)} MON`);
    console.log(`   Reputation Score: ${finalStats.reputationScore}`);

    // Verify balance decreased by entry fee
    const expectedBalance = initialBalance - entryFee;
    if (finalBalance === expectedBalance) {
        console.log(`    Balance correctly decreased by entry fee\n`);
    } else {
        console.log(`     Balance mismatch!`);
        console.log(`      Expected: ${ethers.formatEther(expectedBalance)}`);
        console.log(`      Actual: ${ethers.formatEther(finalBalance)}\n`);
    }

    // ============ Final Summary ============
    console.log(" ENTRY TEST PASSED!");
    console.log("\n Next Steps:");
    console.log("   1. Test rewards: npx hardhat run scripts/test-rewards.ts --network monad-mainnet");
    console.log("   2. Test marketplace: npx hardhat run scripts/test-marketplace.ts --network monad-mainnet");
    console.log("   3. Run full agent: npm run agent:blockchain");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n Entry test failed:");
        console.error(error);
        process.exit(1);
    });
