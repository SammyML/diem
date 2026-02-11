import React, { useEffect, useRef } from 'react';
import './EventLog.css';

export interface WorldEvent {
    id: string;
    timestamp: number;
    type: string;
    agentId: string;
    description: string;
}

interface EventLogProps {
    events: WorldEvent[];
}

export const EventLog: React.FC<EventLogProps> = ({ events }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [events]);

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'agent_joined': return '👋';
            case 'agent_moved': return '👣';
            case 'resource_gathered': return '⛏️';
            case 'item_crafted': return '🔨';
            case 'trade_completed': return '💰';
            case 'combat_attack': return '⚔️';
            case 'combat_death': return '💀';
            case 'mon_earned': return '💵';
            default: return '•';
        }
    };

    const getEventColor = (type: string) => {
        if (type.includes('combat')) return 'event-combat';
        if (type.includes('trade') || type.includes('mon')) return 'event-economy';
        if (type.includes('craft')) return 'event-craft';
        if (type.includes('gather')) return 'event-gather';
        return 'event-info';
    };

    return (
        <div className="event-log-container">
            <div className="event-log-header">
                <h3>EVENT LOG</h3>
                <div className="live-indicator">● LIVE</div>
            </div>
            <div className="event-list">
                {events.map(event => (
                    <div key={event.id} className={`event-item ${getEventColor(event.type)}`}>
                        <span className="event-time">
                            {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="event-icon">{getEventIcon(event.type)}</span>
                        <span className="event-desc">{event.description}</span>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};
