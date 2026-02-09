import React, { useState, useEffect } from 'react';
import './App.css';
import WorldMap from './components/WorldMap';
import EventFeed from './components/EventFeed';
import EconomyStats from './components/EconomyStats';
import AgentList from './components/AgentList';

const API_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

interface WorldState {
    locations: any;
    agents: any;
    economicStats: any;
    events: any[];
}

function App() {
    const [worldState, setWorldState] = useState<WorldState | null>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        // Fetch initial world state
        fetchWorldState();

        // Connect to WebSocket for real-time updates
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log('Connected to Diem world');
            setConnected(true);
        };

        ws.onmessage = (message) => {
            const data = JSON.parse(message.data);

            if (data.type === 'WORLD_STATE') {
                setWorldState(data.state);
            } else if (data.type === 'WORLD_EVENT') {
                setEvents(prev => [data.event, ...prev].slice(0, 50));
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from Diem world');
            setConnected(false);
        };

        // Cleanup
        return () => {
            ws.close();
        };
    }, []);

    const fetchWorldState = async () => {
        try {
            const response = await fetch(`${API_URL}/world/state`);
            const data = await response.json();
            setWorldState(data);

            // Fetch recent events
            const eventsResponse = await fetch(`${API_URL}/world/events`);
            const eventsData = await eventsResponse.json();
            setEvents(eventsData.events || []);
        } catch (error) {
            console.error('Failed to fetch world state:', error);
        }
    };

    if (!worldState) {
        return (
            <div className="loading">
                <h2>Loading Diem Virtual World...</h2>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="App">
            <header className="App-header">
                <h1>Diem Virtual World</h1>
                <div className="status">
                    <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
                        {connected ? ' Connected' : ' Disconnected'}
                    </span>
                </div>
            </header>

            <div className="dashboard-grid">
                <div className="panel world-map-panel">
                    <div className="panel-header">
                        <h2>World Map</h2>
                        <div className="header-decoration">LIVE SATELLITE</div>
                    </div>
                    <div className="panel-content">
                        <WorldMap locations={worldState.locations} agents={worldState.agents} />
                    </div>
                </div>

                <div className="panel event-feed-panel">
                    <div className="panel-header">
                        <h2>System Log</h2>
                        <div className="header-decoration">REAL-TIME</div>
                    </div>
                    <div className="panel-content" style={{ padding: 0 }}>
                        <EventFeed events={events} />
                    </div>
                </div>

                <div className="panel economy-panel">
                    <div className="panel-header">
                        <h2>Economy Metrics</h2>
                        <div className="header-decoration">MARKET STATUS</div>
                    </div>
                    <div className="panel-content">
                        <EconomyStats stats={worldState.economicStats} />
                    </div>
                </div>

                <div className="panel agents-panel">
                    <div className="panel-header">
                        <h2>Active Units</h2>
                        <div className="header-decoration">ONLINE: {worldState.agents ? Object.keys(worldState.agents).length : 0}</div>
                    </div>
                    <div className="panel-content">
                        <AgentList agents={worldState.agents} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
