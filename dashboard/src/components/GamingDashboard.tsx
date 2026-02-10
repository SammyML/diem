import React, { useEffect, useState } from 'react';
import { PixelWorldMap } from './PixelWorldMap';
import { FactionLeaderboard } from './FactionLeaderboard';
import { ArenaView } from './ArenaView';
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
    const [animatedStats, setAnimatedStats] = useState<Stats>(stats);

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
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
        try {
            // Fetch economy stats
            const statsRes = await fetch(`${API_URL}/economy/stats`);
            const statsData = await statsRes.json();
            setStats(statsData);

            // Fetch season info
            const seasonRes = await fetch(`${API_URL}/season/current`);
            const seasonData = await seasonRes.json();
            setSeason({
                seasonId: seasonData.season.seasonId,
                entryFee: seasonData.entryFee,
                daysRemaining: seasonData.daysRemaining,
                totalParticipants: seasonData.totalParticipants
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        }
    };

    return (
        <div className="gaming-dashboard">
            {/* Header */}
            <header className="dashboard-header">
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

            {/* Stats Bar */}
            <div className="stats-bar">
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <div className="stat-label">Active Agents</div>
                        <div className="stat-value">{animatedStats.totalAgents}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⛏️</div>
                    <div className="stat-content">
                        <div className="stat-label">Resources Gathered</div>
                        <div className="stat-value">{animatedStats.resourcesGathered.toLocaleString()}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🔨</div>
                    <div className="stat-content">
                        <div className="stat-label">Items Crafted</div>
                        <div className="stat-value">{animatedStats.itemsCrafted.toLocaleString()}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <div className="stat-label">Trades Completed</div>
                        <div className="stat-value">{animatedStats.tradesCompleted.toLocaleString()}</div>
                    </div>
                </div>
                <div className="stat-card highlight">
                    <div className="stat-icon">💎</div>
                    <div className="stat-content">
                        <div className="stat-label">MON in Circulation</div>
                        <div className="stat-value">{animatedStats.totalMonInCirculation.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-grid">
                {/* Left Column */}
                <div className="grid-column left">
                    <PixelWorldMap />
                </div>

                {/* Right Column */}
                <div className="grid-column right">
                    <FactionLeaderboard />
                    <div className="spacer"></div>
                    <ArenaView />
                </div>
            </div>

            {/* Footer */}
            <footer className="dashboard-footer">
                <div className="footer-content">
                    <span className="footer-text">Powered by Monad Blockchain</span>
                    <span className="footer-separator">•</span>
                    <span className="footer-text">Real-time Multi-Agent Simulation</span>
                    <span className="footer-separator">•</span>
                    <span className="footer-text">On-Chain Economy</span>
                </div>
            </footer>
        </div>
    );
};
