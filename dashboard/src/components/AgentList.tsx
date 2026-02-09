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
    };
}

interface Props {
    agents: Record<string, Agent>;
}

const AgentList: React.FC<Props> = ({ agents }) => {
    const agentList = Object.values(agents || {}).sort((a, b) => b.monBalance - a.monBalance);

    return (
        <div className="agent-list">
            {agentList.length === 0 ? (
                <div className="no-agents">No agents in the world yet...</div>
            ) : (
                <div className="agents-container">
                    {agentList.map((agent, index) => (
                        <div key={agent.id} className="agent-card">
                            <div className="agent-rank">#{index + 1}</div>
                            <div className="agent-info">
                                <div className="agent-name">{agent.name}</div>
                                <div className="agent-location"> {(agent.locationId || 'unknown').replace('_', ' ')}</div>
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
