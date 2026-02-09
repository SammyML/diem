import { MonadBlockchainService } from '../src/blockchain/monad-service';
import { BlockchainAgent } from '../examples/agents/blockchain-agent';
import * as dotenv from 'dotenv';
import { Wallet, ethers } from 'ethers';

dotenv.config();

async function launchSimulation() {
    console.log('Launching Multi-Agent Simulation...');
    console.log('Objective: Spawn 3 autonomous agents on Monad Blockchain\n');

    // Initialize service
    const blockchain = new MonadBlockchainService(
        process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz',
        process.env.DEPLOYER_PRIVATE_KEY
    );
    await blockchain.loadContracts();

    // Check Deployer Balance
    const deployerBalance = await blockchain.getDeployerBalance();
    console.log(`\nDeployer Balance: ${deployerBalance} MON`);

    if (parseFloat(deployerBalance) < 1.0) {
        console.error("WARNING: Deployer wallet has low balance! May fail to fund agents.");
    }

    // Define agents
    const agents = [
        { name: 'SimMiner', role: 'miner', target: 'mining_caves', resource: 'ore' },
        { name: 'SimGatherer', role: 'gatherer', target: 'forest', resource: 'wood' },
        { name: 'SimTrader', role: 'trader', target: 'market_square', resource: null }
    ];

    const activeAgents: BlockchainAgent[] = [];

    for (const agentDef of agents) {
        console.log(`\nCreating ${agentDef.name}...`);

        // Create random wallet
        const walletData = blockchain.createAgentWallet();

        // Fund it
        console.log(`   Funding wallet ${walletData.address.slice(0, 8)}...`);
        try {
            await blockchain.fundAgent(walletData.address);
        } catch (e: any) {
            console.log(`   Funding warning: ${e.message}`);
        }

        // Initialize Agent
        const agent = new BlockchainAgent(
            agentDef.name,
            walletData.privateKey,
            blockchain
        );

        activeAgents.push(agent);

        // Start Agent Logic (Async)
        runAgentLoop(agent, agentDef);
    }

    console.log('\nAll agents launched! Monitoring activity...\n');

    console.log(`\nAll agents spawned. Simulation running...\n`);
}

async function runAgentLoop(agent: BlockchainAgent, config: any) {
    // Join faction on entry
    const factions = ['wardens', 'cult', 'salvagers'];
    const randomFaction = factions[Math.floor(Math.random() * factions.length)];

    try {
        await agent.joinFaction(randomFaction);
        console.log(`[${config.name}] Joined faction: ${randomFaction}`);
    } catch (e: any) {
        console.log(`[${config.name}] Faction join skipped: ${e.message}`);
    }

    let actionCount = 0;

    while (true) {
        try {
            await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 5000));

            actionCount++;

            // Every 5th action, attack the boss
            if (actionCount % 5 === 0) {
                console.log(`[${config.name}] Coordinating boss attack...`);
                try {
                    await agent.attackBoss();
                } catch (e: any) {
                    console.log(`[${config.name}] Boss attack failed: ${e.message}`);
                }
                continue;
            }

            // Regular actions based on role
            if (config.role === 'miner') {
                console.log(`[${config.name}] Thinking: Need to mine ore...`);
                await agent.performAction('move', { targetLocationId: config.target });
                await agent.performAction('gather', { targetResourceType: config.resource });
            } else if (config.role === 'gatherer') {
                console.log(`[${config.name}] Thinking: Gathering resources...`);
                await agent.performAction('move', { targetLocationId: config.target });
                await agent.performAction('gather', { targetResourceType: config.resource });
            } else if (config.role === 'trader') {
                console.log(`[${config.name}] Thinking: Monitoring market prices...`);
                await agent.performAction('move', { targetLocationId: config.target });
                await agent.performAction('trade', { itemId: 'wood', quantity: 1, price: 10 });
                await agent.performAction('craft', { itemId: 'tool', quantity: 1 });
            }

            await agent.wait(8000); // Increased loop delay
        } catch (error: any) {
            console.error(`[${config.name}] Error: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }
}

launchSimulation().catch(console.error);
