import { ResourceType, QualityTier } from '../types';

/**
 * Resource regeneration mechanics
 */
export function regenerateResources(
    currentAmount: number,
    maxAmount: number,
    regenerationRate: number,
    lastRegeneration: number
): { newAmount: number; newTimestamp: number } {
    const now = Date.now();
    const minutesPassed = (now - lastRegeneration) / 60000;
    const regenerated = Math.floor(minutesPassed * regenerationRate);
    const newAmount = Math.min(currentAmount + regenerated, maxAmount);

    return {
        newAmount,
        newTimestamp: now
    };
}

/**
 * Calculate resource gathering success
 */
export function attemptGather(
    resourceType: ResourceType,
    difficulty: number,
    agentSkill: number
): { success: boolean; quality: QualityTier; quantity: number } {
    const skillBonus = agentSkill / 100;
    const successChance = difficulty + skillBonus;
    const roll = Math.random();

    if (roll > successChance) {
        return { success: false, quality: QualityTier.COMMON, quantity: 0 };
    }

    // Determine quality based on how much we exceeded the threshold
    const excess = successChance - roll;
    let quality = QualityTier.COMMON;
    let quantity = 1;

    if (excess > 0.15) {
        quality = QualityTier.LEGENDARY;
        quantity = 3;
    } else if (excess > 0.08) {
        quality = QualityTier.RARE;
        quantity = 2;
    }

    return { success: true, quality, quantity };
}

/**
 * Get base MON value for a resource
 */
export function getResourceValue(
    resourceType: ResourceType,
    quality: QualityTier
): number {
    const baseValues: Record<ResourceType, number> = {
        [ResourceType.ORE]: 20,
        [ResourceType.WOOD]: 15,
        [ResourceType.HERBS]: 15,
        [ResourceType.TOOL]: 40,
        [ResourceType.POTION]: 35,
        [ResourceType.RARE_GEM]: 100
    };

    const qualityMultipliers: Record<QualityTier, number> = {
        [QualityTier.COMMON]: 1.0,
        [QualityTier.RARE]: 1.5,
        [QualityTier.LEGENDARY]: 2.5
    };

    return baseValues[resourceType] * qualityMultipliers[quality];
}

/**
 * Check if resource can be gathered from location
 */
export function canGatherResource(
    locationId: string,
    resourceType: ResourceType
): boolean {
    const gatherableResources: Record<string, ResourceType[]> = {
        mining_caves: [ResourceType.ORE, ResourceType.RARE_GEM],
        forest: [ResourceType.WOOD, ResourceType.HERBS],
        market_square: [],
        tavern: [],
        workshop: []
    };

    return gatherableResources[locationId]?.includes(resourceType) ?? false;
}
