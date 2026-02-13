import React, { useEffect, useState } from 'react';
import './ArenaView.css';
import { API_BASE_URL } from '../config';

interface Battle {
    battleId: string;
    challenger: string;
    opponent: string | null;
    wager: number;
    status: 'open' | 'active' | 'completed';
    winner: string | null;
}

export const ArenaView: React.FC = () => {
    const [openBattles, setOpenBattles] = useState<Battle[]>([]);
    const [activeBattles, setActiveBattles] = useState<Battle[]>([]);

    useEffect(() => {
        fetchBattles();
        const interval = setInterval(fetchBattles, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchBattles = async () => {
        const API_URL = API_BASE_URL;
        try {
            const openRes = await fetch(`${API_URL}/arena/battles/open`);
            const openData = await openRes.json();
            setOpenBattles(openData);

            const activeRes = await fetch(`${API_URL}/arena/battles/active`);
            const activeData = await activeRes.json();
            setActiveBattles(activeData);
        } catch (error) {
            console.error('Failed to fetch battles:', error);
        }
    };

    const spawnGladiator = async () => {
        const API_URL = API_BASE_URL;
        try {
            await fetch(`${API_URL}/admin/spawn`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type: 'arena' })
            });
            // Give it a moment to appear
            setTimeout(fetchBattles, 1000);
        } catch (error) {
            console.error('Failed to spawn gladiator:', error);
        }
    };

    return (
        <div className="arena-view">
            <h2 className="arena-title">PVP ARENA</h2>

            <div className="arena-controls">
                <button className="spawn-btn" onClick={spawnGladiator}>
                    + SPAWN GLADIATOR
                </button>
            </div>

            <div className="arena-section">
                <h3 className="section-title">OPEN CHALLENGES</h3>
                {openBattles.length === 0 ? (
                    <div className="empty-state">No open challenges</div>
                ) : (
                    <div className="battle-list">
                        {openBattles.map(battle => (
                            <div key={battle.battleId} className="battle-card open">
                                <div className="battle-header">
                                    <span className="battle-id">{battle.battleId}</span>
                                    <span className="wager">{battle.wager} MON</span>
                                </div>
                                <div className="battle-info">
                                    <div className="challenger">
                                        <span className="label">Challenger:</span>
                                        <span className="name">{battle.challenger}</span>
                                    </div>
                                    <div className="vs">VS</div>
                                    <div className="opponent">
                                        <span className="label">Waiting for opponent...</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="arena-section">
                <h3 className="section-title">ACTIVE BATTLES</h3>
                {activeBattles.length === 0 ? (
                    <div className="empty-state">No active battles</div>
                ) : (
                    <div className="battle-list">
                        {activeBattles.map(battle => (
                            <div key={battle.battleId} className="battle-card active">
                                <div className="battle-header">
                                    <span className="battle-id">{battle.battleId}</span>
                                    <span className="wager">{battle.wager} MON</span>
                                </div>
                                <div className="battle-info">
                                    <div className="challenger">
                                        <span className="name">{battle.challenger}</span>
                                    </div>
                                    <div className="vs pulsing">VS</div>
                                    <div className="opponent">
                                        <span className="name">{battle.opponent}</span>
                                    </div>
                                </div>
                                <div className="battle-status">FIGHTING...</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
