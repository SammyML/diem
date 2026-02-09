import { ethers, Wallet, Contract, JsonRpcProvider } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Blockchain integration layer for Diem on Monad
 * You're now ready to deploy Diem to Monad blockchain!
 */
export class MonadBlockchainService {
    private provider: JsonRpcProvider;
    private wallet?: Wallet;
    private monToken?: Contract;
    private worldTreasury?: Contract;
    private agentMarketplace?: Contract;

    private contracts: {
        MONToken?: string;
        WorldTreasury?: string;
        AgentMarketplace?: string;
    } = {};

    constructor(
        private rpcUrl: string = 'https://testnet-rpc.monad.xyz',
        private privateKey?: string
    ) {
        this.provider = new JsonRpcProvider(this.rpcUrl);

        if (privateKey) {
            this.wallet = new Wallet(privateKey, this.provider);
        }
    }

    /**
     * Get deployer wallet balance (native MON)
     */
    async getDeployerBalance(): Promise<string> {
        if (!this.wallet) return '0';
        const balance = await this.provider.getBalance(this.wallet.address);
        return ethers.formatEther(balance);
    }

    /**
     * Load deployed contract addresses
     */
    async loadContracts(deploymentFile: string = './contracts/deployment-addresses.json'): Promise<void> {
        try {
            const data = fs.readFileSync(deploymentFile, 'utf-8');
            const deployment = JSON.parse(data);
            this.contracts = deployment.contracts;

            // Load ABIs
            const monTokenABI = this.loadABI('MONToken');
            const worldTreasuryABI = this.loadABI('WorldTreasury');
            const agentMarketplaceABI = this.loadABI('AgentMarketplace');

            // Initialize contract instances
            if (this.wallet) {
                this.monToken = new Contract(this.contracts.MONToken!, monTokenABI, this.wallet);
                this.worldTreasury = new Contract(this.contracts.WorldTreasury!, worldTreasuryABI, this.wallet);
                this.agentMarketplace = new Contract(this.contracts.AgentMarketplace!, agentMarketplaceABI, this.wallet);
            } else {
                this.monToken = new Contract(this.contracts.MONToken!, monTokenABI, this.provider);
                this.worldTreasury = new Contract(this.contracts.WorldTreasury!, worldTreasuryABI, this.provider);
                this.agentMarketplace = new Contract(this.contracts.AgentMarketplace!, agentMarketplaceABI, this.provider);
            }

            console.log('Contracts loaded successfully');
        } catch (error) {
            console.error('Failed to load contracts:', error);
            throw error;
        }
    }

    private loadABI(contractName: string): any[] {
        const artifactPath = path.join(__dirname, `../../contracts/artifacts/contracts/${contractName}.sol/${contractName}.json`);
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
        return artifact.abi;
    }

    /**
     * Create wallet for agent
     */
    createAgentWallet(): { address: string; privateKey: string } {
        const wallet = Wallet.createRandom();
        return {
            address: wallet.address,
            privateKey: wallet.privateKey
        };
    }

    /**
     * Get agent wallet from private key
     */
    getAgentWallet(privateKey: string): Wallet {
        return new Wallet(privateKey, this.provider);
    }

    /**
     * Fund agent with initial MON tokens
     */
    async fundAgent(agentAddress: string): Promise<string> {
        if (!this.monToken || !this.wallet) throw new Error('Contracts not loaded or no wallet');

        // 1. Send Native MON for Gas
        console.log(`   Sending 1.0 Native MON for gas to ${agentAddress.slice(0, 8)}...`);
        const gasTx = await this.wallet.sendTransaction({
            to: agentAddress,
            value: ethers.parseEther("1.0")
        });
        await gasTx.wait();
        console.log('   Gas sent');

        // 2. Send Game Token (ERC20)
        const tx = await this.monToken.fundAgent(agentAddress);
        const receipt = await tx.wait();
        return receipt.hash;
    }

