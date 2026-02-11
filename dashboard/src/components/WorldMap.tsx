import React, { useEffect, useState, useRef } from 'react';
import './WorldMap.css';

interface Location {
    id: string;
    name: string;
    currentOccupancy: number;
    maxCapacity: number;
}

interface Agent {
    id: string;
    name: string;
    locationId: string;
    monBalance: number;
}

interface Props {
    locations: Record<string, Location> | Location[];
    agents: Record<string, Agent>;
}

const LOCATION_POSITIONS: Record<string, { x: number; y: number }> = {
    market_square: { x: 50, y: 50 },  // Center
    mining_caves: { x: 20, y: 80 },   // Bottom Left
    forest: { x: 80, y: 20 },         // Top Right
    tavern: { x: 20, y: 20 },         // Top Left
    workshop: { x: 80, y: 80 },       // Bottom Right
    arena: { x: 50, y: 15 }           // Top Center
};

const LOCATION_COLORS: Record<string, string> = {
    market_square: '#FBBF24', // Amber/Gold (Commerce)
    mining_caves: '#9CA3AF',  // Grey (Stone/Ore) - adjusted for visibility
    forest: '#10B981',        // Emerald (Nature)
    tavern: '#8B5CF6',        // Violet (Social/Nightlife)
    workshop: '#06B6D4',      // Cyan (Tech/Craft)
    arena: '#EF4444'          // Red (Combat)
};

const WorldMap: React.FC<Props> = ({ locations, agents }) => {
    const agentsByLocation: Record<string, Agent[]> = {};
    const [trails, setTrails] = useState<{ id: string, x1: number, y1: number, x2: number, y2: number, timestamp: number }[]>([]);
    const prevAgentLocations = useRef<Record<string, string>>({});

    // Normalize locations: Handles both Array (from backend) and Object (legacy type)
    const locationList = Array.isArray(locations)
        ? locations
        : Object.values(locations || {});

    // Group agents by location
    Object.values(agents || {}).forEach(agent => {
        if (!agentsByLocation[agent.locationId]) {
            agentsByLocation[agent.locationId] = [];
        }
        agentsByLocation[agent.locationId].push(agent);
    });

    // Detect movement and create trails
    useEffect(() => {
        const newTrails: typeof trails = [];
        const currentLocs: Record<string, string> = {};

        Object.values(agents || {}).forEach(agent => {
            const prevLocId = prevAgentLocations.current[agent.id];
            const currLocId = agent.locationId;

            if (prevLocId && prevLocId !== currLocId) {
                // Agent moved!
                const start = LOCATION_POSITIONS[prevLocId];
                const end = LOCATION_POSITIONS[currLocId];

                if (start && end) {
                    newTrails.push({
                        id: `${agent.id}-${Date.now()}`,
                        x1: start.x,
                        y1: start.y,
                        x2: end.x,
                        y2: end.y,
                        timestamp: Date.now()
                    });
                }
            }
            currentLocs[agent.id] = currLocId;
        });

        if (newTrails.length > 0) {
            setTrails(prev => [...prev.slice(-20), ...newTrails]); // Keep last 20 trails
        }

        prevAgentLocations.current = currentLocs;
    }, [agents]);

    // Clean up old trails
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setTrails(prev => prev.filter(t => now - t.timestamp < 2000)); // Remove trails older than 2s
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="world-map">
            <svg viewBox="0 0 100 100" className="map-svg">
                {/* Glow Filter Definition */}
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="glow-text">
                        <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Static Connections */}
                <line x1="50" y1="50" x2="20" y2="75" className="connection" strokeWidth="0.5" />
                <line x1="50" y1="50" x2="75" y2="30" className="connection" strokeWidth="0.5" />
                <line x1="50" y1="50" x2="30" y2="25" className="connection" strokeWidth="0.5" />
                <line x1="50" y1="50" x2="70" y2="70" className="connection" strokeWidth="0.5" />
                <line x1="75" y1="30" x2="70" y2="70" className="connection" strokeWidth="0.5" />

                {/* Active Movement Trails */}
                {trails.map(trail => (
                    <line
                        key={trail.id}
                        x1={trail.x1} y1={trail.y1}
                        x2={trail.x2} y2={trail.y2}
                        className="agent-trail"
                        stroke="white"
                        strokeWidth="0.5"
                        filter="url(#glow)"
                    />
                ))}

                {/* Locations */}
                {locationList.map((location) => {
                    const id = location.id;
                    const pos = LOCATION_POSITIONS[id] || { x: 50, y: 50 };
                    const agentsHere = agentsByLocation[id] || [];
                    const color = LOCATION_COLORS[id] || '#ffffff';

                    return (
                        <g key={id} className="location-group">
                            <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={6 + (agentsHere.length * 0.5)}
                                className="location"
                                fill={color}
                                fillOpacity={0.15}
                                stroke={color}
                                strokeWidth={0.5}
                            />
                            {/* Inner core */}
                            <circle
                                cx={pos.x}
                                cy={pos.y}
                                r="2"
                                fill={color}
                                filter="url(#glow)"
                            />

                            <text
                                x={pos.x}
                                y={pos.y - 10}
                                className="location-label"
                                textAnchor="middle"
                                fill="white"
                                fontSize="4"
                                fontWeight="bold"
                                fontFamily="Inter, sans-serif"
                                style={{ textShadow: `0 0 5px ${color}` }}
                            >
                                {location.name}
                            </text>
                            <text
                                x={pos.x}
                                y={pos.y + 12}
                                className="location-count"
                                textAnchor="middle"
                                fill={color}
                                fontSize="3"
                                fontFamily="monospace"
                            >
                                [{agentsHere.length}/{location.maxCapacity}]
                            </text>

                            {/* Agent markers orbiting or clustered */}
                            {agentsHere.map((agent, i) => {
                                // Add slight random offset for clustering
                                const angle = (i / agentsHere.length) * Math.PI * 2;
                                const radius = 4;
                                const ax = pos.x + Math.cos(angle) * radius;
                                const ay = pos.y + Math.sin(angle) * radius;

                                return (
                                    <circle
                                        key={agent.id}
                                        cx={ax}
                                        cy={ay}
                                        r="1.2"
                                        className="agent-marker"
                                        fill="white"
                                        filter="url(#glow)"
                                    >
                                        <title>{`${agent.name} | ${agent.monBalance} MON`}</title>
                                    </circle>
                                );
                            })}
                        </g>
                    );
                })}
            </svg>

            <div className="map-legend">
                {Object.entries(LOCATION_COLORS).map(([key, color]) => (
                    <div key={key} className="legend-item">
                        <div className="legend-color" style={{ background: color, boxShadow: `0 0 10px ${color}` }}></div>
                        <span style={{ textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WorldMap;
