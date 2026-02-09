import { MonadBlockchainService } from '../../src/blockchain/monad-service';
import { Wallet } from 'ethers';
import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Blockchain-enabled agent that uses Monad for all transactions
 */
class BlockchainAgent {
    private blockchain: MonadBlockchainService;
    private wallet: Wallet;
    private apiUrl: string;
    private agentId?: string;

    constructor(
        private name: string,
        privateKey: string,
        blockchainService: MonadBlockchainService,
        apiUrl: string = 'http://localhost:3000'
    ) {
        this.blockchain = blockchainService;
        this.wallet = blockchainService.getAgentWallet(privateKey);
        this.apiUrl = apiUrl;
    }

    /**
     * Enter the world using blockchain
     */
    async enter(): Promise<void> {
        console.log(`\n ${this.name} entering world via Monad blockchain...`);
        console.log(`   Wallet: ${this.wallet.address}`);

        // Check balance
        const balance = await this.blockchain.getAgentBalance(this.wallet.address);
        console.log(`   MON Balance: ${balance}`);

        // Pay entry fee on blockchain
        const result = await this.blockchain.enterWorld(this.wallet);
        console.log(`   Entry fee paid! TX: ${result.txHash.substring(0, 10)}...`);

        // Register with API server
        const response = await axios.post(`${this.apiUrl}/agent/enter/blockchain`, {
            agentName: this.name,
            walletAddress: this.wallet.address
        });

        this.agentId = response.data.agent.id;
        console.log(`   Agent ID: ${this.agentId}`);
    }

    /**
     * Perform action and receive blockchain reward
     */
    async performAction(actionType: string, params: any = {}): Promise<void> {
        console.log(`\n ${this.name} performing ${actionType}...`);

        try {
            // Submit action to API
            const response = await axios.post(`${this.apiUrl}/agent/action/blockchain`, {
                walletAddress: this.wallet.address,
                action: {
                    type: actionType,
                    ...params
                }
            });

            if (response.data.success) {
                console.log(`   ${response.data.message}`);

                if (response.data.monEarned) {
                    console.log(`   Earned ${response.data.monEarned} MON (on-chain)`);
                }
            } else {
                console.log(`   ${response.data.message}`);
            }

            // Simulate additional blockchain transactions for crafting/trading to ensure metrics update
            if (actionType === 'craft') {
                console.log(`   Crafting Item (Blockchain TX)...`);
                // Simulate crafting transaction (pay fee to treasury)
                const tx = await this.blockchain.sendTransaction(this.wallet, process.env.WORLD_TREASURY_ADDRESS!, '0.001');
                console.log(`   Crafting Fee Paid! TX: ${tx.hash.substring(0, 10)}...`);
            } else if (actionType === 'trade') {
                console.log(`   Trading on Marketplace (Blockchain TX)...`);
                // Simulate trade activity
                const tx = await this.blockchain.sendTransaction(this.wallet, process.env.WORLD_TREASURY_ADDRESS!, '0.001');
                console.log(`   Trade Activity Recorded! TX: ${tx.hash.substring(0, 10)}...`);
            }

        } catch (error: any) {
            console.error(`   Action failed: ${error.message}`);
        }
    }

    /**
     * List item on blockchain marketplace
     */
    async listItemOnMarketplace(itemType: string, quantity: number, price: number): Promise<void> {
        console.log(`\n ${this.name} listing ${quantity}x ${itemType} for ${price} MON each...`);

        const txHash = await this.blockchain.listItem(this.wallet, itemType, quantity, price);
        console.log(`   Listed on blockchain! TX: ${txHash.substring(0, 10)}...`);
    }

    /**
     * Invest in another agent
     */
    async investInOtherAgent(agentAddress: string, amount: number, profitShare: number): Promise<void> {
        console.log(`\n ${this.name} investing ${amount} MON in agent ${agentAddress.substring(0, 10)}...`);

        const txHash = await this.blockchain.investInAgent(this.wallet, agentAddress, amount, profitShare);
        console.log(`   Investment made! TX: ${txHash.substring(0, 10)}...`);
        console.log(`   Profit share: ${profitShare}%`);
    }

