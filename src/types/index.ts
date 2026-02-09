/**
 * Core type definitions for the Diem virtual world
 */

export interface Location {
    id: string;
    name: string;
    description: string;
    capacity: number;
    currentOccupancy: number;
    resources: ResourcePool[];
    connectedTo: string[];
    properties: Record<string, any>;
}

export interface ResourcePool {
    type: ResourceType;
    amount: number;
    maxAmount: number;
    regenerationRate: number; // per minute
    lastRegeneration: number; // timestamp
}

export enum ResourceType {
    ORE = 'ore',
    WOOD = 'wood',
    HERBS = 'herbs',
    TOOL = 'tool',
    POTION = 'potion',
    RARE_GEM = 'rare_gem'
}

export interface Agent {
    id: string;
    name: string;
    locationId: string;
    monBalance: number;
    inventory: InventoryItem[];
    stats: AgentStats;
    joinedAt: number;
    lastAction: number;
}

export interface InventoryItem {
    resourceType: ResourceType;
    quantity: number;
    quality: QualityTier;
}

export enum QualityTier {
    COMMON = 'common',
    RARE = 'rare',
    LEGENDARY = 'legendary'
}

export interface AgentStats {
    miningSkill: number;
    gatheringSkill: number;
    craftingSkill: number;
    tradingSkill: number;
    totalActions: number;
}

export interface WorldState {
    locations: Map<string, Location>;
    agents: Map<string, Agent>;
    events: WorldEvent[];
    economicStats: EconomicStats;
    startTime: number;
    lastUpdate: number;
}

export interface WorldEvent {
    id: string;
    timestamp: number;
    type: EventType;
    agentId: string;
    locationId: string;
    description: string;
    data: Record<string, any>;
}

export enum EventType {
    AGENT_JOINED = 'agent_joined',
    AGENT_MOVED = 'agent_moved',
    RESOURCE_GATHERED = 'resource_gathered',
    ITEM_CRAFTED = 'item_crafted',
    TRADE_COMPLETED = 'trade_completed',
    MON_EARNED = 'mon_earned',
    MON_SPENT = 'mon_spent'
}

export interface EconomicStats {
    totalMonInCirculation: number;
    totalMonEarned: number;
    totalMonSpent: number;
    totalTrades: number;
    totalResourcesGathered: number;
    totalItemsCrafted: number;
}

export interface AgentAction {
    agentId: string;
    type: ActionType;
    targetLocationId?: string;
    targetResourceType?: ResourceType;
    craftingRecipe?: string;
    tradeOffer?: TradeOffer;
}

export enum ActionType {
    MOVE = 'move',
    GATHER = 'gather',
    CRAFT = 'craft',
    TRADE = 'trade',
    REST = 'rest'
}

export interface TradeOffer {
    offeredItems: InventoryItem[];
    requestedItems: InventoryItem[];
    offeredMon: number;
    requestedMon: number;
    targetAgentId?: string;
}

export interface ActionResult {
    success: boolean;
    message: string;
    monEarned?: number;
    itemsGained?: InventoryItem[];
    newLocation?: string;
    data?: Record<string, any>;
}

export interface CraftingRecipe {
    id: string;
    name: string;
    requiredItems: { type: ResourceType; quantity: number }[];
    output: { type: ResourceType; quantity: number; quality: QualityTier };
    successRate: number;
    baseMonValue: number;
    skillRequired: number;
}

export interface MonTransaction {
    id: string;
    timestamp: number;
    fromAgentId: string;
    toAgentId: string;
    amount: number;
    reason: string;
    balanceAfter: number;
}
