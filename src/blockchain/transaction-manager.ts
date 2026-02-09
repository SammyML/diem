/**
 * Advanced transaction management with nonce tracking, gas optimization, and retry logic
 */

import { ethers, Wallet, TransactionRequest, TransactionResponse } from 'ethers';
import {
    TransactionError,
    NetworkError,
    NonceError,
    GasError,
    ErrorCode,
    isRetryableError,
    calculateBackoffDelay,
    DEFAULT_RETRY_STRATEGY,
    RetryStrategy
} from './errors';
import { Result, Ok, Err, TransactionHash, Address, createTransactionHash } from './types';

/**
 * Transaction status
 */
export enum TxStatus {
    PENDING = 'PENDING',
    QUEUED = 'QUEUED',
    SUBMITTED = 'SUBMITTED',
    CONFIRMED = 'CONFIRMED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED'
}

/**
 * Transaction metadata
 */
interface TxMetadata {
    id: string;
    status: TxStatus;
    request: TransactionRequest;
    response?: TransactionResponse;
    hash?: TransactionHash;
    submittedAt?: number;
    confirmedAt?: number;
    attempts: number;
    lastError?: Error;
}

/**
 * Gas price configuration
 */
interface GasConfig {
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    gasLimit?: bigint;
}

/**
 * Transaction manager configuration
 */
export interface TransactionManagerConfig {
    wallet: Wallet;
    retryStrategy?: RetryStrategy;
    gasConfig?: GasConfig;
    confirmations?: number;
    timeoutMs?: number;
}

/**
 * Advanced transaction manager
 * 
 * Features:
 * - Automatic nonce management
 * - Gas price estimation with EIP-1559
 * - Transaction queue with priority
 * - Automatic retry with exponential backoff
 * - Transaction status monitoring
 */
export class TransactionManager {
    private wallet: Wallet;
    private retryStrategy: RetryStrategy;
    private gasConfig: GasConfig;
    private confirmations: number;
    private timeoutMs: number;

    // Nonce tracking
    private currentNonce?: number;
    private pendingNonces: Set<number> = new Set();

    // Transaction tracking
    private transactions: Map<string, TxMetadata> = new Map();
    private queue: TxMetadata[] = [];

    constructor(config: TransactionManagerConfig) {
        this.wallet = config.wallet;
        this.retryStrategy = config.retryStrategy || DEFAULT_RETRY_STRATEGY;
        this.gasConfig = config.gasConfig || {};
        this.confirmations = config.confirmations || 1;
        this.timeoutMs = config.timeoutMs || 60000; // 1 minute default
    }

    /**
     * Submits a transaction with automatic retry and nonce management
     */
    async submitTransaction(
        request: TransactionRequest,
        priority: number = 0
    ): Promise<Result<TransactionHash, Error>> {
        const txId = this.generateTxId();
        const metadata: TxMetadata = {
            id: txId,
            status: TxStatus.QUEUED,
            request,
            attempts: 0
        };

        this.transactions.set(txId, metadata);
        this.queue.push(metadata);

        // Sort queue by priority
        this.queue.sort((a, b) => priority - priority);

        return this.processTransaction(metadata);
    }

    /**
     * Processes a transaction with retry logic
     */
    private async processTransaction(metadata: TxMetadata): Promise<Result<TransactionHash, Error>> {
        metadata.status = TxStatus.PENDING;

        for (let attempt = 1; attempt <= this.retryStrategy.maxAttempts; attempt++) {
            metadata.attempts = attempt;

            try {
                // Get nonce
                const nonceResult = await this.getNextNonce();
                if (!nonceResult.success) {
                    return nonceResult;
                }
                const nonce = nonceResult.value;

                // Estimate gas
                const gasResult = await this.estimateGas(metadata.request);
                if (!gasResult.success) {
                    return gasResult;
                }
                const gas = gasResult.value;

                // Prepare transaction
                const tx: TransactionRequest = {
                    ...metadata.request,
                    nonce,
                    ...gas
                };

                // Submit transaction
                metadata.status = TxStatus.SUBMITTED;
                metadata.submittedAt = Date.now();

                const response = await this.wallet.sendTransaction(tx);
                metadata.response = response;
                metadata.hash = createTransactionHash(response.hash);

                this.pendingNonces.add(nonce);

                // Wait for confirmation
                const receipt = await this.waitForConfirmation(response);

                this.pendingNonces.delete(nonce);
                metadata.status = TxStatus.CONFIRMED;
                metadata.confirmedAt = Date.now();

                return Ok(metadata.hash);

            } catch (error: any) {
                metadata.lastError = error;

                // Check if retryable
                if (!isRetryableError(error) || attempt === this.retryStrategy.maxAttempts) {
                    metadata.status = TxStatus.FAILED;
                    return Err(this.wrapError(error, metadata));
                }

                // Wait before retry
                const delay = calculateBackoffDelay(attempt, this.retryStrategy);
                await this.sleep(delay);
            }
        }

        // Should never reach here, but TypeScript needs it
        metadata.status = TxStatus.FAILED;
        return Err(new TransactionError(
            'Transaction failed after max retries',
            ErrorCode.TX_FAILED,
            metadata.hash?.toString()
        ));
    }

