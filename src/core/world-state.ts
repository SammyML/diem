import {
    WorldState,
    Location,
    Agent,
    WorldEvent,
    EconomicStats,
    EventType,
    AgentStats,
    ResourceType,
    QualityTier
} from '../types';
import { LOCATIONS } from '../mechanics/locations';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Central world state manager
 */
export class WorldStateManager {
    private state: WorldState;
    private stateFilePath: string;
    private eventListeners: Map<EventType, ((event: WorldEvent) => void)[]>;

    constructor(dataDir: string = './data') {
        this.stateFilePath = path.join(dataDir, 'world-state.json');
        this.eventListeners = new Map();
        this.state = this.loadState();
    }

    /**
     * Initialize or load world state
     */
    private loadState(): WorldState {
        // Ensure data directory exists
        const dataDir = path.dirname(this.stateFilePath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Try to load existing state
        if (fs.existsSync(this.stateFilePath)) {
            try {
                const data = fs.readFileSync(this.stateFilePath, 'utf-8');
                const parsed = JSON.parse(data);

                // Convert plain objects back to Maps
                return {
                    locations: new Map(Object.entries(parsed.locations)),
                    agents: new Map(Object.entries(parsed.agents)),
                    events: parsed.events,
                    economicStats: parsed.economicStats,
                    startTime: parsed.startTime,
                    lastUpdate: parsed.lastUpdate
                };
            } catch (error) {
                console.error('Failed to load state, creating new:', error);
            }
        }

        // Create fresh state
        return this.createFreshState();
    }

    /**
     * Create a fresh world state
     */
    private createFreshState(): WorldState {
        const locations = new Map<string, Location>();
        LOCATIONS.forEach(loc => {
            locations.set(loc.id, { ...loc });
        });

        return {
            locations,
            agents: new Map(),
            events: [],
            economicStats: {
                totalMonInCirculation: 0,
                totalMonEarned: 0,
                totalMonSpent: 0,
                totalTrades: 0,
                totalResourcesGathered: 0,
                totalItemsCrafted: 0
            },
            startTime: Date.now(),
            lastUpdate: Date.now()
        };
    }

    /**
     * Save state to disk
     */
    public saveState(): void {
        try {
            // Convert Maps to plain objects for JSON serialization
            const serializable = {
                locations: Object.fromEntries(this.state.locations),
                agents: Object.fromEntries(this.state.agents),
                events: this.state.events.slice(-1000), // Keep last 1000 events
                economicStats: this.state.economicStats,
                startTime: this.state.startTime,
                lastUpdate: this.state.lastUpdate
            };

            fs.writeFileSync(
                this.stateFilePath,
                JSON.stringify(serializable, null, 2),
                'utf-8'
            );
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }

    /**
     * Get current world state (read-only)
     */
    public getState(): Readonly<WorldState> {
        return this.state;
    }

    /**
     * Add a new agent to the world
     */
    public addAgent(name: string, initialMon: number = 0): Agent {
        const agent: Agent = {
            id: uuidv4(),
            name,
            locationId: 'market_square', // All agents start at market
            monBalance: initialMon,
            inventory: [],
            stats: {
                miningSkill: 0,
                gatheringSkill: 0,
                craftingSkill: 0,
                tradingSkill: 0,
                totalActions: 0
            },
            joinedAt: Date.now(),
            lastAction: Date.now()
        };

        this.state.agents.set(agent.id, agent);

        // Update location occupancy
        const location = this.state.locations.get('market_square');
        if (location) {
            location.currentOccupancy++;
        }

        this.emitEvent({
            id: uuidv4(),
            timestamp: Date.now(),
            type: EventType.AGENT_JOINED,
            agentId: agent.id,
            locationId: 'market_square',
            description: `${name} has entered the world`,
            data: { initialMon }
        });

        this.saveState();

        // Update total MON in circulation
        if (initialMon > 0) {
            this.state.economicStats.totalMonInCirculation += initialMon;
            this.saveState();
        }

        return agent;
    }

    /**
     * Get agent by ID
     */
    public getAgent(agentId: string): Agent | undefined {
        return this.state.agents.get(agentId);
    }

    /**
     * Get all agents
     */
    public getAllAgents(): Agent[] {
        return Array.from(this.state.agents.values());
    }

    /**
     * Update agent directly (used for syncing)
     */
    public updateAgent(agentId: string, agent: Agent): void {
        this.state.agents.set(agentId, agent);
        this.saveState();
    }

    /**
     * Update agent location
     */
    public moveAgent(agentId: string, newLocationId: string): boolean {
        const agent = this.state.agents.get(agentId);
        if (!agent) return false;

        const oldLocation = this.state.locations.get(agent.locationId);
        const newLocation = this.state.locations.get(newLocationId);

        if (!newLocation) return false;

        // Update occupancy
        if (oldLocation) {
            oldLocation.currentOccupancy--;
        }
        newLocation.currentOccupancy++;

        agent.locationId = newLocationId;
        agent.lastAction = Date.now();

        this.emitEvent({
            id: uuidv4(),
            timestamp: Date.now(),
            type: EventType.AGENT_MOVED,
            agentId,
            locationId: newLocationId,
            description: `${agent.name} moved to ${newLocation.name}`,
            data: { from: oldLocation?.id, to: newLocationId }
        });

        this.saveState();
        return true;
    }

    /**
     * Update agent MON balance
     */
    public updateMonBalance(agentId: string, delta: number, reason: string): boolean {
        const agent = this.state.agents.get(agentId);
        if (!agent) return false;

        agent.monBalance += delta;

        if (delta > 0) {
            this.state.economicStats.totalMonEarned += delta;
            this.emitEvent({
                id: uuidv4(),
                timestamp: Date.now(),
                type: EventType.MON_EARNED,
                agentId,
                locationId: agent.locationId,
                description: `${agent.name} earned ${delta} MON (${reason})`,
                data: { amount: delta, reason, newBalance: agent.monBalance }
            });
        } else {
            this.state.economicStats.totalMonSpent += Math.abs(delta);
            this.emitEvent({
                id: uuidv4(),
                timestamp: Date.now(),
                type: EventType.MON_SPENT,
                agentId,
                locationId: agent.locationId,
                description: `${agent.name} spent ${Math.abs(delta)} MON (${reason})`,
                data: { amount: delta, reason, newBalance: agent.monBalance }
            });
        }

        this.saveState();
        return true;
    }

    /**
     * Add item to agent inventory
     */
    public addToInventory(
        agentId: string,
        resourceType: ResourceType,
        quantity: number,
        quality: QualityTier
    ): boolean {
        const agent = this.state.agents.get(agentId);
        if (!agent) return false;

        const existingItem = agent.inventory.find(
            item => item.resourceType === resourceType && item.quality === quality
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            agent.inventory.push({ resourceType, quantity, quality });
        }

        this.saveState();
        return true;
    }

    /**
     * Remove item from agent inventory
     */
    public removeFromInventory(
        agentId: string,
        resourceType: ResourceType,
        quantity: number,
        quality: QualityTier
    ): boolean {
        const agent = this.state.agents.get(agentId);
        if (!agent) return false;

        const itemIndex = agent.inventory.findIndex(
            item => item.resourceType === resourceType && item.quality === quality
        );

        if (itemIndex === -1) return false;

        const item = agent.inventory[itemIndex];
        if (item.quantity < quantity) return false;

        item.quantity -= quantity;
        if (item.quantity === 0) {
            agent.inventory.splice(itemIndex, 1);
        }

        this.saveState();
        return true;
    }

    /**
     * Update agent stats
     */
    public updateStats(agentId: string, updates: Partial<AgentStats>): boolean {
        const agent = this.state.agents.get(agentId);
        if (!agent) return false;

        Object.assign(agent.stats, updates);
        this.saveState();
        return true;
    }

    /**
     * Emit a world event
     */
    private emitEvent(event: WorldEvent): void {
        this.state.events.push(event);
        this.state.lastUpdate = Date.now();

        // Notify listeners
        const listeners = this.eventListeners.get(event.type) || [];
        listeners.forEach(callback => callback(event));
    }

    /**
     * Subscribe to events
     */
    public on(eventType: EventType, callback: (event: WorldEvent) => void): void {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        this.eventListeners.get(eventType)!.push(callback);
    }

    /**
     * Get recent events
     */
    public getRecentEvents(limit: number = 50): WorldEvent[] {
        return this.state.events.slice(-limit);
    }

    /**
     * Get location by ID
     */
    public getLocation(locationId: string): Location | undefined {
        return this.state.locations.get(locationId);
    }

    /**
     * Update economic stats
     */
    public updateEconomicStats(updates: Partial<EconomicStats>): void {
        Object.assign(this.state.economicStats, updates);
        this.saveState();
    }
}
