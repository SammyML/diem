import { ethers } from 'ethers';

/**
 * World Boss State Manager
 * Manages The Titan boss encounters and coordinates agent attacks
 */

export interface BossState {
    bossId: number;
    currentHealth: number;
    maxHealth: number;
    prizePool: string;
    participants: string[];
    isActive: boolean;
    isDefeated: boolean;
    spawnTime: number;
    defeatTime?: number;
}

export interface BossAttack {
    attacker: string;
    damage: number;
    timestamp: number;
}

export class WorldBossManager {
    private bossState: BossState | null = null;
    private recentAttacks: BossAttack[] = [];
    private readonly MAX_ATTACK_HISTORY = 50;

    constructor() {
        this.initializeBoss();
    }

    /**
     * Initialize boss state
     */
    private initializeBoss(): void {
        this.bossState = {
            bossId: 1,
            currentHealth: 10000,
            maxHealth: 10000,
            prizePool: '0',
            participants: [],
            isActive: true,
            isDefeated: false,
            spawnTime: Date.now()
        };
    }

    /**
     * Process boss attack
     */
    public attackBoss(attacker: string, damage: number): {
        success: boolean;
        remainingHealth: number;
        isDefeated: boolean;
        message: string;
    } {
        if (!this.bossState || !this.bossState.isActive) {
            return {
                success: false,
                remainingHealth: 0,
                isDefeated: false,
                message: 'Boss is not active'
            };
        }

        if (this.bossState.isDefeated) {
            return {
                success: false,
                remainingHealth: 0,
                isDefeated: true,
                message: 'Boss is already defeated'
            };
        }

        // Clamp damage to valid range
        const actualDamage = Math.max(10, Math.min(100, damage));

        // Track participant
        if (!this.bossState.participants.includes(attacker)) {
            this.bossState.participants.push(attacker);
        }

        // Apply damage
        this.bossState.currentHealth = Math.max(0, this.bossState.currentHealth - actualDamage);

        // Record attack
        this.recentAttacks.push({
            attacker,
            damage: actualDamage,
            timestamp: Date.now()
        });

        // Keep only recent attacks
        if (this.recentAttacks.length > this.MAX_ATTACK_HISTORY) {
            this.recentAttacks.shift();
        }

        // Check if defeated
        if (this.bossState.currentHealth === 0) {
            this.bossState.isDefeated = true;
            this.bossState.defeatTime = Date.now();
        }

        return {
            success: true,
            remainingHealth: this.bossState.currentHealth,
            isDefeated: this.bossState.isDefeated,
            message: this.bossState.isDefeated
                ? `The Titan has been defeated! ${this.bossState.participants.length} agents participated.`
                : `Dealt ${actualDamage} damage to The Titan! ${this.bossState.currentHealth}/${this.bossState.maxHealth} HP remaining.`
        };
    }

    /**
     * Spawn new boss
     */
    public spawnBoss(): void {
        if (this.bossState) {
            this.bossState.bossId++;
        }

        this.bossState = {
            bossId: this.bossState ? this.bossState.bossId : 1,
            currentHealth: 10000,
            maxHealth: 10000,
            prizePool: '0',
            participants: [],
            isActive: true,
            isDefeated: false,
            spawnTime: Date.now()
        };

        this.recentAttacks = [];
    }

    /**
     * Get current boss state
     */
    public getBossState(): BossState | null {
        return this.bossState;
    }

    /**
     * Get recent attacks
     */
    public getRecentAttacks(): BossAttack[] {
        return this.recentAttacks.slice(-20); // Return last 20 attacks
    }

    /**
     * Calculate health percentage
     */
    public getHealthPercentage(): number {
        if (!this.bossState) return 0;
        return (this.bossState.currentHealth / this.bossState.maxHealth) * 100;
    }

    /**
     * Check if boss should respawn
     */
    public shouldRespawn(): boolean {
        if (!this.bossState || !this.bossState.isDefeated || !this.bossState.defeatTime) {
            return false;
        }

        const RESPAWN_COOLDOWN = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
        const timeSinceDefeat = Date.now() - this.bossState.defeatTime;

        return timeSinceDefeat >= RESPAWN_COOLDOWN;
    }

    /**
     * Get time until respawn
     */
    public getTimeUntilRespawn(): number {
        if (!this.bossState || !this.bossState.isDefeated || !this.bossState.defeatTime) {
            return 0;
        }

        const RESPAWN_COOLDOWN = 2 * 60 * 60 * 1000; // 2 hours
        const timeSinceDefeat = Date.now() - this.bossState.defeatTime;
        const timeRemaining = RESPAWN_COOLDOWN - timeSinceDefeat;

        return Math.max(0, timeRemaining);
    }

    /**
     * Get boss summary for dashboard
     */
    public getBossSummary(): {
        name: string;
        health: number;
        maxHealth: number;
        healthPercent: number;
        participants: number;
        status: 'active' | 'defeated' | 'respawning';
        timeUntilRespawn?: number;
    } {
        if (!this.bossState) {
            return {
                name: 'The Titan',
                health: 0,
                maxHealth: 10000,
                healthPercent: 0,
                participants: 0,
                status: 'respawning'
            };
        }

        let status: 'active' | 'defeated' | 'respawning' = 'active';
        if (this.bossState.isDefeated) {
            status = this.shouldRespawn() ? 'respawning' : 'defeated';
        }

        return {
            name: 'The Titan',
            health: this.bossState.currentHealth,
            maxHealth: this.bossState.maxHealth,
            healthPercent: this.getHealthPercentage(),
            participants: this.bossState.participants.length,
            status,
            timeUntilRespawn: status === 'defeated' ? this.getTimeUntilRespawn() : undefined
        };
    }
}

// Singleton instance
export const worldBossManager = new WorldBossManager();
