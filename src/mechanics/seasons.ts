/**
 * Weekly Seasons System
 * Competitive cycles with leaderboards and prestige rewards
 */

export interface Season {
    seasonId: number;
    startTime: number;
    endTime: number;
    status: 'active' | 'completed';
    entryFeeMultiplier: number; // 1.0 on day 1, 0.2 on day 7
}

export interface SeasonLeaderboard {
    agentId: string;
    agentName: string;
    points: number;
    resourcesGathered: number;
    itemsCrafted: number;
    tradesCompleted: number;
    bossKills: number;
    prestigeLevel: number;
}

export class SeasonManager {
    private currentSeason: Season;
    private seasonCounter: number = 0;
    private leaderboard: Map<string, SeasonLeaderboard> = new Map();
    private prestigeLevels: Map<string, number> = new Map();

    private readonly SEASON_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
    private readonly BASE_ENTRY_FEE = 100;

    constructor() {
        this.currentSeason = this.createNewSeason();
    }

    /**
     * Create a new season
     */
    private createNewSeason(): Season {
        this.seasonCounter++;

        return {
            seasonId: this.seasonCounter,
            startTime: Date.now(),
            endTime: Date.now() + this.SEASON_DURATION,
            status: 'active',
            entryFeeMultiplier: 1.0
        };
    }

    /**
     * Get current season
     */
    public getCurrentSeason(): Season {
        // Check if season should end
        if (Date.now() >= this.currentSeason.endTime) {
            this.endSeason();
        }

        // Update entry fee multiplier based on day
        const daysPassed = (Date.now() - this.currentSeason.startTime) / (24 * 60 * 60 * 1000);
        this.currentSeason.entryFeeMultiplier = Math.max(0.2, 1.0 - (daysPassed / 7) * 0.8);

        return this.currentSeason;
    }

    /**
     * Get current entry fee
     */
    public getCurrentEntryFee(): number {
        const season = this.getCurrentSeason();
        return Math.floor(this.BASE_ENTRY_FEE * season.entryFeeMultiplier);
    }

    /**
     * Award points to agent
     */
    public awardPoints(agentId: string, agentName: string, points: number, category: 'gather' | 'craft' | 'trade' | 'boss'): void {
        let entry = this.leaderboard.get(agentId);

        if (!entry) {
            entry = {
                agentId,
                agentName,
                points: 0,
                resourcesGathered: 0,
                itemsCrafted: 0,
                tradesCompleted: 0,
                bossKills: 0,
                prestigeLevel: this.prestigeLevels.get(agentId) || 0
            };
            this.leaderboard.set(agentId, entry);
        }

        entry.points += points;

        // Update category stats
        switch (category) {
            case 'gather':
                entry.resourcesGathered++;
                break;
            case 'craft':
                entry.itemsCrafted++;
                break;
            case 'trade':
                entry.tradesCompleted++;
                break;
            case 'boss':
                entry.bossKills++;
                break;
        }
    }

    /**
     * Get leaderboard
     */
    public getLeaderboard(limit: number = 10): SeasonLeaderboard[] {
        return Array.from(this.leaderboard.values())
            .sort((a, b) => b.points - a.points)
            .slice(0, limit);
    }

    /**
     * Get agent rank
     */
    public getAgentRank(agentId: string): {
        rank: number;
        totalAgents: number;
        entry: SeasonLeaderboard | null;
    } {
        const sorted = Array.from(this.leaderboard.values())
            .sort((a, b) => b.points - a.points);

        const rank = sorted.findIndex(e => e.agentId === agentId) + 1;
        const entry = this.leaderboard.get(agentId) || null;

        return {
            rank: rank || 0,
            totalAgents: sorted.length,
            entry
        };
    }

    /**
     * End current season
     */
    private endSeason(): void {
        console.log(`\nSeason ${this.currentSeason.seasonId} has ended!`);

        // Award prestige to top 10
        const top10 = this.getLeaderboard(10);
        top10.forEach((entry, index) => {
            const prestigeGain = 10 - index; // 10 for 1st, 9 for 2nd, etc.
            const currentPrestige = this.prestigeLevels.get(entry.agentId) || 0;
            this.prestigeLevels.set(entry.agentId, currentPrestige + prestigeGain);

            console.log(`  ${index + 1}. ${entry.agentName} - ${entry.points} points (+${prestigeGain} prestige)`);
        });

        // Reset for new season
        this.currentSeason.status = 'completed';
        this.leaderboard.clear();
        this.currentSeason = this.createNewSeason();

        console.log(`\nSeason ${this.currentSeason.seasonId} begins!`);
    }

    /**
     * Get agent prestige
     */
    public getPrestige(agentId: string): number {
        return this.prestigeLevels.get(agentId) || 0;
    }

    /**
     * Get season summary
     */
    public getSeasonSummary(): {
        season: Season;
        entryFee: number;
        daysRemaining: number;
        topAgents: SeasonLeaderboard[];
        totalParticipants: number;
    } {
        const season = this.getCurrentSeason();
        const daysRemaining = Math.ceil((season.endTime - Date.now()) / (24 * 60 * 60 * 1000));

        return {
            season,
            entryFee: this.getCurrentEntryFee(),
            daysRemaining: Math.max(0, daysRemaining),
            topAgents: this.getLeaderboard(10),
            totalParticipants: this.leaderboard.size
        };
    }

    /**
     * Force end season (admin only)
     */
    public forceEndSeason(): void {
        this.endSeason();
    }
}

// Singleton instance
export const seasonManager = new SeasonManager();
