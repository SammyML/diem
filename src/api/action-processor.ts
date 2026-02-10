import {
    AgentAction,
    ActionType,
    ActionResult,
    ResourceType,
    QualityTier,
    EventType
} from '../types';
import { WorldStateManager } from '../core/world-state';
import { TokenLedger } from '../token/token-ledger';
import {
    areLocationsConnected,
    getTravelTime,
    hasCapacity,
    getLocation
} from '../mechanics/locations';
import {
    canGatherResource,
    attemptGather,
    getResourceValue
} from '../mechanics/resources';
import {
    getRecipe,
    attemptCraft
} from '../mechanics/crafting';
import { v4 as uuidv4 } from 'uuid';

/**
 * Action processor - validates and executes agent actions
 */
export class ActionProcessor {
    constructor(
        private worldState: WorldStateManager,
        private tokenLedger: TokenLedger
    ) { }

    /**
     * Process an agent action
     */
    public async processAction(action: AgentAction): Promise<ActionResult> {
        const agent = this.worldState.getAgent(action.agentId);
        if (!agent) {
            return {
                success: false,
                message: 'Agent not found'
            };
        }

        switch (action.type) {
            case ActionType.MOVE:
                return this.processMove(action);
            case ActionType.GATHER:
                return this.processGather(action);
            case ActionType.CRAFT:
                return this.processCraft(action);
            case ActionType.TRADE:
                return this.processTrade(action);
            case ActionType.REST:
                return this.processRest(action);
            default:
                return {
                    success: false,
                    message: 'Unknown action type'
                };
        }
    }

    /**
     * Process movement action
     */
    private processMove(action: AgentAction): ActionResult {
        if (!action.targetLocationId) {
            return { success: false, message: 'Target location not specified' };
        }

        const agent = this.worldState.getAgent(action.agentId)!;
        const currentLocationId = agent.locationId;
        const targetLocationId = action.targetLocationId;

        // Check if locations are connected
        if (!areLocationsConnected(currentLocationId, targetLocationId)) {
            return {
                success: false,
                message: 'Locations are not connected'
            };
        }

        // Check target location capacity
        const targetLocation = this.worldState.getLocation(targetLocationId);
        if (!targetLocation || !hasCapacity(targetLocation)) {
            return {
                success: false,
                message: 'Target location is at full capacity'
            };
        }

        // Execute move
        const moved = this.worldState.moveAgent(action.agentId, targetLocationId);
        if (!moved) {
            return { success: false, message: 'Failed to move agent' };
        }

        const travelTime = getTravelTime(currentLocationId, targetLocationId);

        return {
            success: true,
            message: `Moved to ${targetLocation.name}`,
            newLocation: targetLocationId,
            data: { travelTime }
        };
    }

