/**
 * PvP Arena System
 * Wagered 1v1 combat with spectator betting
 */

export interface ArenaBattle {
    battleId: string;
    challenger: string;
    opponent: string | null;
    wager: number;
    spectatorPool: number;
    spectatorBets: Map<string, { betOn: string; amount: number }>;
    status: 'open' | 'active' | 'completed';
    winner: string | null;
    startTime: number;
    endTime?: number;
}

export interface CombatStats {
    attack: number;
    defense: number;
    health: number;
    critChance: number;
}

export class PvPArenaManager {
    private battles: Map<string, ArenaBattle> = new Map();
    private battleCounter: number = 0;

    /**
     * Create a new arena challenge
     */
    public createChallenge(challenger: string, wager: number): {
        success: boolean;
        battleId?: string;
        message: string;
    } {
        if (wager < 10) {
            return {
                success: false,
                message: 'Minimum wager is 10 MON'
            };
        }

        // Check if challenger is already in a battle
        const isBusy = Array.from(this.battles.values()).some(b =>
            (b.challenger === challenger || b.opponent === challenger) &&
            (b.status === 'open' || b.status === 'active')
        );

        if (isBusy) {
            return {
                success: false,
                message: 'You are already in a battle or have an open challenge'
            };
        }

        const battleId = `battle_${++this.battleCounter}`;
        const battle: ArenaBattle = {
            battleId,
            challenger,
            opponent: null,
            wager,
            spectatorPool: 0,
            spectatorBets: new Map(),
            status: 'open',
            winner: null,
            startTime: Date.now()
        };

        this.battles.set(battleId, battle);

        return {
            success: true,
            battleId,
            message: `Arena challenge created! Wager: ${wager} MON`
        };
    }

    /**
     * Accept an arena challenge
     */
    public acceptChallenge(battleId: string, opponent: string): {
        success: boolean;
        message: string;
    } {
        const battle = this.battles.get(battleId);

        if (!battle) {
            return { success: false, message: 'Battle not found' };
        }

        if (battle.status !== 'open') {
            return { success: false, message: 'Battle is not open' };
        }

        if (battle.challenger === opponent) {
            return { success: false, message: 'Cannot challenge yourself' };
        }

        // Check if opponent is already in a battle
        const isBusy = Array.from(this.battles.values()).some(b =>
            (b.challenger === opponent || b.opponent === opponent) &&
            (b.status === 'open' || b.status === 'active')
        );

        if (isBusy) {
            return {
                success: false,
                message: 'You are already in a battle'
            };
        }

        battle.opponent = opponent;
        battle.status = 'active';

        return {
            success: true,
            message: 'Challenge accepted! Battle begins!'
        };
    }

    /**
     * Simulate combat between two agents
     */
    /**
     * Simulate combat between two agents
     */
    public simulateCombat(battleId: string, challengerAgent: any, opponentAgent: any): {
        success: boolean;
        winner?: string;
        log?: string[];
        message: string;
    } {
        const battle = this.battles.get(battleId);

        if (!battle || battle.status !== 'active' || !battle.opponent) {
            return { success: false, message: 'Invalid battle state' };
        }

        // Use REAL Agent Stats
        const challengerStats: CombatStats = {
            attack: challengerAgent.stats.attack,
            defense: challengerAgent.stats.defense,
            health: challengerAgent.stats.hp,
            critChance: 0.1 // Base 10%
        };

        const opponentStats: CombatStats = {
            attack: opponentAgent.stats.attack,
            defense: opponentAgent.stats.defense,
            health: opponentAgent.stats.hp,
            critChance: 0.1
        };

        const log: string[] = [];
        let round = 1;

        while (challengerStats.health > 0 && opponentStats.health > 0 && round <= 10) {
            // Challenger attacks
            const challengerDamage = Math.max(
                0,
                challengerStats.attack - opponentStats.defense + (Math.random() * 20 - 10)
            );
            const challengerCrit = Math.random() < challengerStats.critChance;
            const finalChallengerDamage = challengerCrit ? challengerDamage * 2 : challengerDamage;

            opponentStats.health -= finalChallengerDamage;
            log.push(`Round ${round}: ${battle.challenger} deals ${finalChallengerDamage.toFixed(1)} damage${challengerCrit ? ' (CRITICAL!)' : ''}`);

            if (opponentStats.health <= 0) break;

            // Opponent attacks
            const opponentDamage = Math.max(
                0,
                opponentStats.attack - challengerStats.defense + (Math.random() * 20 - 10)
            );
            const opponentCrit = Math.random() < opponentStats.critChance;
            const finalOpponentDamage = opponentCrit ? opponentDamage * 2 : opponentDamage;

            challengerStats.health -= finalOpponentDamage;
            log.push(`Round ${round}: ${battle.opponent} deals ${finalOpponentDamage.toFixed(1)} damage${opponentCrit ? ' (CRITICAL!)' : ''}`);

            round++;
        }

        // Determine winner
        const winner = challengerStats.health > opponentStats.health ? battle.challenger : battle.opponent;
        battle.winner = winner;
        battle.status = 'completed';
        battle.endTime = Date.now();

        log.push(`\nVICTOR: ${winner}!`);

        return {
            success: true,
            winner,
            log,
            message: `${winner} wins the arena battle!`
        };
    }

    /**
     * Place spectator bet
     */
    public placeBet(battleId: string, spectator: string, betOn: string, amount: number): {
        success: boolean;
        message: string;
    } {
        const battle = this.battles.get(battleId);

        if (!battle) {
            return { success: false, message: 'Battle not found' };
        }

        if (battle.status !== 'active') {
            return { success: false, message: 'Battle is not active' };
        }

        if (betOn !== battle.challenger && betOn !== battle.opponent) {
            return { success: false, message: 'Invalid bet target' };
        }

        battle.spectatorBets.set(spectator, { betOn, amount });
        battle.spectatorPool += amount;

        return {
            success: true,
            message: `Bet placed: ${amount} MON on ${betOn}`
        };
    }

    /**
     * Get battle status
     */
    public getBattle(battleId: string): ArenaBattle | null {
        return this.battles.get(battleId) || null;
    }

    /**
     * Get all open battles
     */
    public getOpenBattles(): ArenaBattle[] {
        return Array.from(this.battles.values())
            .filter(b => b.status === 'open');
    }

    /**
     * Get active battles
     */
    public getActiveBattles(): ArenaBattle[] {
        return Array.from(this.battles.values())
            .filter(b => b.status === 'active');
    }

    /**
     * Calculate payouts
     */
    public calculatePayouts(battleId: string): {
        winnerPayout: number;
        spectatorPayouts: Map<string, number>;
    } {
        const battle = this.battles.get(battleId);

        if (!battle || !battle.winner) {
            return {
                winnerPayout: 0,
                spectatorPayouts: new Map()
            };
        }

        // Winner gets 90% of wager pot (10% to treasury)
        const winnerPayout = battle.wager * 2 * 0.9;

        // Spectators who bet on winner split the spectator pool
        const winningBets = Array.from(battle.spectatorBets.entries())
            .filter(([_, bet]) => bet.betOn === battle.winner);

        const totalWinningBets = winningBets.reduce((sum, [_, bet]) => sum + bet.amount, 0);
        const spectatorPayouts = new Map<string, number>();

        winningBets.forEach(([spectator, bet]) => {
            const share = (bet.amount / totalWinningBets) * battle.spectatorPool;
            spectatorPayouts.set(spectator, share);
        });

        return {
            winnerPayout,
            spectatorPayouts
        };
    }
}

// Singleton instance
export const pvpArenaManager = new PvPArenaManager();
