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

    // Keep script alive
    await new Promise(() => { });
}

async function runAgentLoop(agent: BlockchainAgent, config: any) {
    try {
        await agent.wait(Math.random() * 5000); // Stagger start more
        await agent.enter();

        let cycles = 0;
        while (true) {
            cycles++;
            console.log(`\n[${config.name}] Action Cycle ${cycles}`);

            if (config.role === 'miner') {
                console.log(`[${config.name}] Thinking: Inventory low. Need to gather Ore at Mining Caves.`);
                await agent.performAction('move', { targetLocationId: 'mining_caves' });
                await agent.wait(5000);

                console.log(`[${config.name}] Thinking: Arrived. Extracting resources...`);
                await agent.performAction('gather', { targetResourceType: 'ore' });
                await agent.wait(5000);

                console.log(`[${config.name}] Thinking: Returning to Market to sell goods.`);
                await agent.performAction('move', { targetLocationId: 'market_square' });
                await agent.wait(5000);

                // Maybe gather again 50% chance
                if (Math.random() > 0.5) {
                    console.log(`[${config.name}] Thinking: Market is crowded. Decided to mine more before selling.`);
                    await agent.performAction('move', { targetLocationId: 'mining_caves' });
                    await agent.wait(5000);
                    await agent.performAction('gather', { targetResourceType: 'ore' });
                } else {
                    console.log(`[${config.name}] Thinking: Rest is needed. Staying at Market.`);
                }

            } else if (config.role === 'gatherer') {
                console.log(`[${config.name}] Thinking: Order received for Wood. Heading to Forest.`);
                await agent.performAction('move', { targetLocationId: 'forest' });
                await agent.wait(5000);

                console.log(`[${config.name}] Thinking: Gathering timber...`);
                await agent.performAction('gather', { targetResourceType: 'wood' });
                await agent.wait(5000);

                console.log(`[${config.name}] Thinking: Also spotting Herbs. Gathering them too for efficiency.`);
                await agent.performAction('gather', { targetResourceType: 'herbs' });

            } else if (config.role === 'trader') {
                console.log(`[${config.name}] Thinking: Monitoring market prices...`);
                await agent.performAction('move', { targetLocationId: 'market_square' });
                await agent.wait(5000);

                // Perform Trade
                console.log(`[${config.name}] Thinking: Listing items on Marketplace.`);
                await agent.performAction('trade', { type: 'list_item', item: 'Wood', price: 10 });
                await agent.wait(5000);

                console.log(`[${config.name}] Thinking: Opportunity detected at Workshop. Moving to craft.`);
                await agent.performAction('move', { targetLocationId: 'workshop' });
                await agent.wait(5000);

                // Perform Craft
                console.log(`[${config.name}] Thinking: Crafting Tools...`);
                await agent.performAction('craft', { item: 'Iron Pickaxe' });
                await agent.wait(5000);

                console.log(`[${config.name}] Thinking: Stamina low. Moving to Tavern to rest.`);
                await agent.performAction('move', { targetLocationId: 'tavern' });
                await agent.performAction('rest');
            }

            await agent.wait(8000); // Increased loop delay
        }

    } catch (error: any) {
        console.error(`❌ [${config.name}] Error:`, error.message);
    }
}

launchSimulation().catch(console.error);
