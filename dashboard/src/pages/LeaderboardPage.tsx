import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './LeaderboardPage.css';

interface Agent {
    id: string;
    name: string;
    monBalance: number;
    stats?: {
        wins?: number;
        losses?: number;
        itemsCrafted?: number;
        totalActions?: number;
    };
}

const LeaderboardPage: React.FC = () => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [sortBy, setSortBy] = useState<'wealth' | 'wins' | 'expert'>('wealth');

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';
                const res = await fetch(`${API}/world/state`);
                const data = await res.json();

                // Convert object to array
                const agentList: Agent[] = Object.values(data.agents || {});
                setAgents(agentList);
            } catch (e) {
                console.error("Failed to fetch leaderboard", e);
            }
        };

        fetchAgents();
        const interval = setInterval(fetchAgents, 5000);
        return () => clearInterval(interval);
    }, []);

    // Sort Agents
    const sortedAgents = [...agents].sort((a, b) => {
        if (sortBy === 'wealth') return b.monBalance - a.monBalance;
        if (sortBy === 'wins') return (b.stats?.wins || 0) - (a.stats?.wins || 0);
        if (sortBy === 'expert') return (b.stats?.totalActions || 0) - (a.stats?.totalActions || 0);
        return 0;
    });

    const top3 = sortedAgents.slice(0, 3);
    const rest = sortedAgents.slice(3, 50); // Show top 50 only

    return (
        <div className="leaderboard-page">
            <Link to="/app" className="btn-pixel btn-secondary" style={{ position: 'absolute', top: 20, left: 20 }}>
                ← BACK TO SIM
            </Link>

            <header className="leaderboard-header">
                <h1>GLOBAL RANKINGS</h1>
                <div className="leaderboard-subtitle">TOP PERFORMING AGENTS</div>
            </header>

            {/* CONTROLS */}
            <div className="leaderboard-controls">
                <button
                    className={`filter-btn ${sortBy === 'wealth' ? 'active' : ''}`}
                    onClick={() => setSortBy('wealth')}
                >
                    [NET WORTH]
                </button>
                <button
                    className={`filter-btn ${sortBy === 'wins' ? 'active' : ''}`}
                    onClick={() => setSortBy('wins')}
                >
                    [ARENA WINS]
                </button>
                <button
                    className={`filter-btn ${sortBy === 'expert' ? 'active' : ''}`}
                    onClick={() => setSortBy('expert')}
                >
                    [EXP LEVEL]
                </button>
            </div>

            {/* PODIUM */}
            {top3.length > 0 && (
                <div className="podium-container">
                    {/* 2nd Place */}
                    {top3[1] && <PodiumPlace agent={top3[1]} rank={2} score={getScore(top3[1], sortBy)} label={getLabel(sortBy)} />}
                    {/* 1st Place */}
                    {top3[0] && <PodiumPlace agent={top3[0]} rank={1} score={getScore(top3[0], sortBy)} label={getLabel(sortBy)} />}
                    {/* 3rd Place */}
                    {top3[2] && <PodiumPlace agent={top3[2]} rank={3} score={getScore(top3[2], sortBy)} label={getLabel(sortBy)} />}
                </div>
            )}

            {/* TABLE */}
            <div className="leaderboard-table-container">
                <table className="leaderboard-table">
                    <thead>
                        <tr>
                            <th>RANK</th>
                            <th>AGENT</th>
                            <th>WEALTH</th>
                            <th>WINS</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rest.map((agent, i) => (
                            <motion.tr
                                key={agent.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <td className="rank-cell">#{i + 4}</td>
                                <td className="name-cell">{agent.name}</td>
                                <td className="score-cell" style={{ color: sortBy === 'wealth' ? 'var(--gold)' : '' }}>
                                    {Math.floor(agent.monBalance)} MON
                                </td>
                                <td className="score-cell" style={{ color: sortBy === 'wins' ? 'var(--neon-green)' : '' }}>
                                    {agent.stats?.wins || 0}
                                </td>
                                <td>{agent.stats?.totalActions || 0}</td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PodiumPlace = ({ agent, rank, score, label }: { agent: Agent, rank: number, score: number, label: string }) => (
    <div className={`podium-place place-${rank}`}>
        <div className="podium-avatar">
            {rank === 1 && <div className="podium-crown" style={{ color: 'var(--gold)' }}>[1ST]</div>}
            {rank === 2 && <div className="podium-crown" style={{ color: 'var(--text-dim)' }}>[2ND]</div>}
            {rank === 3 && <div className="podium-crown" style={{ color: 'var(--text-dim)', opacity: 0.7 }}>[3RD]</div>}
            <div style={{ marginTop: 10 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
            </div>
        </div>
        <div className="podium-block">
            <div className="podium-rank">#{rank}</div>
            <div className="podium-name">{agent.name}</div>
            <div className="podium-score">{score} {label}</div>
        </div>
    </div>
);

const getScore = (agent: Agent, sortBy: string) => {
    if (sortBy === 'wealth') return Math.floor(agent.monBalance);
    if (sortBy === 'wins') return agent.stats?.wins || 0;
    return agent.stats?.totalActions || 0;
};

const getLabel = (sortBy: string) => {
    if (sortBy === 'wealth') return 'MON';
    if (sortBy === 'wins') return 'WINS';
    return 'ACTS';
};

export default LeaderboardPage;
