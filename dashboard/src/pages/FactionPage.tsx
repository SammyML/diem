import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import './FactionPage.css';

interface FactionStats {
    faction: string;
    memberCount: number;
    totalPoints: number;
    weeklyPoints: number;
}

const FactionPage: React.FC = () => {
    const [factions, setFactions] = useState<FactionStats[]>([]);

    useEffect(() => {
        const fetchFactions = async () => {
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
            try {
                const res = await fetch(`${API_URL}/faction/leaderboard`);
                const data = await res.json();
                setFactions(data.factions || []);
            } catch (e) {
                console.error(e);
            }
        };
        fetchFactions();
        const interval = setInterval(fetchFactions, 5000);
        return () => clearInterval(interval);
    }, []);

    const getMeta = (id: string) => {
        switch (id) {
            case 'wardens': return {
                name: 'THE WARDENS',
                icon: (
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--neon-green)" strokeWidth="1.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                    </svg>
                ),
                color: 'var(--neon-green)',
                desc: 'Protectors of the protocol. Defensive bonus +10%.'
            };
            case 'cult': return {
                name: 'CULT OF PROFIT',
                icon: (
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--neon-pink)" strokeWidth="1.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 9v-3" strokeOpacity="0.5" />
                        <path d="M12 15v3" strokeOpacity="0.5" />
                    </svg>
                ),
                color: 'var(--neon-pink)',
                desc: 'Seekers of forbidden yield. Crafting bonus +15%.'
            };
            case 'salvagers': return {
                name: 'THE SALVAGERS',
                icon: (
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                ),
                color: 'var(--gold)',
                desc: 'Scavengers of the wastes. Gathering bonus +20%.'
            };
            default: return { name: id, icon: <span style={{ fontSize: '2rem' }}>?</span>, color: '#fff', desc: 'Unknown Faction' };
        }
    };

    return (
        <div className="faction-page">
            <Link to="/app" className="btn-pixel btn-secondary" style={{ position: 'absolute', top: 20, left: 20 }}>
                ← BACK TO SIM
            </Link>

            <header className="faction-header">
                <h1>FACTION WARFARE</h1>
                <p>WEEKLY TERRITORY CONTROL</p>
            </header>

            <div className="faction-grid">
                {factions.map(f => {
                    const meta = getMeta(f.faction);
                    return (
                        <div key={f.faction} className={`faction-card-large ${f.faction}`}>
                            <div className="faction-sigil">{meta.icon}</div>
                            <h2 className="faction-name-large" style={{ color: meta.color }}>{meta.name}</h2>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 20 }}>{meta.desc}</p>

                            <div className="faction-stats-large">
                                <div className="stat-row">
                                    <span>MEMBERS</span>
                                    <span className="stat-val">{f.memberCount}</span>
                                </div>
                                <div className="stat-row">
                                    <span>TOTAL SCORE</span>
                                    <span className="stat-val">{f.totalPoints.toLocaleString()}</span>
                                </div>
                                <div className="stat-row">
                                    <span>WEEKLY YIELD</span>
                                    <span className="stat-val" style={{ color: meta.color }}>+{f.weeklyPoints.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FactionPage;
