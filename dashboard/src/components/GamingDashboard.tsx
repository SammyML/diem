import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import WorldMap from './WorldMap';
import { FactionLeaderboard } from './FactionLeaderboard';
import { ArenaView } from './ArenaView';
import AgentList from './AgentList';
import { EventLog, WorldEvent } from './EventLog';
import { LivingBackground } from './LivingBackground';
import { WeatherOverlay } from './WeatherOverlay';
import './GamingDashboard.css';

interface Stats {
    totalAgents: number;
    resourcesGathered: number;
    itemsCrafted: number;
    tradesCompleted: number;
    totalMonInCirculation: number;
}

interface SeasonInfo {
    seasonId: number;
    entryFee: number;
    daysRemaining: number;
    totalParticipants: number;
}

export const GamingDashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats>({
        totalAgents: 0,
        resourcesGathered: 0,
        itemsCrafted: 0,
        tradesCompleted: 0,
        totalMonInCirculation: 0
    });
    const [season, setSeason] = useState<SeasonInfo | null>(null);
    const [agents, setAgents] = useState<Record<string, any>>({});
    const [locations, setLocations] = useState<any[]>([]);
    const [animatedStats, setAnimatedStats] = useState<Stats>(stats);


    // Spectator Mode State
    const [events, setEvents] = useState<WorldEvent[]>([]);
    const [isSpectatorMode, setIsSpectatorMode] = useState(false);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    // Animate stat counters
    useEffect(() => {
        const duration = 1000;
        const steps = 30;
        const stepDuration = duration / steps;

        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;

            setAnimatedStats({
                totalAgents: Math.floor(stats.totalAgents * progress),
                resourcesGathered: Math.floor(stats.resourcesGathered * progress),
                itemsCrafted: Math.floor(stats.itemsCrafted * progress),
                tradesCompleted: Math.floor(stats.tradesCompleted * progress),
                totalMonInCirculation: Math.floor(stats.totalMonInCirculation * progress)
            });

            if (currentStep >= steps) {
                clearInterval(interval);
                setAnimatedStats(stats);
            }
        }, stepDuration);

        return () => clearInterval(interval);
    }, [stats]);

    const fetchData = async () => {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        try {
            // ... (keep existing fetch calls)

            // Fetch world state for agents AND events
            const worldRes = await fetch(`${API_URL}/world/state`);
            const worldData = await worldRes.json();
            setAgents(worldData.agents || {});
            setEvents(worldData.events || []); // Update events

            // Fetch locations for WorldMap
            const locRes = await fetch(`${API_URL}/world/locations`);
            const locData = await locRes.json();
            setLocations(locData);



            // Update stats from world data
            if (worldData) {
                const agentCount = Object.keys(worldData.agents || {}).length;
                const eco = worldData.economicStats || {};

                setStats({
                    totalAgents: agentCount,
                    resourcesGathered: eco.totalResourcesGathered || 0,
                    itemsCrafted: eco.totalItemsCrafted || 0,
                    tradesCompleted: eco.totalTrades || 0,
                    totalMonInCirculation: eco.totalMonInCirculation || 0
                });
            }

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        }
    };

    return (
        <div className={`gaming-dashboard ${isSpectatorMode ? 'spectator-mode' : ''}`}>
            {/* Navigation Bar */}
            <nav className="dashboard-nav">
                <Link to="/" className="nav-link">HOME</Link>
                <Link to="/app" className="nav-link active">DASHBOARD</Link>
                <Link to="/factions" className="nav-link">FACTIONS</Link>
                <Link to="/arena" className="nav-link">ARENA</Link>
                <Link to="/leaderboard" className="nav-link">LEADERBOARD</Link>
                <Link to="/network" className="nav-link">NETWORK</Link>
            </nav>

            {/* Spectator Toggle */}
            <button
                className="spectator-toggle"
                onClick={() => setIsSpectatorMode(!isSpectatorMode)}
                title="Toggle Spectator Mode"
            >
                {isSpectatorMode ? ' [EXIT] SPECTATOR' : ' [VIEW] SPECTATOR'}
            </button>

            {/* Living Generative Background (Global) */}
            <LivingBackground />





            {/* Weather Overlay (Atmosphere) */}
            <WeatherOverlay type="rain" />

            {/* Header (Hidden in Spectator Mode) */}
            {!isSpectatorMode && (
                <header className="dashboard-header">
                    {/* ... (existing header content) ... */}
                    <div className="logo-section">
                        <h1 className="game-title">DIEM</h1>
                        <p className="game-subtitle">Multi-Agent Economy</p>
                    </div>
                    {season && (
                        <div className="season-banner">
                            <div className="season-label">SEASON {season.seasonId}</div>
                            <div className="season-details">
                                <span className="detail-item">
                                    <span className="detail-label">Entry Fee:</span>
                                    <span className="detail-value">{season.entryFee} MON</span>
                                </span>
                                <span className="detail-item">
                                    <span className="detail-label">Days Left:</span>
                                    <span className="detail-value">{season.daysRemaining}</span>
                                </span>
                                <span className="detail-item">
                                    <span className="detail-label">Participants:</span>
                                    <span className="detail-value">{season.totalParticipants}</span>
                                </span>
                            </div>
                        </div>
                    )}
                </header>
            )}

            {/* Stats Bar (Hidden in Spectator Mode) */}
            {!isSpectatorMode && (
                <div className="stats-bar">
                    {/* ... (existing stats content) ... */}
                    <div className="stat-card">
                        <div className="stat-label">AGENTS</div>
                        <div className="stat-content">
                            <div className="stat-value">{animatedStats.totalAgents}</div>
                        </div>
                    </div>
                    {/* ... other stats ... */}
                    <div className="stat-card">
                        <div className="stat-label">GATHERED</div>
                        <div className="stat-content">
                            <div className="stat-value">{(animatedStats.resourcesGathered ?? 0).toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">CRAFTED</div>
                        <div className="stat-content">
                            <div className="stat-value">{(animatedStats.itemsCrafted ?? 0).toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">TRADES</div>
                        <div className="stat-content">
                            <div className="stat-value">{(animatedStats.tradesCompleted ?? 0).toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="stat-card highlight">
                        <div className="stat-label">MON</div>
                        <div className="stat-content">
                            <div className="stat-value">{(animatedStats.totalMonInCirculation ?? 0).toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="dashboard-grid">
                {/* Left Column (Map) */}
                <div className={`grid-column left ${isSpectatorMode ? 'full-width' : ''}`}>
                    <WorldMap locations={locations.filter(l => l.id !== 'arena')} agents={agents} />
                    {/* Event Log (Only in Spectator Mode) */}
                    {isSpectatorMode && <EventLog events={events} />}
                </div>

                {/* Right Column (Sidebar Lists - Hidden in Spectator Mode) */}
                {!isSpectatorMode && (
                    <div className="grid-column right">
                        <FactionLeaderboard />
                        <div className="spacer"></div>
                        <AgentList agents={agents} />
                        <div className="spacer"></div>
                        <ArenaView />
                    </div>
                )}
            </div>

            {/* Footer (Hidden in Spectator Mode) */}
            {!isSpectatorMode && (
                <footer className="dashboard-footer">
                    <div className="footer-content">
                        <span className="footer-text">Powered by Monad Blockchain</span>
                        <span className="footer-separator">|</span>
                        <span className="footer-text">Real-time Multi-Agent Simulation</span>
                        <span className="footer-separator">|</span>
                        <span className="footer-text">On-Chain Economy</span>
                    </div>
                </footer>
            )}
        </div>
    );
};
