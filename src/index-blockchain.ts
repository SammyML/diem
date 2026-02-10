import { createServer } from 'http';
import * as dotenv from 'dotenv';
import { WorldStateManager } from './core/world-state';
import { TokenLedger } from './token/token-ledger';
import { PaymentGateway } from './token/payment-gateway';
import { ActionProcessor } from './api/action-processor';
import { ApiServer } from './api/api-server';
import { WebSocketServer } from './api/websocket-server';
import { MonadBlockchainService } from './blockchain/monad-service';
import { ethers } from 'ethers';
import { EventType } from './types';

// Load environment variables
dotenv.config();

/**
 * Main entry point for Diem - Monad Blockchain Mode
 */
async function main() {
    console.log('Starting Diem Virtual World - BLOCKCHAIN MODE\n');

    // Initialize core systems
    const worldState = new WorldStateManager();
    const tokenLedger = new TokenLedger();

    // In blockchain mode, TokenLedger is just a cache/mirror of chain state
    // We override its critical methods or sync from chain

    const paymentGateway = new PaymentGateway(tokenLedger);
    const actionProcessor = new ActionProcessor(worldState, tokenLedger);

    // Initialize Blockchain Service
    console.log('Connecting to Monad Testnet...');
    const blockchainParams = {
        rpcUrl: process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz',
        privateKey: process.env.DEPLOYER_PRIVATE_KEY
    };

    const blockchainService = new MonadBlockchainService(
        blockchainParams.rpcUrl,
        blockchainParams.privateKey
    );

    try {
        await blockchainService.loadContracts();
        console.log('Connected to Monad Blockchain');

        // Listen to Blockchain Events and Sync World State
        console.log('Starting event polling...');

        await blockchainService.startPolling(
            // 1. Agent Entry
            (agentAddress, fee, timestamp) => {
                console.log(`On-Chain Event: Agent ${agentAddress.slice(0, 8)} entered world`);

                // Register agent in our local state if not exists
                const agentId = agentAddress.toLowerCase(); // Use address as ID
                const agent = worldState.getAgent(agentId);

                if (!agent) {
                    worldState.updateAgent(agentId, {
                        id: agentId,
                        name: `Agent-${agentAddress.slice(2, 6)}`,
                        monBalance: 0, // Will be synced from chain
                        inventory: [],
                        locationId: 'market_square',
                        lastAction: Date.now(),
                        stats: { // Initialize stats
                            miningSkill: 0,
                            gatheringSkill: 0,
                            craftingSkill: 0,
                            tradingSkill: 0,
                            totalActions: 0,
                            hp: 100,
                            maxHp: 100,
                            attack: 10,
                            defense: 5,
                            wins: 0,
                            losses: 0
                        },
                        joinedAt: Date.now()
                    });

                    // Broadcast to UI
                    wsServer.broadcastEvent({
                        id: `evt_${Date.now()}`,
                        type: EventType.AGENT_JOINED,
                        agentId: agentId,
                        locationId: 'market_square',
                        timestamp: Date.now(),
                        description: `Agent ${agentAddress.slice(0, 8)} entered via Monad Blockchain`,
                        data: { monChange: -100 }
                    });
                }
            },

            // 2. Rewards (Mining/Gathering)
            (agentAddress, amount, reason) => {
                const amountMon = parseFloat(ethers.formatEther(amount));
                console.log(`On-Chain Event: Agent ${agentAddress.slice(0, 8)} earned ${amountMon} MON for ${reason}`);

                const agentId = agentAddress.toLowerCase();
                const agent = worldState.getAgent(agentId);

                if (agent) {
                    // Determine resource type based on reason or default

                    wsServer.broadcastEvent({
                        id: `evt_${Date.now()}`,
                        type: EventType.MON_EARNED,
                        agentId: agentId,
                        locationId: agent.locationId,
                        timestamp: Date.now(),
                        description: `Agent earned reward on-chain: ${amountMon} MON`,
                        data: { amount: amountMon, reason }
                    });
                }
            }
        );

    } catch (error) {
        console.error('Failed to connect to blockchain:', error);
        console.log('Falling back to centralized mode for server...');
    }

    // Create API server
    const apiServer = new ApiServer(
        worldState,
        tokenLedger,
        paymentGateway,
        actionProcessor,
        blockchainService
    );

    // Create HTTP server
    const httpServer = createServer(apiServer.getApp());

    // Create WebSocket server
    const wsServer = new WebSocketServer(httpServer, worldState);

    // Start server
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
        console.log('Diem Virtual World (Blockchain Node) is running!\n');
        console.log(`API Server: http://localhost:${PORT}`);
        console.log(`WebSocket: ws://localhost:${PORT}`);
        console.log(`\nMonad Contracts:`);
        console.log(`   MON Token:       ${process.env.MON_TOKEN_ADDRESS}`);
        console.log(`   World Treasury:  ${process.env.WORLD_TREASURY_ADDRESS}`);
        console.log(`   Marketplace:     ${process.env.AGENT_MARKETPLACE_ADDRESS}`);
        console.log(`\nReady for On-Chain Agents!\n`);
    });

    // Sync loop: Update agent balances from blockchain periodically
    setInterval(async () => {
        const agents = worldState.getAllAgents();
        for (const agent of agents) {
            try {
                // In a real prod environment, we wouldn't hammer the RPC like this
                // But for demo with < 100 agents, it's fine
                const balance = await blockchainService.getAgentBalance(agent.id);
                if (balance !== agent.monBalance) {
                    agent.monBalance = balance;
                    worldState.updateAgent(agent.id, agent);
                    // console.log(`Synced balance for ${agent.id}: ${balance} MON`);
                }
            } catch (err) {
                // Ignore sync errors
            }
        }
    }, 5000); // Sync every 5 seconds

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n Shutting down gracefully...');
        worldState.saveState();
        console.log(' Final state saved');
        process.exit(0);
    });
}

// Run the server
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
