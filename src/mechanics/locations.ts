import {
    Location,
    ResourcePool,
    ResourceType,
    QualityTier
} from '../types';

/**
 * Predefined locations in the Diem virtual world
 */
export const LOCATIONS: Location[] = [
    {
        id: 'market_square',
        name: 'Market Square',
        description: 'The bustling heart of the trading post. Agents gather here to trade goods and share information.',
        capacity: 20,
        currentOccupancy: 0,
        resources: [],
        connectedTo: ['mining_caves', 'forest', 'tavern', 'workshop'],
        properties: {
            isSafeZone: true,
            allowsTrading: true
        }
    },
    {
        id: 'mining_caves',
        name: 'Mining Caves',
        description: 'Dark tunnels rich with ore deposits. Skilled miners can extract valuable resources here.',
        capacity: 5,
        currentOccupancy: 0,
        resources: [
            {
                type: ResourceType.ORE,
                amount: 100,
                maxAmount: 100,
                regenerationRate: 10, // 10 ore per minute
                lastRegeneration: Date.now()
            },
            {
                type: ResourceType.RARE_GEM,
                amount: 10,
                maxAmount: 10,
                regenerationRate: 1,
                lastRegeneration: Date.now()
            }
        ],
        connectedTo: ['market_square'],
        properties: {
            gatherDifficulty: 0.7, // 70% success rate
            gatherTime: 5000, // 5 seconds
            monReward: 20
        }
    },
    {
        id: 'forest',
        name: 'Ancient Forest',
        description: 'A lush forest teeming with herbs and timber. Nature provides for those who know where to look.',
        capacity: 8,
        currentOccupancy: 0,
        resources: [
            {
                type: ResourceType.WOOD,
                amount: 150,
                maxAmount: 150,
                regenerationRate: 15,
                lastRegeneration: Date.now()
            },
            {
                type: ResourceType.HERBS,
                amount: 80,
                maxAmount: 80,
                regenerationRate: 8,
                lastRegeneration: Date.now()
            }
        ],
        connectedTo: ['market_square'],
        properties: {
            gatherDifficulty: 0.8, // 80% success rate
            gatherTime: 4000,
            monReward: 15
        }
    },
    {
        id: 'tavern',
        name: 'The Golden Tankard',
        description: 'A cozy tavern where agents rest, socialize, and hear rumors of opportunities.',
        capacity: 15,
        currentOccupancy: 0,
        resources: [],
        connectedTo: ['market_square'],
        properties: {
            isSafeZone: true,
            restBonus: 1.2, // 20% skill bonus after resting
            allowsSocializing: true
        }
    },
    {
        id: 'workshop',
        name: 'Artisan Workshop',
        description: 'A well-equipped workshop where raw materials are transformed into valuable goods.',
        capacity: 6,
        currentOccupancy: 0,
        resources: [],
        connectedTo: ['market_square'],
        properties: {
            allowsCrafting: true,
            craftingBonus: 1.1 // 10% better success rate
        }
    },
    {
        id: 'arena',
        name: 'The Arena',
        description: 'A brutal proving ground where agents fight for glory and MON. Winner takes all.',
        capacity: 50,
        currentOccupancy: 0,
        resources: [],
        connectedTo: ['market_square'],
        properties: {
            isPvPZone: true,
            combatBonus: 1.0
        }
    }
];

/**
 * Get location by ID
 */
export function getLocation(locationId: string): Location | undefined {
    return LOCATIONS.find(loc => loc.id === locationId);
}

/**
 * Check if two locations are connected
 */
export function areLocationsConnected(fromId: string, toId: string): boolean {
    const location = getLocation(fromId);
    return location ? location.connectedTo.includes(toId) : false;
}

/**
 * Get travel time between locations (in milliseconds)
 */
export function getTravelTime(fromId: string, toId: string): number {
    if (!areLocationsConnected(fromId, toId)) {
        return -1; // Not connected
    }
    return 3000; // 3 seconds base travel time
}

/**
 * Check if location has capacity for more agents
 */
export function hasCapacity(location: Location): boolean {
    return location.currentOccupancy < location.capacity;
}