    /**
     * Process resource gathering action
     */
    private async processGather(action: AgentAction): Promise<ActionResult> {
        if (!action.targetResourceType) {
            return { success: false, message: 'Resource type not specified' };
        }

        const agent = this.worldState.getAgent(action.agentId)!;
        const location = this.worldState.getLocation(agent.locationId);

        if (!location) {
            return { success: false, message: 'Invalid location' };
        }

        // Check if resource can be gathered here
        if (!canGatherResource(agent.locationId, action.targetResourceType)) {
            return {
                success: false,
                message: `Cannot gather ${action.targetResourceType} at ${location.name}`
            };
        }

        // Get location properties
        const difficulty = location.properties.gatherDifficulty || 0.5;
        const gatherTime = location.properties.gatherTime || 5000;
        const monReward = location.properties.monReward || 10;

        // Determine skill based on resource type
        let skill = 0;
        if (action.targetResourceType === ResourceType.ORE ||
            action.targetResourceType === ResourceType.RARE_GEM) {
            skill = agent.stats.miningSkill;
        } else {
            skill = agent.stats.gatheringSkill;
        }

        // Simulate gathering time
        await new Promise(resolve => setTimeout(resolve, Math.min(gatherTime, 100)));

        // Attempt to gather
        const result = attemptGather(action.targetResourceType, difficulty, skill);

        if (!result.success) {
            // Gain small skill increase even on failure
            const skillUpdate = action.targetResourceType === ResourceType.ORE ||
                action.targetResourceType === ResourceType.RARE_GEM
                ? { miningSkill: agent.stats.miningSkill + 1 }
                : { gatheringSkill: agent.stats.gatheringSkill + 1 };

            this.worldState.updateStats(action.agentId, skillUpdate);

            return {
                success: false,
                message: 'Failed to gather resource'
            };
        }

        // Add to inventory
        this.worldState.addToInventory(
            action.agentId,
            action.targetResourceType,
            result.quantity,
            result.quality
        );

        // Award MON
        const monEarned = Math.floor(monReward * result.quantity);
        this.tokenLedger.award(action.agentId, monEarned, 'Resource gathering');
        this.worldState.updateMonBalance(action.agentId, monEarned, 'gathering');

        // Update stats
        const skillUpdate = action.targetResourceType === ResourceType.ORE ||
            action.targetResourceType === ResourceType.RARE_GEM
            ? {
                miningSkill: agent.stats.miningSkill + 2,
                totalActions: agent.stats.totalActions + 1
            }
            : {
                gatheringSkill: agent.stats.gatheringSkill + 2,
                totalActions: agent.stats.totalActions + 1
            };

        this.worldState.updateStats(action.agentId, skillUpdate);

        // Update economic stats
        const state = this.worldState.getState();
        this.worldState.updateEconomicStats({
            totalResourcesGathered: state.economicStats.totalResourcesGathered + result.quantity,
            totalMonInCirculation: state.economicStats.totalMonInCirculation + monEarned
        });

        return {
            success: true,
            message: `Gathered ${result.quantity}x ${result.quality} ${action.targetResourceType}`,
            monEarned,
            itemsGained: [{
                resourceType: action.targetResourceType,
                quantity: result.quantity,
                quality: result.quality
            }],
            data: { quality: result.quality }
        };
    }

    /**
     * Process crafting action
     */
    private processCraft(action: AgentAction): ActionResult {
        if (!action.craftingRecipe) {
            return { success: false, message: 'Crafting recipe not specified' };
        }

        const agent = this.worldState.getAgent(action.agentId)!;
        const location = this.worldState.getLocation(agent.locationId);

        if (!location || !location.properties.allowsCrafting) {
            return {
                success: false,
                message: 'Cannot craft at this location'
            };
        }

        const recipe = getRecipe(action.craftingRecipe);
        if (!recipe) {
            return { success: false, message: 'Invalid recipe' };
        }

        // Check if agent has required items
        for (const required of recipe.requiredItems) {
            const hasItem = agent.inventory.some(
                item => item.resourceType === required.type &&
                    item.quantity >= required.quantity
            );

            if (!hasItem) {
                return {
                    success: false,
                    message: `Missing required item: ${required.quantity}x ${required.type}`
                };
            }
        }

        // Attempt craft
        const craftResult = attemptCraft(recipe, agent.stats.craftingSkill);

        if (!craftResult.success) {
            // Remove materials even on failure (they were consumed)
            for (const required of recipe.requiredItems) {
                this.worldState.removeFromInventory(
                    action.agentId,
                    required.type,
                    required.quantity,
                    QualityTier.COMMON // Remove common quality first
                );
            }

            // Update skill
            this.worldState.updateStats(action.agentId, {
                craftingSkill: agent.stats.craftingSkill + craftResult.skillGain,
                totalActions: agent.stats.totalActions + 1
            });

            return {
                success: false,
                message: 'Crafting failed, materials consumed'
            };
        }

        // Remove required materials
        for (const required of recipe.requiredItems) {
            this.worldState.removeFromInventory(
                action.agentId,
                required.type,
                required.quantity,
                QualityTier.COMMON
            );
        }

        // Add crafted item
        this.worldState.addToInventory(
            action.agentId,
            recipe.output.type,
            recipe.output.quantity,
            recipe.output.quality
        );

        // Award MON
        const monEarned = recipe.baseMonValue;
        this.tokenLedger.award(action.agentId, monEarned, 'Crafting');
        this.worldState.updateMonBalance(action.agentId, monEarned, 'crafting');

        // Update stats
        this.worldState.updateStats(action.agentId, {
            craftingSkill: agent.stats.craftingSkill + craftResult.skillGain,
            totalActions: agent.stats.totalActions + 1
        });

        // Update economic stats
        const state = this.worldState.getState();
        this.worldState.updateEconomicStats({
            totalItemsCrafted: state.economicStats.totalItemsCrafted + 1,
            totalMonInCirculation: state.economicStats.totalMonInCirculation + monEarned
        });

        return {
            success: true,
            message: `Crafted ${recipe.output.quantity}x ${recipe.output.quality} ${recipe.output.type}`,
            monEarned,
            itemsGained: [{
                resourceType: recipe.output.type,
                quantity: recipe.output.quantity,
                quality: recipe.output.quality
            }]
        };
    }

