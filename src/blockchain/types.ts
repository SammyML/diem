/**
 * Type-safe branded types and strict interfaces for blockchain operations
 * Provides compile-time type safety and runtime validation
 */

// ============ Branded Types ============

/**
 * Brand for creating nominal types
 */
declare const brand: unique symbol;

type Brand<T, TBrand extends string> = T & { readonly [brand]: TBrand };

/**
 * Ethereum address (checksummed)
 */
export type Address = Brand<string, 'Address'>;

/**
 * Transaction hash
 */
export type TransactionHash = Brand<string, 'TransactionHash'>;

/**
 * Token amount in wei (bigint)
 */
export type TokenAmount = Brand<bigint, 'TokenAmount'>;

/**
 * Agent ID
 */
export type AgentId = Brand<string, 'AgentId'>;

/**
 * Listing ID
 */
export type ListingId = Brand<number, 'ListingId'>;

/**
 * Service ID
 */
export type ServiceId = Brand<number, 'ServiceId'>;

/**
 * Investment ID
 */
export type InvestmentId = Brand<number, 'InvestmentId'>;

// ============ Type Guards ============

/**
 * Validates and creates an Address
 */
export function createAddress(value: string): Address {
    if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
        throw new Error(`Invalid address format: ${value}`);
    }
    return value as Address;
}

/**
 * Validates and creates a TransactionHash
 */
export function createTransactionHash(value: string): TransactionHash {
    if (!/^0x[a-fA-F0-9]{64}$/.test(value)) {
        throw new Error(`Invalid transaction hash format: ${value}`);
    }
    return value as TransactionHash;
}

/**
 * Validates and creates a TokenAmount
 */
export function createTokenAmount(value: bigint | string | number): TokenAmount {
    const amount = typeof value === 'bigint' ? value : BigInt(value);
    if (amount < 0n) {
        throw new Error(`Token amount cannot be negative: ${amount}`);
    }
    return amount as TokenAmount;
}

/**
 * Creates an AgentId
 */
export function createAgentId(value: string): AgentId {
    if (!value || value.trim().length === 0) {
        throw new Error('Agent ID cannot be empty');
    }
    return value as AgentId;
}

// ============ Result Pattern ============

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> =
    | { success: true; value: T }
    | { success: false; error: E };

/**
 * Creates a successful result
 */
export function Ok<T>(value: T): Result<T, never> {
    return { success: true, value };
}

/**
 * Creates a failed result
 */
export function Err<E>(error: E): Result<never, E> {
    return { success: false, error };
}

/**
 * Type guard for successful results
 */
export function isOk<T, E>(result: Result<T, E>): result is { success: true; value: T } {
    return result.success === true;
}

/**
 * Type guard for failed results
 */
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
    return result.success === false;
}

/**
 * Unwraps a result or throws if error
 */
export function unwrap<T, E>(result: Result<T, E>): T {
    if (isOk(result)) {
        return result.value;
    }
    throw result.error;
}

/**
 * Unwraps a result or returns default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    return isOk(result) ? result.value : defaultValue;
}

/**
 * Maps a successful result to a new value
 */
export function mapResult<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => U
): Result<U, E> {
    return isOk(result) ? Ok(fn(result.value)) : result;
}

/**
 * Maps an error result to a new error
 */
export function mapError<T, E, F>(
    result: Result<T, E>,
    fn: (error: E) => F
): Result<T, F> {
    return isErr(result) ? Err(fn(result.error)) : result;
}

// ============ Contract Interfaces ============

/**
 * Agent statistics from blockchain
 */
export interface AgentStats {
    hasEntered: boolean;
    entryTime: number;
    totalEarned: TokenAmount;
    totalSpent: TokenAmount;
    actionCount: number;
    currentBalance: TokenAmount;
    reputationScore: number;
}

/**
 * World statistics from blockchain
 */
export interface WorldStats {
    totalAgents: number;
    totalFeesCollected: TokenAmount;
    totalRewardsDistributed: TokenAmount;
    treasuryBalance: TokenAmount;
}

/**
 * Token statistics
 */
export interface TokenStats {
    totalSupply: TokenAmount;
    totalRewardsMinted: TokenAmount;
    totalAgentsFunded: number;
}

/**
 * Marketplace listing
 */
export interface Listing {
    id: ListingId;
    seller: Address;
    itemType: string;
    quantity: number;
    pricePerUnit: TokenAmount;
    active: boolean;
    createdAt: number;
    expiresAt: number;
}

/**
 * Service offer
 */
export interface ServiceOffer {
    id: ServiceId;
    provider: Address;
    serviceType: string;
    pricePerAction: TokenAmount;
    active: boolean;
    completedJobs: number;
}

/**
 * Investment
 */
export interface Investment {
    id: InvestmentId;
    investor: Address;
    agent: Address;
    amount: TokenAmount;
    profitShare: number;
    timestamp: number;
    active: boolean;
}

/**
 * Marketplace statistics
 */
export interface MarketplaceStats {
    totalListings: number;
    totalServices: number;
    totalInvestments: number;
    totalFeesCollected: TokenAmount;
}

// ============ Transaction Types ============

/**
 * Transaction status
 */
export enum TransactionStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED'
}

/**
 * Transaction receipt
 */
export interface TransactionReceipt {
    hash: TransactionHash;
    status: TransactionStatus;
    blockNumber: number;
    gasUsed: bigint;
    effectiveGasPrice: bigint;
    from: Address;
    to: Address;
    timestamp: number;
}

/**
 * Transaction request
 */
export interface TransactionRequest {
    to: Address;
    data?: string;
    value?: TokenAmount;
    gasLimit?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    nonce?: number;
}

// ============ Action Types (Discriminated Unions) ============

/**
 * Agent action types
 */
export type AgentAction =
    | { type: 'move'; targetLocationId: string }
    | { type: 'gather'; targetResourceType: string }
    | { type: 'craft'; craftingRecipe: string }
    | { type: 'trade'; tradeOffer: { offeredItems: any[] } }
    | { type: 'rest' };

/**
 * Type guard for move action
 */
export function isMoveAction(action: AgentAction): action is { type: 'move'; targetLocationId: string } {
    return action.type === 'move';
}

/**
 * Type guard for gather action
 */
export function isGatherAction(action: AgentAction): action is { type: 'gather'; targetResourceType: string } {
    return action.type === 'gather';
}

/**
 * Type guard for craft action
 */
export function isCraftAction(action: AgentAction): action is { type: 'craft'; craftingRecipe: string } {
    return action.type === 'craft';
}

// ============ Configuration Types ============

/**
 * Blockchain configuration
 */
export interface BlockchainConfig {
    rpcUrl: string;
    chainId: number;
    contracts: {
        monToken: Address;
        worldTreasury: Address;
        agentMarketplace: Address;
    };
    gasSettings: {
        maxFeePerGas?: bigint;
        maxPriorityFeePerGas?: bigint;
        gasLimit?: bigint;
    };
}

/**
 * Agent configuration
 */
export interface AgentConfig {
    name: string;
    privateKey: string;
    strategy: 'conservative' | 'aggressive' | 'arbitrage' | 'investor' | 'merchant';
    riskTolerance: number; // 0-100
    initialBalance?: TokenAmount;
}

// ============ Utility Types ============

/**
 * Makes all properties optional recursively
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Makes all properties readonly recursively
 */
export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Extracts the value type from a Result
 */
export type ResultValue<T> = T extends Result<infer V, any> ? V : never;

/**
 * Extracts the error type from a Result
 */
export type ResultError<T> = T extends Result<any, infer E> ? E : never;
