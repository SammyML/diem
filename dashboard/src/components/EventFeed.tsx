import React from 'react';
import './EventFeed.css';

interface WorldEvent {
    id: string;
    type: string;
    agentId: string;
    agentName?: string;
    timestamp: number;
    message: string;
    monChange?: number;
}

interface Props {
    events: WorldEvent[];
}

const EVENT_ICONS: Record<string, string> = {
    AGENT_ENTERED: '>',
    AGENT_MOVED: '->',
    RESOURCE_GATHERED: '+',
    ITEM_CRAFTED: '*',
    ITEM_TRADED: '$',
    AGENT_RESTED: 'z',
    default: '.'
};

const EventFeed: React.FC<Props> = ({ events }) => {
    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div className="event-feed">
            {events.length === 0 ? (
                <div className="no-events">Waiting for system events...</div>
            ) : (
                <div className="events-list">
                    {events.map((event) => (
                        <div key={event.id} className={`event-item event-${event.type.toLowerCase()}`}>
                            <span className="event-timestamp">[{formatTimestamp(event.timestamp)}]</span>
                            <div className="event-content">
                                <span className="event-message">
                                    {event.message}
                                    {event.monChange !== undefined && event.monChange !== 0 && (
                                        <span className={`event-mon-change ${event.monChange > 0 ? 'positive' : 'negative'}`}>
                                            {event.monChange > 0 ? '+' : ''}{event.monChange} MON
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>
                    ))}
                    <div className="terminal-cursor">_</div>
                </div>
            )}
        </div>
    );
};

export default EventFeed;
