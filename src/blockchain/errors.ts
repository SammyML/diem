/**
 * Custom error hierarchy for blockchain operations
 * Provides structured error handling with context and retry strategies
 */

/**
 * Base error class for all blockchain-related errors
 */
export class BlockchainError extends Error {
    public readonly code: string;
    public readonly timestamp: number;
    public readonly context?: Record<string, any>;
    public readonly retryable: boolean;

    constructor(
        message: string,
        code: string,
        retryable: boolean = false,
        context?: Record<string, any>
    ) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.timestamp = Date.now();
        this.context = context;
        this.retryable = retryable;

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            timestamp: this.timestamp,
            context: this.context,
            retryable: this.retryable,
            stack: this.stack
        };
    }
}

/**
 * Transaction-specific errors
 */
export class TransactionError extends BlockchainError {
    constructor(
        message: string,
        code: string,
        public readonly txHash?: string,
        retryable: boolean = true,
        context?: Record<string, any>
    ) {
        super(message, code, retryable, { ...context, txHash });
    }
}

/**
 * Contract interaction errors
 */
export class ContractError extends BlockchainError {
    constructor(
        message: string,
        code: string,
        public readonly contractAddress?: string,
        public readonly method?: string,
        retryable: boolean = false,
        context?: Record<string, any>
    ) {
        super(message, code, retryable, { ...context, contractAddress, method });
    }
}

/**
 * Network/RPC errors
 */
export class NetworkError extends BlockchainError {
    constructor(
        message: string,
        code: string,
        public readonly rpcUrl?: string,
        retryable: boolean = true,
        context?: Record<string, any>
    ) {
        super(message, code, retryable, { ...context, rpcUrl });
    }
}

/**
 * Input validation errors
 */
export class ValidationError extends BlockchainError {
    constructor(
        message: string,
        public readonly field?: string,
        public readonly value?: any,
        context?: Record<string, any>
    ) {
        super(message, 'VALIDATION_ERROR', false, { ...context, field, value });
    }
}

/**
 * Nonce management errors
 */
export class NonceError extends TransactionError {
    constructor(
        message: string,
        public readonly expectedNonce?: number,
        public readonly actualNonce?: number,
        context?: Record<string, any>
    ) {
        super(message, 'NONCE_ERROR', undefined, true, {
            ...context,
            expectedNonce,
            actualNonce
        });
    }
}

/**
 * Gas estimation errors
 */
export class GasError extends TransactionError {
    constructor(
        message: string,
        public readonly estimatedGas?: bigint,
        public readonly gasPrice?: bigint,
        context?: Record<string, any>
    ) {
        super(message, 'GAS_ERROR', undefined, false, {
            ...context,
            estimatedGas: estimatedGas?.toString(),
            gasPrice: gasPrice?.toString()
        });
    }
}

/**
 * Error codes enum for consistent error handling
 */
export enum ErrorCode {
    // Network errors (retryable)
    NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
    CONNECTION_FAILED = 'CONNECTION_FAILED',
    RPC_ERROR = 'RPC_ERROR',

    // Transaction errors
    TX_FAILED = 'TX_FAILED',
    TX_REVERTED = 'TX_REVERTED',
    TX_UNDERPRICED = 'TX_UNDERPRICED',
    INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
    NONCE_TOO_LOW = 'NONCE_TOO_LOW',
    NONCE_TOO_HIGH = 'NONCE_TOO_HIGH',

    // Contract errors
    CONTRACT_NOT_DEPLOYED = 'CONTRACT_NOT_DEPLOYED',
    CONTRACT_CALL_FAILED = 'CONTRACT_CALL_FAILED',
    INVALID_CONTRACT_ADDRESS = 'INVALID_CONTRACT_ADDRESS',

    // Validation errors
    INVALID_ADDRESS = 'INVALID_ADDRESS',
    INVALID_AMOUNT = 'INVALID_AMOUNT',
    INVALID_PARAMETERS = 'INVALID_PARAMETERS',

    // Gas errors
    GAS_ESTIMATION_FAILED = 'GAS_ESTIMATION_FAILED',
    GAS_PRICE_TOO_HIGH = 'GAS_PRICE_TOO_HIGH',
    OUT_OF_GAS = 'OUT_OF_GAS',

    // General errors
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    TIMEOUT = 'TIMEOUT',
    CANCELLED = 'CANCELLED'
}

/**
 * Helper function to determine if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
    if (error instanceof BlockchainError) {
        return error.retryable;
    }

    // Check error message for known retryable patterns
    const retryablePatterns = [
        /timeout/i,
        /network/i,
        /connection/i,
        /nonce too low/i,
        /replacement transaction underpriced/i
    ];

    return retryablePatterns.some(pattern => pattern.test(error.message));
}

/**
 * Helper function to extract error code from various error types
 */
export function getErrorCode(error: any): ErrorCode {
    if (error instanceof BlockchainError) {
        return error.code as ErrorCode;
    }

    // Map common ethers errors to our error codes
    if (error.code) {
        switch (error.code) {
            case 'NETWORK_ERROR':
            case 'TIMEOUT':
                return ErrorCode.NETWORK_TIMEOUT;
            case 'NONCE_EXPIRED':
                return ErrorCode.NONCE_TOO_LOW;
            case 'REPLACEMENT_UNDERPRICED':
                return ErrorCode.TX_UNDERPRICED;
            case 'INSUFFICIENT_FUNDS':
                return ErrorCode.INSUFFICIENT_FUNDS;
            case 'CALL_EXCEPTION':
                return ErrorCode.CONTRACT_CALL_FAILED;
            default:
                return ErrorCode.UNKNOWN_ERROR;
        }
    }

    return ErrorCode.UNKNOWN_ERROR;
}

/**
 * Retry strategy configuration
 */
export interface RetryStrategy {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
}

/**
 * Default retry strategy
 */
export const DEFAULT_RETRY_STRATEGY: RetryStrategy = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2
};

/**
 * Calculate delay for exponential backoff
 */
export function calculateBackoffDelay(
    attempt: number,
    strategy: RetryStrategy = DEFAULT_RETRY_STRATEGY
): number {
    const delay = strategy.initialDelayMs * Math.pow(strategy.backoffMultiplier, attempt - 1);
    return Math.min(delay, strategy.maxDelayMs);
}
