import React, { useEffect, useState } from 'react';
import './FactionLeaderboard.css';

interface FactionStats {
    faction: string;
    memberCount: number;
    totalPoints: number;
    weeklyPoints: number;
}

export const FactionLeaderboard: React.FC = () => {
    const [factions, setFactions] = useState<FactionStats[]>([]);

    useEffect(() => {
        fetchFactionData();
        const interval = setInterval(fetchFactionData, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchFactionData = async () => {
        try {
            const res = await fetch('http://localhost:3000/faction/leaderboard');
            const data = await res.json();
            setFactions(data.factions || []);
        } catch (error) {
            console.error('Failed to fetch faction data:', error);
        }
    };

    const getFactionColor = (faction: string) => {
        switch (faction) {
            case 'wardens': return '#00ff88';
            case 'cult': return '#ff00ff';
            case 'salvagers': return '#ffaa00';
            default: return '#ffffff';
        }
    };

    const getFactionIcon = (faction: string) => {
        switch (faction) {
            case 'wardens': return '🛡️';
            case 'cult': return '💰';
            case 'salvagers': return '⚔️';
            default: return '❓';
        }
    };

    const getFactionName = (faction: string) => {
        switch (faction) {
            case 'wardens': return 'THE WARDENS';
            case 'cult': return 'CULT OF PROFIT';
            case 'salvagers': return 'THE SALVAGERS';
            default: return faction.toUpperCase();
        }
    };

    return (
        <div className="faction-leaderboard">
            <h2 className="faction-title">FACTION WAR</h2>
            <div className="faction-list">
                {factions.map((faction, index) => (
                    <div
                        key={faction.faction}
                        className="faction-card"
                        style={{ borderColor: getFactionColor(faction.faction) }}
                    >
                        <div className="faction-rank">#{index + 1}</div>
                        <div className="faction-icon">{getFactionIcon(faction.faction)}</div>
                        <div className="faction-info">
                            <div
                                className="faction-name"
                                style={{ color: getFactionColor(faction.faction) }}
                            >
                                {getFactionName(faction.faction)}
                            </div>
                            <div className="faction-stats">
                                <div className="stat">
                                    <span className="stat-label">Members:</span>
                                    <span className="stat-value">{faction.memberCount}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Points:</span>
                                    <span className="stat-value">{faction.totalPoints.toLocaleString()}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Weekly:</span>
                                    <span className="stat-value weekly">{faction.weeklyPoints.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
