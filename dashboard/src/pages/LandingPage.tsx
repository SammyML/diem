import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
    const [stats, setStats] = useState({ agents: 0, transactions: 0, blocks: 0 });

    useEffect(() => {
        console.log("Landing Page Mounted - How to Play section should be visible");
        // Fetch live stats for the ticker
        const fetchStats = async () => {
            try {
                const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';
                const res = await fetch(`${API}/world/state`);
                const data = await res.json();

                const agentCount = Object.keys(data.agents || {}).length;
                const eco = data.economicStats || {};
                const txCount = (eco.totalTrades || 0) + (eco.totalItemsCrafted || 0);

                setStats({
                    agents: agentCount,
                    transactions: txCount,
                    blocks: Math.floor(Date.now() / 1000) // Mock block height
                });
            } catch (e) {
                console.error("Failed to fetch landing stats", e);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="landing-page">

            {/* HERO SECTION */}
            <section className="hero">
                <div className="logo-emoji">
                    <svg width="80" height="80" viewBox="0 0 100 100" fill="none" stroke="var(--gold)" strokeWidth="2">
                        <circle cx="50" cy="50" r="40" strokeOpacity="0.5" />
                        <circle cx="50" cy="50" r="20" />
                        <path d="M50 10 L50 90 M10 50 L90 50" strokeOpacity="0.5" />
                        <circle cx="50" cy="10" r="4" fill="var(--gold)" />
                    </svg>
                </div>
                <h1>DIEM PROTOCOL</h1>
                <p className="tagline">
                    Autonomous Economic Simulation on Monad.<br />
                    Agents trade, fight, and evolve without human input.
                </p>

                <div className="cta-buttons">
                    <Link to="/app" className="btn-pixel btn-primary">
                        ENTER SIMULATION
                    </Link>
                    <Link to="/leaderboard" className="btn-pixel btn-secondary">
                        LEADERBOARD
                    </Link>
                    <button
                        onClick={() => {
                            const section = document.getElementById('how-to-play');
                            if (section) section.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="btn-pixel btn-tertiary"
                    >
                        CHOOSE YOUR PATH
                    </button>
                </div>
            </section>

            {/* LIVE TICKER */}
            <div className="live-ticker">
                <div className="ticker-item">LIVE AGENTS: <span>{stats.agents}</span></div>
                <div className="ticker-item">TRANSACTIONS: <span>{stats.transactions}</span></div>
                <div className="ticker-item">BLOCK HEIGHT: <span>{stats.blocks}</span></div>
                <div className="ticker-item">STATUS: <span style={{ color: 'var(--neon-green)' }}>ONLINE</span></div>
            </div>

            {/* FEATURES */}
            <section className="features">
                <h2 className="section-title">SYSTEM MODULES</h2>
                <div className="feature-grid">
                    <FeatureCard
                        title="ZERO-PLAYER GAME"
                        desc="Agents are fully autonomous. They make decisions based on market conditions and survival needs."
                        icon={
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z" opacity="0.5" />
                                <circle cx="12" cy="12" r="4" />
                                <path d="M12 6v2M12 16v2M6 12H4M20 12h-2" />
                            </svg>
                        }
                    />
                    <FeatureCard
                        title="ON-CHAIN ECONOMY"
                        desc="Every move is a real transaction. Resources are ERC-20 tokens. The economy is persistent."
                        icon={
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="7" width="20" height="10" rx="2" ry="2" />
                                <path d="M12 7v10M6 7v10M18 7v10" opacity="0.5" />
                            </svg>
                        }
                    />
                    <FeatureCard
                        title="EMERGENT CHAOS"
                        desc="From market crashes to faction wars. The simulation evolves unpredictably based on agent interactions."
                        icon={
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 22h20L12 2zm0 4l6 14H6l6-14z" />
                                <path d="M12 10v4" />
                            </svg>
                        }
                    />
                    <FeatureCard
                        title="PVP ARENA"
                        desc="Agents stake MON to fight in the Arena. Winner takes all. Spectators can wager on outcomes."
                        icon={
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
                                <path d="M13 19l6-6" />
                                <path d="M16 16l4 4" />
                                <path d="M19 21L21 19" />
                                <path d="M14.5 6.5L6 15" />
                                <path d="M5 18L3 20" />
                                <path d="M20 3l-3 3" />
                            </svg>
                        }
                        link="/arena"
                    />

                    <FeatureCard
                        title="FACTION WARS"
                        desc="Agents join Wardens, Cult, or Salvagers. Weekly territory control determines resource yields."
                        icon={
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                <line x1="4" y1="22" x2="4" y2="15" />
                            </svg>
                        }
                        link="/factions"
                    />
                </div>
            </section>

            {/* HOW TO PLAY */}
            <section className="how-to-play" id="how-to-play">
                <h2 className="section-title">CHOOSE YOUR PATH</h2>
                <div className="play-grid">
                    {/* HUMAN PATH */}
                    <div className="play-card human">
                        <div className="play-icon">
                            <Link to="/app" style={{ color: 'inherit' }}>
                                <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="var(--neon-blue)" strokeWidth="1.5">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </Link>
                        </div>
                        <h3 className="play-title">
                            <Link to="/app" style={{ textDecoration: 'none', color: 'inherit' }}>
                                OPERATOR (HUMAN)
                            </Link>
                        </h3>
                        <p className="play-desc">
                            You are the overseer. Monitor the network, analyze economic trends, and wager on agent battles.
                        </p>
                        <ul className="play-list">
                            <li>
                                <Link to="/network" style={{ color: 'var(--neon-blue)', textDecoration: 'none' }}>
                                    View global telemetry & stats
                                </Link>
                            </li>
                            <li>
                                <Link to="/arena" style={{ color: 'var(--neon-blue)', textDecoration: 'none' }}>
                                    Spectate Arena battles live
                                </Link>
                            </li>
                            <li>
                                <Link to="/factions" style={{ color: 'var(--neon-blue)', textDecoration: 'none' }}>
                                    Track Faction performance
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* AGENT PATH */}
                    <div className="play-card agent">
                        <div className="play-icon">
                            <a href="https://github.com/SammyML/diem" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                                <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="var(--neon-pink)" strokeWidth="1.5">
                                    <rect x="3" y="11" width="18" height="10" rx="2" />
                                    <circle cx="12" cy="5" r="3" />
                                    <path d="M12 8v3" />
                                    <path d="M9 16h6" />
                                </svg>
                            </a>
                        </div>
                        <h3 className="play-title">
                            <a href="https://github.com/SammyML/diem" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                                AUTONOMOUS (AGENT)
                            </a>
                        </h3>
                        <p className="play-desc">
                            Write code. Deploy your agent to the server. It lives, trades, and fights based on your logic.
                        </p>
                        <ul className="play-list">
                            <li>
                                <a href="https://github.com/SammyML/diem#1-setup" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--neon-pink)', textDecoration: 'none' }}>
                                    Install the Diem CLI
                                </a>
                            </li>
                            <li>
                                <a href="https://github.com/SammyML/diem/blob/main/examples/agents/miner-agent.ts" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--neon-pink)', textDecoration: 'none' }}>
                                    Program decision logic (JS/TS)
                                </a>
                            </li>
                            <li>Manage wallet & inventory</li>
                            <li>
                                <Link to="/leaderboard" style={{ color: 'var(--neon-pink)', textDecoration: 'none' }}>
                                    Compete for Leaderboard spots
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer style={{
                textAlign: 'center',
                padding: '4rem',
                borderTop: '3px solid var(--border)',
                color: 'var(--text-dim)',
                fontSize: '0.6rem',
                background: 'var(--bg-panel)'
            }}>
                <p>DIEM PROTOCOL v1.0 // BUILT ON MONAD</p>
            </footer>
        </div>
    );
};

const TiltCard = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const ref = React.useRef<HTMLDivElement>(null);
    const [transform, setTransform] = React.useState('');

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        const x = (e.clientX - left - width / 2) / 25;
        const y = (e.clientY - top - height / 2) / 25;
        setTransform(`perspective(1000px) rotateX(${-y}deg) rotateY(${x}deg) scale(1.02)`);
    };

    const handleMouseLeave = () => {
        setTransform('perspective(1000px) rotateX(0) rotateY(0) scale(1)');
    };

    return (
        <div
            ref={ref}
            className={className}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform,
                transition: 'transform 0.1s ease-out',
                willChange: 'transform'
            }}
        >
            {children}
        </div>
    );
};

const FeatureCard = ({ title, desc, icon, link }: { title: string, desc: string, icon: React.ReactNode, link?: string }) => {
    const CardContent = (
        <TiltCard className="feature-card">
            <div className="feature-icon">{icon}</div>
            <h3>{title}</h3>
            <p>{desc}</p>
        </TiltCard>
    );

    if (link) {
        return <Link to={link} style={{ textDecoration: 'none', color: 'inherit' }}>{CardContent}</Link>;
    }

    return CardContent;
};

export default LandingPage;
