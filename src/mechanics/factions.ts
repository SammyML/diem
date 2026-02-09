/**
 * Faction System for Diem
 * Three competing factions with unique bonuses and strategic choices
 */

export enum Faction {
    WARDENS = 'wardens',
    CULT = 'cult',
    SALVAGERS = 'salvagers',
    NONE = 'none'
}

export interface FactionStats {
    faction: Faction;
    memberCount: number;
    totalPoints: number;
    weeklyPoints: number;
}

export interface FactionBonus {
    gatheringSpeed: number;  // Multiplier (1.0 = normal, 1.2 = +20%)
    combatDamage: number;    // Multiplier
    tradingRewards: number;  // Multiplier
    craftingSpeed: number;   // Multiplier
    movementSpeed: number;   // Multiplier
    rareLootChance: number;  // Multiplier
}

export const FACTION_BONUSES: Record<Faction, FactionBonus> = {
    [Faction.WARDENS]: {
        gatheringSpeed: 1.2,    // +20% gathering
        combatDamage: 0.9,      // -10% combat
        tradingRewards: 1.0,
        craftingSpeed: 1.0,
        movementSpeed: 1.0,
        rareLootChance: 1.0
    },
    [Faction.CULT]: {
        gatheringSpeed: 1.0,
        combatDamage: 1.0,
        tradingRewards: 1.15,   // +15% trading
        craftingSpeed: 0.95,    // -5% crafting
        movementSpeed: 1.0,
        rareLootChance: 1.0
    },
    [Faction.SALVAGERS]: {
        gatheringSpeed: 1.0,
        combatDamage: 1.0,
        tradingRewards: 1.0,
        craftingSpeed: 1.0,
        movementSpeed: 0.85,    // -15% movement
        rareLootChance: 1.25    // +25% rare loot
    },
    [Faction.NONE]: {
        gatheringSpeed: 1.0,
        combatDamage: 1.0,
        tradingRewards: 1.0,
        craftingSpeed: 1.0,
        movementSpeed: 1.0,
        rareLootChance: 1.0
    }
};

export const FACTION_DESCRIPTIONS: Record<Faction, string> = {
    [Faction.WARDENS]: 'The Wardens - Protectors of nature, masters of resource gathering',
    [Faction.CULT]: 'The Cult of Profit - Shrewd traders who maximize economic gains',
    [Faction.SALVAGERS]: 'The Salvagers - Treasure hunters seeking rare and valuable items',
    [Faction.NONE]: 'No faction - Independent agent with no bonuses'
};

export class FactionManager {
    private agentFactions: Map<string, Faction> = new Map();
    private factionStats: Map<Faction, FactionStats> = new Map();
    private factionPoints: Map<string, number> = new Map(); // agentId -> points

    constructor() {
        // Initialize faction stats
        this.factionStats.set(Faction.WARDENS, {
            faction: Faction.WARDENS,
            memberCount: 0,
            totalPoints: 0,
            weeklyPoints: 0
        });
        this.factionStats.set(Faction.CULT, {
            faction: Faction.CULT,
            memberCount: 0,
            totalPoints: 0,
            weeklyPoints: 0
        });
        this.factionStats.set(Faction.SALVAGERS, {
            faction: Faction.SALVAGERS,
            memberCount: 0,
            totalPoints: 0,
            weeklyPoints: 0
        });
    }

    /**
     * Join a faction
     */
    public joinFaction(agentId: string, faction: Faction): {
        success: boolean;
        message: string;
        bonuses?: FactionBonus;
    } {
        if (faction === Faction.NONE) {
            return {
                success: false,
                message: 'Cannot join "none" faction'
            };
        }

        const currentFaction = this.agentFactions.get(agentId);

        // Leave current faction if any
        if (currentFaction && currentFaction !== Faction.NONE) {
            const stats = this.factionStats.get(currentFaction);
            if (stats) {
                stats.memberCount--;
            }
        }

        // Join new faction
        this.agentFactions.set(agentId, faction);
        const stats = this.factionStats.get(faction);
        if (stats) {
            stats.memberCount++;
        }

        this.factionPoints.set(agentId, 0);

        return {
            success: true,
            message: `Joined ${FACTION_DESCRIPTIONS[faction]}`,
            bonuses: FACTION_BONUSES[faction]
        };
    }

    /**
     * Get agent's faction
     */
    public getAgentFaction(agentId: string): Faction {
        return this.agentFactions.get(agentId) || Faction.NONE;
    }

    /**
     * Get faction bonuses for an agent
     */
    public getFactionBonuses(agentId: string): FactionBonus {
        const faction = this.getAgentFaction(agentId);
        return FACTION_BONUSES[faction];
    }

    /**
     * Award faction points
     */
    public awardPoints(agentId: string, points: number): void {
        const faction = this.getAgentFaction(agentId);
        if (faction === Faction.NONE) return;

        // Update agent points
        const currentPoints = this.factionPoints.get(agentId) || 0;
        this.factionPoints.set(agentId, currentPoints + points);

        // Update faction stats
        const stats = this.factionStats.get(faction);
        if (stats) {
            stats.totalPoints += points;
            stats.weeklyPoints += points;
        }
    }

    /**
     * Get faction leaderboard
     */
    public getFactionLeaderboard(): FactionStats[] {
        return Array.from(this.factionStats.values())
            .sort((a, b) => b.totalPoints - a.totalPoints);
    }

    /**
     * Get agent faction points
     */
    public getAgentPoints(agentId: string): number {
        return this.factionPoints.get(agentId) || 0;
    }

    /**
     * Reset weekly points (called at season end)
     */
    public resetWeeklyPoints(): void {
        this.factionStats.forEach(stats => {
            stats.weeklyPoints = 0;
        });
    }

    /**
     * Get faction summary
     */
    public getFactionSummary(): {
        factions: FactionStats[];
        totalMembers: number;
    } {
        const factions = this.getFactionLeaderboard();
        const totalMembers = factions.reduce((sum, f) => sum + f.memberCount, 0);

        return {
            factions,
            totalMembers
        };
    }

    /**
     * Apply faction bonus to a value
     */
    public applyBonus(agentId: string, bonusType: keyof FactionBonus, baseValue: number): number {
        const bonuses = this.getFactionBonuses(agentId);
        const multiplier = bonuses[bonusType];
        return Math.floor(baseValue * multiplier);
    }
}

// Singleton instance
export const factionManager = new FactionManager();
