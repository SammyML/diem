import WebSocket from 'ws';
import { Server as HttpServer } from 'http';
import { WorldStateManager } from '../core/world-state';
import { EventType, WorldEvent } from '../types';

/**
 * WebSocket server for real-time updates
 */
export class WebSocketServer {
    private wss: WebSocket.Server;
    private clients: Set<WebSocket>;
    private worldState: WorldStateManager;

    constructor(httpServer: HttpServer, worldState: WorldStateManager) {
        this.wss = new WebSocket.Server({ server: httpServer });
        this.clients = new Set();
        this.worldState = worldState;

        this.setupWebSocket();
        this.subscribeToWorldEvents();
    }

    private setupWebSocket(): void {
        this.wss.on('connection', (ws: WebSocket) => {
            console.log('New WebSocket client connected');
            this.clients.add(ws);

            // Send initial world state
            this.sendToClient(ws, {
                type: 'WORLD_STATE',
                state: { // Changed from data to state to match App.tsx
                    locations: Array.from(this.worldState.getState().locations.values()),
                    agents: Object.fromEntries(this.worldState.getState().agents),
                    economicStats: this.worldState.getState().economicStats,
                    events: this.worldState.getState().events,
                    startTime: this.worldState.getState().startTime,
                    lastUpdate: this.worldState.getState().lastUpdate
                }
            });

            ws.on('message', (message: string) => {
                try {
                    const data = JSON.parse(message.toString());
                    this.handleClientMessage(ws, data);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            });

            ws.on('close', () => {
                console.log('WebSocket client disconnected');
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
            });
        });

        // Broadcast full state every 2 seconds to keep UI in sync
        setInterval(() => {
            this.broadcast({
                type: 'WORLD_STATE',
                state: {
                    locations: Array.from(this.worldState.getState().locations.values()),
                    agents: Object.fromEntries(this.worldState.getState().agents),
                    economicStats: this.worldState.getState().economicStats,
                    startTime: this.worldState.getState().startTime,
                    lastUpdate: this.worldState.getState().lastUpdate
                }
            });
        }, 2000);
    }

    private handleClientMessage(ws: WebSocket, data: any): void {
        switch (data.type) {
            case 'SUBSCRIBE_LOCATION':
                // Client wants updates for specific location
                this.sendToClient(ws, {
                    type: 'SUBSCRIBED',
                    data: { locationId: data.locationId }
                });
                break;

            case 'PING':
                this.sendToClient(ws, { type: 'PONG', timestamp: Date.now() });
                break;

            default:
                console.log('Unknown message type:', data.type);
        }
    }

    private subscribeToWorldEvents(): void {
        // Subscribe to all event types
        const eventTypes = Object.values(EventType);

        eventTypes.forEach(eventType => {
            this.worldState.on(eventType, (event: WorldEvent) => {
                this.broadcastEvent(event);
            });
        });
    }

    /**
     * Broadcast event to all connected clients
     */
    public broadcastEvent(event: any): void {
        // Send as an object, broadcast will stringify it
        this.broadcast({
            type: 'WORLD_EVENT',
            event: event // Changed from payload to event to match App.tsx
        });
    }

    private broadcast(data: any): void {
        const message = JSON.stringify(data);

        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    private sendToClient(ws: WebSocket, data: any): void {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }

    public getClientCount(): number {
        return this.clients.size;
    }
}
