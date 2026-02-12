import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './ArenaPage.css';

interface Battle {
    battleId: string;
    challenger: string;
    opponent: string | null;
    wager: number;
    status: 'open' | 'active' | 'completed';
}

interface Boss {
    health: number;
    maxHealth: number;
    status: string;
}

const ArenaPage: React.FC = () => {
    const [openBattles, setOpenBattles] = useState<Battle[]>([]);
    const [activeBattles, setActiveBattles] = useState<Battle[]>([]);
    const [boss, setBoss] = useState<Boss | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';
            try {
                // Fetch Battles
                const openRes = await fetch(`${API}/arena/battles/open`);
                const activeRes = await fetch(`${API}/arena/battles/active`);
                setOpenBattles(await openRes.json());
                setActiveBattles(await activeRes.json());

                // Fetch Titan
                const bossRes = await fetch(`${API}/boss/status`);
                const bossData = await bossRes.json();
                setBoss(bossData.boss);
            } catch (e) {
                console.error(e);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 2000); // Faster refresh for combat
        return () => clearInterval(interval);
    }, []);

    const healthPercent = boss ? (boss.health / boss.maxHealth) * 100 : 0;

    return (
        <div className="arena-page">
            <Link to="/app" className="btn-pixel btn-secondary" style={{ position: 'absolute', top: 20, left: 20 }}>
                ← BACK TO SIM
            </Link>

            <header className="arena-header">
                <h1>THE ARENA</h1>
                <p>PVP COMBAT & TITAN RAIDS</p>
            </header>

            {/* TITAN RAID BOSS */}
            {boss && (
                <section className="titan-section">
                    <h2 style={{ color: 'var(--danger)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        RAID BOSS DETECTED
                    </h2>
                    <div className="titan-avatar">
                        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="var(--danger)" strokeWidth="2">
                            <path d="M50 20 L80 40 L80 80 L20 80 L20 40 Z" />
                            <circle cx="35" cy="50" r="5" fill="var(--danger)" />
                            <circle cx="65" cy="50" r="5" fill="var(--danger)" />
                            <path d="M40 70 Q50 60 60 70" />
                            <path d="M50 10 L50 20" />
                            <path d="M50 10 L40 5" />
                            <path d="M50 10 L60 5" />
                        </svg>
                    </div>
                    <h3>THE TITAN</h3>
                    <div className="titan-health-container">
                        <div
                            className="titan-health-fill"
                            style={{ width: `${healthPercent}%` }}
                        />
                        <div className="titan-health-text">
                            {boss.health.toLocaleString()} / {boss.maxHealth.toLocaleString()} HP
                        </div>
                    </div>
                    <p style={{ marginTop: 10, fontSize: '0.8rem' }}>
                        STATUS: <span style={{ color: 'var(--text-main)' }}>{boss.status.toUpperCase()}</span>
                    </p>
                </section>
            )}

            {/* BATTLES */}
            <div className="battle-grid">
                <div className="battle-column">
                    <h3 className="section-title">LIVE DUELS</h3>
                    {activeBattles.map(b => (
                        <div key={b.battleId} className="battle-card active">
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gold)' }}>
                                <span>DUEL #{b.battleId.slice(0, 4)}</span>
                                <span>{b.wager} MON</span>
                            </div>
                            <div className="fighters">
                                <span>{b.challenger}</span>
                                <span className="vs-badge">VS</span>
                                <span>{b.opponent}</span>
                            </div>
                            <div style={{ color: 'var(--neon-green)', fontSize: '0.7rem', textAlign: 'center' }}>
                                /// COMBAT IN PROGRESS ///
                            </div>
                        </div>
                    ))}
                    {activeBattles.length === 0 && <p className="empty-state">No active duels.</p>}
                </div>

                <div className="battle-column">
                    <h3 className="section-title">OPEN CHALLENGES</h3>
                    {openBattles.map(b => (
                        <div key={b.battleId} className="battle-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)' }}>
                                <span>CHALLENGE #{b.battleId.slice(0, 4)}</span>
                                <span>{b.wager} MON</span>
                            </div>
                            <div className="fighters">
                                <span>{b.challenger}</span>
                                <span className="vs-badge" style={{ opacity: 0.5 }}>VS</span>
                                <span style={{ opacity: 0.5 }}>?</span>
                            </div>
                            <button className="btn-pixel btn-primary" style={{ width: '100%', padding: '10px' }}>
                                ACCEPT CHALLENGE
                            </button>
                        </div>
                    ))}
                    {openBattles.length === 0 && <p className="empty-state">No open challenges.</p>}
                </div>
            </div>
        </div>
    );
};

export default ArenaPage;
