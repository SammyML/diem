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

    const spawnAgent = async (type: 'miner' | 'arena' | 'trader' | 'crafter') => {
        const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        try {
            await fetch(`${API}/admin/spawn`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });
            alert(`Spawning ${type} agent...`);
        } catch (e) {
            console.error(e);
            alert('Failed to spawn agent');
        }
    };

    return (
        <div className="agent-list">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 className="section-title" style={{ marginBottom: 0 }}>ACTIVE AGENTS</h3>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => spawnAgent('miner')} className="btn-spawn" title="Spawn Miner">
                        +MINE
                    </button>
                    <button onClick={() => spawnAgent('trader')} className="btn-spawn" title="Spawn Trader">
                        +TRADE
                    </button>
                    <button onClick={() => spawnAgent('crafter')} className="btn-spawn" title="Spawn Crafter">
                        +CRAFT
                    </button>
                    <button onClick={() => spawnAgent('arena')} className="btn-spawn" title="Spawn Gladiator">
                        +FIGHT
                    </button>
                </div>
            </div>
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
                                    {agent.locationId === 'arena' && <span className="arena-badge">IN ARENA</span>}
                                </div>
                                <div className="agent-stats-row">
                                    <span className="stat-pill">
                                        HP {agent.stats?.hp ?? 100}/{agent.stats?.maxHp ?? 100}
                                    </span>
                                    <span className="stat-pill">
                                        ATK {agent.stats?.attack ?? 10}
                                    </span>
                                    <span className="stat-pill">
                                        DEF {agent.stats?.defense ?? 5}
                                    </span>
                                    <span className="stat-pill win-record">
                                        {agent.stats?.wins ?? 0}W - {agent.stats?.losses ?? 0}L
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
            )
            }
        </div>
    );
};

export default AgentList;
