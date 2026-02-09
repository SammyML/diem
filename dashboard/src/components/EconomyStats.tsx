import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './EconomyStats.css';

interface EconomicStats {
    totalMonInCirculation: number;
    totalResourcesGathered: number;
    totalItemsCrafted: number;
    totalTrades: number;
}

interface Props {
    stats: EconomicStats;
}

const EconomyStats: React.FC<Props> = ({ stats }) => {
    // Mock data for chart - in real app, this would come from historical data
    const chartData = [
        { time: '10m ago', mon: stats.totalMonInCirculation * 0.7 },
        { time: '8m ago', mon: stats.totalMonInCirculation * 0.8 },
        { time: '6m ago', mon: stats.totalMonInCirculation * 0.85 },
        { time: '4m ago', mon: stats.totalMonInCirculation * 0.9 },
        { time: '2m ago', mon: stats.totalMonInCirculation * 0.95 },
        { time: 'now', mon: stats.totalMonInCirculation }
    ];

    return (
        <div className="economy-stats">
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">$</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.totalMonInCirculation.toFixed(0)}</div>
                        <div className="stat-label">Total MON</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">Rs</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.totalResourcesGathered}</div>
                        <div className="stat-label">Resources Gathered</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">*</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.totalItemsCrafted}</div>
                        <div className="stat-label">Items Crafted</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon"></div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.totalTrades}</div>
                        <div className="stat-label">Tx Trades Completed</div>
                    </div>
                </div>
            </div>

            <div className="chart-container">
                <h3>MON Circulation Over Time</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
                        <YAxis stroke="rgba(255,255,255,0.5)" />
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(0,0,0,0.8)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px'
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="mon"
                            stroke="#4CAF50"
                            strokeWidth={2}
                            dot={{ fill: '#4CAF50', r: 4 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default EconomyStats;