    /**
     * Process trade action
     */
    private processTrade(action: AgentAction): ActionResult {
        // Simplified trade - just sell items for MON
        const agent = this.worldState.getAgent(action.agentId)!;

        if (!action.tradeOffer || !action.tradeOffer.offeredItems ||
            action.tradeOffer.offeredItems.length === 0) {
            return { success: false, message: 'No items offered for trade' };
        }

        let totalValue = 0;

        // Calculate value and check inventory
        for (const item of action.tradeOffer.offeredItems) {
            const hasItem = agent.inventory.find(
                inv => inv.resourceType === item.resourceType &&
                    inv.quality === item.quality &&
                    inv.quantity >= item.quantity
            );

            if (!hasItem) {
                return {
                    success: false,
                    message: `Don't have ${item.quantity}x ${item.quality} ${item.resourceType}`
                };
            }

            totalValue += getResourceValue(item.resourceType, item.quality) * item.quantity;
        }

        // Remove items from inventory
        for (const item of action.tradeOffer.offeredItems) {
            this.worldState.removeFromInventory(
                action.agentId,
                item.resourceType,
                item.quantity,
                item.quality
            );
        }

        // Award MON
        this.tokenLedger.award(action.agentId, totalValue, 'Selling items');
        this.worldState.updateMonBalance(action.agentId, totalValue, 'trade');

        // Update stats
        this.worldState.updateStats(action.agentId, {
            tradingSkill: agent.stats.tradingSkill + 1,
            totalActions: agent.stats.totalActions + 1
        });

        // Update economic stats
        // Update economic stats
        const state = this.worldState.getState();
        this.worldState.updateEconomicStats({
            totalTrades: state.economicStats.totalTrades + 1,
            totalMonInCirculation: state.economicStats.totalMonInCirculation + totalValue
        });

        return {
            success: true,
            message: `Sold items for ${totalValue} MON`,
            monEarned: totalValue
        };
    }

    /**
     * Process rest action
     */
    private processRest(action: AgentAction): ActionResult {
        const agent = this.worldState.getAgent(action.agentId)!;
        const location = this.worldState.getLocation(agent.locationId);

        if (!location || !location.properties.isSafeZone) {
            return {
                success: false,
                message: 'Cannot rest at this location'
            };
        }

        // Small skill boost
        const restBonus = location.properties.restBonus || 1.1;
        const skillBoost = Math.floor(agent.stats.totalActions * 0.01 * restBonus);

        this.worldState.updateStats(action.agentId, {
            miningSkill: agent.stats.miningSkill + skillBoost,
            gatheringSkill: agent.stats.gatheringSkill + skillBoost,
            craftingSkill: agent.stats.craftingSkill + skillBoost,
            totalActions: agent.stats.totalActions + 1
        });

        return {
            success: true,
            message: `Rested at ${location.name}, skills slightly improved`,
            data: { skillBoost }
        };
    }
}


