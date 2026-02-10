import React from 'react';
import './AgentList.css';

interface Agent {
    id: string;
    name: string;
    locationId: string;
    monBalance: number;
    stats?: {
        miningSkill?: number;
        gatheringSkill?: number;
        craftingSkill?: number;
        tradingSkill?: number;
        totalActions?: number;
        // Combat Stats
        hp?: number;
        maxHp?: number;
        attack?: number;
        defense?: number;
        wins?: number;
        losses?: number;
    };
}

interface Props {
    agents: Record<string, Agent>;
}

const AgentList: React.FC<Props> = ({ agents }) => {
    // Sort by wins (glory) then balance
    const agentList = Object.values(agents || {}).sort((a, b) => {
        const winsA = a.stats?.wins || 0;
        const winsB = b.stats?.wins || 0;
        if (winsA !== winsB) return winsB - winsA;
        return b.monBalance - a.monBalance;
    });

    return (
        <div className="agent-list">
            <h3 className="section-title">ACTIVE AGENTS</h3>
            {agentList.length === 0 ? (
                <div className="empty-state">No agents in the world yet...</div>
            ) : (
                <div className="agents-container">
                    {agentList.map((agent, index) => (
                        <div key={agent.id} className="agent-card">
                            <div className="agent-rank">#{index + 1}</div>
                            <div className="agent-info">
                                <div className="agent-header">
                                    <span className="agent-name">{agent.name}</span>
                                    {agent.locationId === 'arena' && <span className="arena-badge">⚔️ In Arena</span>}
                                </div>
                                <div className="agent-stats-row">
                                    <span className="stat-pill">
                                        ❤️ {agent.stats?.hp ?? 100}/{agent.stats?.maxHp ?? 100}
                                    </span>
                                    <span className="stat-pill">
                                        ⚔️ {agent.stats?.attack ?? 10}
                                    </span>
                                    <span className="stat-pill">
                                        🛡️ {agent.stats?.defense ?? 5}
                                    </span>
                                    <span className="stat-pill win-record">
                                        🏆 {agent.stats?.wins ?? 0}W - {agent.stats?.losses ?? 0}L
                                    </span>
                                </div>
                            </div>
                            <div className="agent-balance">
                                <div className="balance-value">{agent.monBalance.toFixed(0)}</div>
                                <div className="balance-label">MON</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AgentList;