    /**
     * Agent enters the world (pays entry fee)
     */
    async enterWorld(agentWallet: Wallet): Promise<{ success: boolean; txHash: string }> {
        if (!this.contracts.WorldTreasury || !this.contracts.MONToken) {
            throw new Error('Contracts not loaded');
        }

        const monTokenABI = this.loadABI('MONToken');
        const worldTreasuryABI = this.loadABI('WorldTreasury');

        const monToken = new Contract(this.contracts.MONToken, monTokenABI, agentWallet);
        const worldTreasury = new Contract(this.contracts.WorldTreasury, worldTreasuryABI, agentWallet);

        // Approve entry fee
        const entryFee = ethers.parseEther('100');
        const approveTx = await monToken.approve(this.contracts.WorldTreasury, entryFee);
        await approveTx.wait();

        // Enter world
        const enterTx = await worldTreasury.enterWorld();
        const receipt = await enterTx.wait();

        return {
            success: true,
            txHash: receipt.hash
        };
    }

    /**
     * Distribute reward to agent
     */
    async distributeReward(agentAddress: string, amount: number, reason: string): Promise<string> {
        if (!this.worldTreasury) throw new Error('WorldTreasury not loaded');

        const amountWei = ethers.parseEther(amount.toString());
        const tx = await this.worldTreasury.distributeReward(agentAddress, amountWei, reason);
        const receipt = await tx.wait();
        return receipt.hash;
    }

    /**
     * Get agent MON balance
     */
    async getAgentBalance(agentAddress: string): Promise<number> {
        if (!this.monToken) throw new Error('MONToken not loaded');

        const balance = await this.monToken.balanceOf(agentAddress);
        return parseFloat(ethers.formatEther(balance));
    }

    /**
     * Get agent stats from blockchain
     */
    async getAgentStats(agentAddress: string): Promise<any> {
        if (!this.worldTreasury) throw new Error('WorldTreasury not loaded');

        const stats = await this.worldTreasury.getAgentStats(agentAddress);
        return {
            hasEntered: stats[0],
            entryTime: Number(stats[1]),
            totalEarned: parseFloat(ethers.formatEther(stats[2])),
            totalSpent: parseFloat(ethers.formatEther(stats[3])),
            actionCount: Number(stats[4]),
            currentBalance: parseFloat(ethers.formatEther(stats[5]))
        };
    }

    /**
     * Get world statistics
     */
    async getWorldStats(): Promise<any> {
        if (!this.worldTreasury) throw new Error('WorldTreasury not loaded');

        const stats = await this.worldTreasury.getWorldStats();
        return {
            totalAgents: Number(stats[0]),
            totalFeesCollected: parseFloat(ethers.formatEther(stats[1])),
            totalRewardsDistributed: parseFloat(ethers.formatEther(stats[2])),
            treasuryBalance: parseFloat(ethers.formatEther(stats[3]))
        };
    }

    /**
     * List item on marketplace
     */
    async listItem(agentWallet: Wallet, itemType: string, quantity: number, pricePerUnit: number): Promise<string> {
        if (!this.contracts.AgentMarketplace) throw new Error('AgentMarketplace not loaded');

        const agentMarketplaceABI = this.loadABI('AgentMarketplace');
        const marketplace = new Contract(this.contracts.AgentMarketplace, agentMarketplaceABI, agentWallet);

        const priceWei = ethers.parseEther(pricePerUnit.toString());
        const tx = await marketplace.listItem(itemType, quantity, priceWei);
        const receipt = await tx.wait();

        // Extract listing ID from event
        const event = receipt.logs.find((log: any) => {
            try {
                const parsed = marketplace.interface.parseLog(log);
                return parsed?.name === 'ItemListed';
            } catch {
                return false;
            }
        });

        return receipt.hash;
    }