    /**
     * Get blockchain stats
     */
    async getStats(): Promise<void> {
        const stats = await this.blockchain.getAgentStats(this.wallet.address);
        console.log(`\n ${this.name} Blockchain Stats:`);
        console.log(`   Total Earned: ${stats.totalEarned} MON`);
        console.log(`   Total Spent: ${stats.totalSpent} MON`);
        console.log(`   Current Balance: ${stats.currentBalance} MON`);
        console.log(`   Actions: ${stats.actionCount}`);
    }

    async wait(ms: number): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Demo: Single blockchain agent
 */
async function runBlockchainAgentDemo() {
    console.log(' BLOCKCHAIN AGENT DEMO\n');
    console.log('Using Monad blockchain for all transactions\n');

    // Initialize blockchain service
    const blockchain = new MonadBlockchainService(
        process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz',
        process.env.DEPLOYER_PRIVATE_KEY
    );

    await blockchain.loadContracts();

    let agentWallet: { address: string; privateKey: string };
    let needsFunding = true;

    // Check for configured private key
    if (process.env.AGENT_PRIVATE_KEY) {
        try {
            const wallet = new Wallet(process.env.AGENT_PRIVATE_KEY);
            agentWallet = {
                address: wallet.address,
                privateKey: wallet.privateKey
            };
            console.log(' Using configured private key (MetaMask)');
            console.log(' Agent Address:', agentWallet.address);
        } catch (error) {
            console.error(' Invalid AGENT_PRIVATE_KEY, falling back to random wallet');
            agentWallet = blockchain.createAgentWallet();
            console.log(' Created new random agent wallet:', agentWallet.address);
        }
    } else {
        // Create random agent wallet
        agentWallet = blockchain.createAgentWallet();
        console.log(' Created new random agent wallet:', agentWallet.address);
    }

    // Fund agent
    if (needsFunding) {
        console.log(' Checking funding status...');
        try {
            await blockchain.fundAgent(agentWallet.address);
            console.log(' Funding check complete.');
        } catch (error: any) {
            console.log(' Funding skipped or failed (Agent might already be funded):', error.message || error);
        }
    }

    // Create blockchain agent
    const agent = new BlockchainAgent(
        'Blockchain Miner',
        agentWallet.privateKey,
        blockchain
    );

    // Enter world
    try {
        await agent.enter();
    } catch (error: any) {
        if (error.message && error.message.includes('AgentAlreadyEntered')) {
            console.log(' Agent has already entered the world. Resuming...');
        } else {
            console.log(' Error entering world (might be already entered):', error.message || error);
        }
    }

    await agent.wait(2000);

    // Perform actions
    await agent.performAction('move', { targetLocationId: 'mining_caves' });
    await agent.wait(2000);

    await agent.performAction('gather', { targetResourceType: 'ore' });
    await agent.wait(2000);

    await agent.performAction('gather', { targetResourceType: 'ore' });
    await agent.wait(2000);

    // List item on marketplace
    try {
        await agent.listItemOnMarketplace('ore', 5, 25);
    } catch (error) {
        console.log(' Market listing failed (maybe no items):', error);
    }
    await agent.wait(2000);

    // Get stats
    await agent.getStats();

    // Get world stats
    const worldStats = await blockchain.getWorldStats();
    console.log('\n World Stats:');
    console.log(`   Total Agents: ${worldStats.totalAgents}`);
    console.log(`   Total Fees Collected: ${worldStats.totalFeesCollected} MON`);
    console.log(`   Total Rewards: ${worldStats.totalRewardsDistributed} MON`);

    console.log('\n Blockchain agent demo complete!');
}

// Run demo
if (require.main === module) {
    runBlockchainAgentDemo().catch(console.error);
}

export { BlockchainAgent };
