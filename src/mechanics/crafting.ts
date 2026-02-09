import { CraftingRecipe, ResourceType, QualityTier } from '../types';

/**
 * Available crafting recipes
 */
export const CRAFTING_RECIPES: CraftingRecipe[] = [
    {
        id: 'craft_tool',
        name: 'Iron Tool',
        requiredItems: [
            { type: ResourceType.ORE, quantity: 2 },
            { type: ResourceType.WOOD, quantity: 1 }
        ],
        output: {
            type: ResourceType.TOOL,
            quantity: 1,
            quality: QualityTier.COMMON
        },
        successRate: 0.8,
        baseMonValue: 40,
        skillRequired: 0
    },
    {
        id: 'craft_potion',
        name: 'Healing Potion',
        requiredItems: [
            { type: ResourceType.HERBS, quantity: 3 }
        ],
        output: {
            type: ResourceType.POTION,
            quantity: 1,
            quality: QualityTier.COMMON
        },
        successRate: 0.75,
        baseMonValue: 35,
        skillRequired: 0
    },
    {
        id: 'craft_rare_tool',
        name: 'Masterwork Tool',
        requiredItems: [
            { type: ResourceType.ORE, quantity: 3 },
            { type: ResourceType.WOOD, quantity: 2 },
            { type: ResourceType.RARE_GEM, quantity: 1 }
        ],
        output: {
            type: ResourceType.TOOL,
            quantity: 1,
            quality: QualityTier.RARE
        },
        successRate: 0.6,
        baseMonValue: 100,
        skillRequired: 30
    },
    {
        id: 'craft_rare_potion',
        name: 'Greater Potion',
        requiredItems: [
            { type: ResourceType.HERBS, quantity: 5 },
            { type: ResourceType.RARE_GEM, quantity: 1 }
        ],
        output: {
            type: ResourceType.POTION,
            quantity: 1,
            quality: QualityTier.RARE
        },
        successRate: 0.65,
        baseMonValue: 85,
        skillRequired: 25
    }
];

/**
 * Get recipe by ID
 */
export function getRecipe(recipeId: string): CraftingRecipe | undefined {
    return CRAFTING_RECIPES.find(r => r.id === recipeId);
}

/**
 * Attempt to craft an item
 */
export function attemptCraft(
    recipe: CraftingRecipe,
    agentSkill: number
): { success: boolean; skillGain: number } {
    if (agentSkill < recipe.skillRequired) {
        return { success: false, skillGain: 0 };
    }

    const skillBonus = (agentSkill - recipe.skillRequired) / 100;
    const successChance = Math.min(recipe.successRate + skillBonus, 0.95);
    const success = Math.random() < successChance;

    // Gain skill even on failure, but more on success
    const skillGain = success ? 2 : 1;

    return { success, skillGain };
}

/**
 * Get all recipes available to an agent based on skill
 */
export function getAvailableRecipes(craftingSkill: number): CraftingRecipe[] {
    return CRAFTING_RECIPES.filter(r => r.skillRequired <= craftingSkill);
}