    /**
     * Gets the next available nonce
     */
    private async getNextNonce(): Promise<Result<number, NonceError>> {
        try {
            if (this.currentNonce === undefined) {
                // First transaction, get nonce from network
                this.currentNonce = await this.wallet.getNonce('pending');
            }

            // Find next available nonce
            let nonce = this.currentNonce;
            while (this.pendingNonces.has(nonce)) {
                nonce++;
            }

            this.currentNonce = nonce + 1;
            return Ok(nonce);

        } catch (error: any) {
            return Err(new NonceError(
                'Failed to get nonce',
                undefined,
                undefined,
                { originalError: error.message }
            ));
        }
    }

    /**
     * Estimates gas for a transaction
     */
    private async estimateGas(request: TransactionRequest): Promise<Result<GasConfig, GasError>> {
        try {
            // Use provided gas config if available
            if (this.gasConfig.gasLimit && this.gasConfig.maxFeePerGas) {
                return Ok(this.gasConfig);
            }

            // Estimate gas limit
            const gasLimit = this.gasConfig.gasLimit || await this.wallet.estimateGas(request);

            // Get fee data (EIP-1559)
            const feeData = await this.wallet.provider!.getFeeData();

            const maxFeePerGas = this.gasConfig.maxFeePerGas || feeData.maxFeePerGas || undefined;
            const maxPriorityFeePerGas = this.gasConfig.maxPriorityFeePerGas || feeData.maxPriorityFeePerGas || undefined;

            return Ok({
                gasLimit,
                maxFeePerGas,
                maxPriorityFeePerGas
            });

        } catch (error: any) {
            return Err(new GasError(
                'Failed to estimate gas',
                undefined,
                undefined,
                { originalError: error.message }
            ));
        }
    }

    /**
     * Waits for transaction confirmation
     */
    private async waitForConfirmation(response: TransactionResponse): Promise<ethers.TransactionReceipt> {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Transaction confirmation timeout')), this.timeoutMs);
        });

        const confirmationPromise = response.wait(this.confirmations);

        const receipt = await Promise.race([confirmationPromise, timeoutPromise]);

        if (!receipt) {
            throw new TransactionError(
                'Transaction receipt is null',
                ErrorCode.TX_FAILED,
                response.hash
            );
        }

        if (receipt.status === 0) {
            throw new TransactionError(
                'Transaction reverted',
                ErrorCode.TX_REVERTED,
                response.hash
            );
        }

        return receipt;
    }

    /**
     * Wraps an error with transaction context
     */
    private wrapError(error: any, metadata: TxMetadata): Error {
        if (error instanceof TransactionError) {
            return error;
        }

        // Map ethers errors to our error types
        if (error.code === 'NONCE_EXPIRED') {
            return new NonceError(
                error.message,
                undefined,
                metadata.request.nonce !== undefined && metadata.request.nonce !== null
                    ? metadata.request.nonce
                    : undefined,
                { txId: metadata.id }
            );
        }

        if (error.code === 'INSUFFICIENT_FUNDS') {
            return new TransactionError(
                error.message,
                ErrorCode.INSUFFICIENT_FUNDS,
                metadata.hash?.toString(),
                false,
                { txId: metadata.id }
            );
        }

        return new TransactionError(
            error.message || 'Unknown transaction error',
            ErrorCode.TX_FAILED,
            metadata.hash?.toString(),
            isRetryableError(error),
            { txId: metadata.id, originalError: error }
        );
    }

    /**
     * Gets transaction status
     */
    getTransactionStatus(txId: string): TxMetadata | undefined {
        return this.transactions.get(txId);
    }

    /**
     * Gets all pending transactions
     */
    getPendingTransactions(): TxMetadata[] {
        return Array.from(this.transactions.values()).filter(
            tx => tx.status === TxStatus.PENDING || tx.status === TxStatus.SUBMITTED
        );
    }

    /**
     * Cancels a pending transaction
     */
    async cancelTransaction(txId: string): Promise<Result<void, Error>> {
        const metadata = this.transactions.get(txId);
        if (!metadata) {
            return Err(new Error(`Transaction ${txId} not found`));
        }

        if (metadata.status !== TxStatus.PENDING && metadata.status !== TxStatus.QUEUED) {
            return Err(new Error(`Transaction ${txId} cannot be cancelled (status: ${metadata.status})`));
        }

        metadata.status = TxStatus.CANCELLED;
        return Ok(undefined);
    }

    /**
     * Resets nonce (use with caution)
     */
    async resetNonce(): Promise<void> {
        this.currentNonce = await this.wallet.getNonce('latest');
        this.pendingNonces.clear();
    }

    /**
     * Generates a unique transaction ID
     */
    private generateTxId(): string {
        return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Creates a transaction manager instance
 */
export function createTransactionManager(config: TransactionManagerConfig): TransactionManager {
    return new TransactionManager(config);
}
