import { MonTransaction } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * MON Token Ledger - manages all token transactions
 */
export class TokenLedger {
    private balances: Map<string, number>;
    private transactions: MonTransaction[];
    private readonly ENTRY_FEE = 100;

    constructor() {
        this.balances = new Map();
        this.transactions = [];
    }

    /**
     * Get entry fee amount
     */
    public getEntryFee(): number {
        return this.ENTRY_FEE;
    }

    /**
     * Initialize agent balance (for testing/demo purposes)
     */
    public initializeBalance(agentId: string, amount: number): void {
        this.balances.set(agentId, amount);
    }

    /**
     * Get agent balance
     */
    public getBalance(agentId: string): number {
        return this.balances.get(agentId) || 0;
    }

    /**
     * Check if agent can afford entry fee
     */
    public canAffordEntry(agentId: string): boolean {
        return this.getBalance(agentId) >= this.ENTRY_FEE;
    }

    /**
     * Charge entry fee
     */
    public chargeEntryFee(agentId: string): boolean {
        if (!this.canAffordEntry(agentId)) {
            return false;
        }

        return this.transfer(agentId, 'world_treasury', this.ENTRY_FEE, 'Entry fee payment');
    }

    /**
     * Transfer MON between agents
     */
    public transfer(
        fromAgentId: string,
        toAgentId: string,
        amount: number,
        reason: string
    ): boolean {
        if (amount <= 0) return false;

        const fromBalance = this.getBalance(fromAgentId);
        if (fromBalance < amount) return false;

        // Execute transfer
        this.balances.set(fromAgentId, fromBalance - amount);
        const toBalance = this.getBalance(toAgentId);
        this.balances.set(toAgentId, toBalance + amount);

        // Record transaction
        const transaction: MonTransaction = {
            id: uuidv4(),
            timestamp: Date.now(),
            fromAgentId,
            toAgentId,
            amount,
            reason,
            balanceAfter: fromBalance - amount
        };
        this.transactions.push(transaction);

        return true;
    }

    /**
     * Award MON to agent (from world/system)
     */
    public award(agentId: string, amount: number, reason: string): void {
        const currentBalance = this.getBalance(agentId);
        this.balances.set(agentId, currentBalance + amount);

        const transaction: MonTransaction = {
            id: uuidv4(),
            timestamp: Date.now(),
            fromAgentId: 'world_treasury',
            toAgentId: agentId,
            amount,
            reason,
            balanceAfter: currentBalance + amount
        };
        this.transactions.push(transaction);
    }

    /**
     * Deduct MON from agent (to world/system)
     */
    public deduct(agentId: string, amount: number, reason: string): boolean {
        return this.transfer(agentId, 'world_treasury', amount, reason);
    }

    /**
     * Get transaction history for agent
     */
    public getTransactionHistory(agentId: string, limit: number = 50): MonTransaction[] {
        return this.transactions
            .filter(tx => tx.fromAgentId === agentId || tx.toAgentId === agentId)
            .slice(-limit);
    }

    /**
     * Get all transactions
     */
    public getAllTransactions(limit: number = 100): MonTransaction[] {
        return this.transactions.slice(-limit);
    }

    /**
     * Get total MON in circulation (excluding treasury)
     */
    public getTotalCirculation(): number {
        let total = 0;
        this.balances.forEach((balance, agentId) => {
            if (agentId !== 'world_treasury') {
                total += balance;
            }
        });
        return total;
    }

    /**
     * Get leaderboard (top agents by MON balance)
     */
    public getLeaderboard(limit: number = 10): Array<{ agentId: string; balance: number }> {
        const entries = Array.from(this.balances.entries())
            .filter(([agentId]) => agentId !== 'world_treasury')
            .map(([agentId, balance]) => ({ agentId, balance }))
            .sort((a, b) => b.balance - a.balance);

        return entries.slice(0, limit);
    }
}
