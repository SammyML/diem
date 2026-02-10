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
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
        try {
            const res = await fetch(`${API_URL}/faction/leaderboard`);
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
            <h2 className="leaderboard-title">Faction Leaderboard</h2>
            <div className="leaderboard-list">
                {factions.map((faction, index) => (
                    <div key={faction.faction} className="faction-item">
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
                    </div >
                ))}
            </div >
        </div >
    );
};