    /**
     * Purchase item from marketplace
     */
    async purchaseItem(agentWallet: Wallet, listingId: number, quantity: number): Promise<string> {
        if (!this.contracts.AgentMarketplace || !this.contracts.MONToken) {
            throw new Error('Contracts not loaded');
        }

        const agentMarketplaceABI = this.loadABI('AgentMarketplace');
        const monTokenABI = this.loadABI('MONToken');

        const marketplace = new Contract(this.contracts.AgentMarketplace, agentMarketplaceABI, agentWallet);
        const monToken = new Contract(this.contracts.MONToken, monTokenABI, agentWallet);

        // Get listing details
        const listing = await marketplace.listings(listingId);
        const totalPrice = listing.pricePerUnit * BigInt(quantity);

        // Approve payment
        const approveTx = await monToken.approve(this.contracts.AgentMarketplace, totalPrice);
        await approveTx.wait();

        // Purchase
        const tx = await marketplace.purchaseItem(listingId, quantity);
        const receipt = await tx.wait();
        return receipt.hash;
    }

    /**
     * Invest in another agent
     */
    async investInAgent(investorWallet: Wallet, agentAddress: string, amount: number, profitShare: number): Promise<string> {
        if (!this.contracts.AgentMarketplace || !this.contracts.MONToken) {
            throw new Error('Contracts not loaded');
        }

        const agentMarketplaceABI = this.loadABI('AgentMarketplace');
        const monTokenABI = this.loadABI('MONToken');

        const marketplace = new Contract(this.contracts.AgentMarketplace, agentMarketplaceABI, investorWallet);
        const monToken = new Contract(this.contracts.MONToken, monTokenABI, investorWallet);

        const amountWei = ethers.parseEther(amount.toString());

        // Approve investment
        const approveTx = await monToken.approve(this.contracts.AgentMarketplace, amountWei);
        await approveTx.wait();

        // Invest
        const tx = await marketplace.investInAgent(agentAddress, amountWei, profitShare);
        const receipt = await tx.wait();
        return receipt.hash;
    }

    /**
     * Listen to world events (using polling)
     */
    async startPolling(
        onAgentEntered: (agent: string, fee: bigint, timestamp: bigint) => void,
        onRewardDistributed: (agent: string, amount: bigint, reason: string) => void
    ): Promise<void> {
        if (!this.worldTreasury) throw new Error('WorldTreasury not loaded');

        let lastBlock = await this.provider.getBlockNumber();
        console.log(`Started polling for events from block ${lastBlock}`);

        setInterval(async () => {
            try {
                const currentBlock = await this.provider.getBlockNumber();
                if (currentBlock <= lastBlock) return;

                // console.log(`Polling blocks ${lastBlock + 1} to ${currentBlock}`);

                // 1. Check AgentEntered
                const enterEvents = await this.worldTreasury!.queryFilter(
                    this.worldTreasury!.filters.AgentEntered(),
                    lastBlock + 1,
                    currentBlock
                );

                for (const event of enterEvents) {
                    if ('args' in event) {
                        const [agent, fee, timestamp] = event.args;
                        onAgentEntered(agent, fee, timestamp);
                    }
                }

                // 2. Check RewardDistributed
                const rewardEvents = await this.worldTreasury!.queryFilter(
                    this.worldTreasury!.filters.RewardDistributed(),
                    lastBlock + 1,
                    currentBlock
                );

                for (const event of rewardEvents) {
                    if ('args' in event) {
                        const [agent, amount, reason] = event.args;
                        onRewardDistributed(agent, amount, reason);
                    }
                }

                lastBlock = currentBlock;
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 5000); // Poll every 5 seconds
    }

    /**
     * Send a generic transaction (used for simulating craft/trade activity)
     */
    async sendTransaction(wallet: Wallet, to: string, amount: string): Promise<any> {
        const tx = await wallet.sendTransaction({
            to: to,
            value: ethers.parseEther(amount)
        });
        const receipt = await tx.wait();
        return receipt;
    }
}
