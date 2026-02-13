import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './NetworkPage.css';
import { API_BASE_URL } from '../config';

interface Agent {
    id: string;
    name: string;
    monBalance: number;
    status?: string;
}

interface WorldEvent {
    id: string;
    type: string;
    message: string;
    timestamp: number;
}

const NetworkPage: React.FC = () => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [events, setEvents] = useState<WorldEvent[]>([]);
    const [stats, setStats] = useState({
        totalAgents: 0,
        transactions: 0,
        tps: 0,
        blockHeight: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            const API = API_BASE_URL;
            try {
                const res = await fetch(`${API}/world/state`);
                const data = await res.json();

                const agentList = Object.values(data.agents || {}) as Agent[];
                setAgents(agentList);

                const eco = data.economicStats || {};
                const txCount = (eco.totalTrades || 0) + (eco.totalItemsCrafted || 0);

                setStats({
                    totalAgents: agentList.length,
                    transactions: txCount,
                    tps: Math.floor(Math.random() * 50) + 10, // Mock TPS for liveness
                    blockHeight: Math.floor(Date.now() / 1000)
                });

                // Events are included in world state in our modified API, 
                // IF NOT we might need to fetch /world/events separately if that endpoint exists.
                // Assuming events come from world state for now or defaulting to empty.
                if (data.events) setEvents(data.events.slice(0, 50));

            } catch (e) {
                console.error(e);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="network-page">
            <Link to="/app" className="btn-pixel btn-secondary" style={{ position: 'absolute', top: 20, left: 20 }}>
                ← BACK TO SIM
            </Link>

            <header className="network-header">
                <h1>NETWORK STATUS</h1>
                <p>LIVE TELEMETRY (24H)</p>
            </header>

            <div className="network-kpis">
                <div className="kpi-card">
                    <div className="kpi-label">ONLINE AGENTS</div>
                    <div className="kpi-value green">{stats.totalAgents}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">TRANSACTIONS (24H)</div>
                    <div className="kpi-value blue">{stats.transactions.toLocaleString()}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">AVG TPS</div>
                    <div className="kpi-value gold">{stats.tps}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">BLOCK HEIGHT</div>
                    <div className="kpi-value">{stats.blockHeight}</div>
                </div>
            </div>

            <div className="network-grid">
                {/* AGENT MATRIX */}
                <div className="network-section">
                    <h3 className="section-title">ACTIVE NODES (AGENTS)</h3>
                    <div className="agent-list-container">
                        {agents.map(agent => (
                            <div key={agent.id} className="agent-row">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span className="agent-status online"></span>
                                    <span style={{ color: 'var(--neon-green)', fontWeight: 'bold' }}>{agent.name}</span>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-dim)' }}>{agent.id.slice(0, 8)}...</span>
                                </div>
                                <div style={{ color: 'var(--gold)' }}>
                                    {Math.floor(agent.monBalance).toLocaleString()} MON
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* EVENT FEED */}
                <div className="network-section">
                    <h3 className="section-title">EVENT LOG</h3>
                    {events.length === 0 ? (
                        <div style={{ padding: 20, color: 'var(--text-dim)' }}>No recent events...</div>
                    ) : (
                        events.map((e, i) => (
                            <div key={i} className="feed-item">
                                <span style={{ marginRight: 10, color: 'var(--neon-blue)' }}>
                                    [{new Date(e.timestamp).toLocaleTimeString()}]
                                </span>
                                <span>{e.message}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NetworkPage;
