import React, { useEffect, useState } from 'react';
import './PixelWorldMap.css';

interface Location {
    id: string;
    name: string;
    x: number;
    y: number;
    agentCount: number;
}

interface Agent {
    id: string;
    name: string;
    locationId: string;
}

interface Boss {
    name: string;
    health: number;
    maxHealth: number;
    healthPercent: number;
    participants: number;
    status: 'active' | 'defeated' | 'respawning';
}

export const PixelWorldMap: React.FC = () => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [boss, setBoss] = useState<Boss | null>(null);

    useEffect(() => {
        fetchWorldData();
        const interval = setInterval(fetchWorldData, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchWorldData = async () => {
        try {
            // Fetch locations
            const locRes = await fetch('http://localhost:3000/world/locations');
            const locData = await locRes.json();

            // Map locations to pixel positions
            const mappedLocations = locData.map((loc: any, index: number) => ({
                id: loc.id,
                name: loc.name,
                x: (index % 3) * 250 + 100,
                y: Math.floor(index / 3) * 200 + 100,
                agentCount: loc.agentCount || 0
            }));
            setLocations(mappedLocations);

            // Fetch boss status
            const bossRes = await fetch('http://localhost:3000/boss/status');
            const bossData = await bossRes.json();
            setBoss(bossData.boss);

        } catch (error) {
            console.error('Failed to fetch world data:', error);
        }
    };

    return (
        <div className="pixel-world-container">
            <div className="world-header">
                <h1 className="pixel-title">DIEM WORLD</h1>
                <div className="season-info">
                    <span className="season-badge">SEASON 1</span>
                    <span className="entry-fee">Entry: 100 MON</span>
                </div>
            </div>

            <div className="world-canvas">
                <svg width="800" height="600" className="world-map">
                    {/* Grid background */}
                    <defs>
                        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1a1a2e" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="800" height="600" fill="url(#grid)" />

                    {/* Locations */}
                    {locations.map((loc) => (
                        <g key={loc.id} className="location-node">
                            <circle
                                cx={loc.x}
                                cy={loc.y}
                                r="30"
                                className={`location-circle ${loc.agentCount > 0 ? 'active' : ''}`}
                            />
                            <text
                                x={loc.x}
                                y={loc.y - 40}
                                className="location-name"
                                textAnchor="middle"
                            >
                                {loc.name}
                            </text>
                            {loc.agentCount > 0 && (
                                <text
                                    x={loc.x}
                                    y={loc.y + 5}
                                    className="agent-count"
                                    textAnchor="middle"
                                >
                                    {loc.agentCount} agents
                                </text>
                            )}
                        </g>
                    ))}

                    {/* Boss indicator */}
                    {boss && boss.status === 'active' && (
                        <g className="boss-indicator">
                            <circle
                                cx="400"
                                cy="300"
                                r="50"
                                className="boss-circle pulsing"
                            />
                            <text
                                x="400"
                                y="300"
                                className="boss-text"
                                textAnchor="middle"
                            >
                                THE TITAN
                            </text>
                            <text
                                x="400"
                                y="320"
                                className="boss-health"
                                textAnchor="middle"
                            >
                                {boss.health}/{boss.maxHealth} HP
                            </text>
                        </g>
                    )}
                </svg>

                {/* Boss Health Bar */}
                {boss && boss.status === 'active' && (
                    <div className="boss-health-bar">
                        <div className="boss-name">THE TITAN</div>
                        <div className="health-bar-container">
                            <div
                                className="health-bar-fill"
                                style={{ width: `${boss.healthPercent}%` }}
                            />
                            <div className="health-text">
                                {boss.health} / {boss.maxHealth} HP
                            </div>
                        </div>
                        <div className="boss-participants">
                            {boss.participants} agents attacking
                        </div>
                    </div>
                )}
            </div>

            <div className="world-footer">
                <div className="legend">
                    <div className="legend-item">
                        <div className="legend-color active"></div>
                        <span>Active Location</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color boss"></div>
                        <span>World Boss</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
