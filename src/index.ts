import * as dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { WorldStateManager } from './core/world-state';
import { TokenLedger } from './token/token-ledger';
import { PaymentGateway } from './token/payment-gateway';
import { ActionProcessor } from './api/action-processor';
import { ApiServer } from './api/api-server';
import { WebSocketServer } from './api/websocket-server';
import { worldBossManager } from './mechanics/world-boss';
import { EventType } from './types';

/**
 * Main entry point for Diem virtual world
 */
async function main() {
    console.log('Starting Diem Virtual World...\n');

    // Initialize core systems
    const worldState = new WorldStateManager();
    const tokenLedger = new TokenLedger();
    const paymentGateway = new PaymentGateway(tokenLedger);
    const actionProcessor = new ActionProcessor(worldState, tokenLedger);

    // Create API server
    const apiServer = new ApiServer(
        worldState,
        tokenLedger,
        paymentGateway,
        actionProcessor
    );

    // Create HTTP server
    const httpServer = createServer(apiServer.getApp());

    // Create WebSocket server
    const wsServer = new WebSocketServer(httpServer, worldState);

    // Start server
    const PORT = process.env.PORT || process.env.API_PORT || 3000;
    httpServer.listen(PORT, () => {
        console.log('Diem Virtual World is running!\n');
        console.log(`API Server: http://localhost:${PORT}`);
        console.log(`WebSocket: ws://localhost:${PORT}`);
        console.log(`\nAPI Endpoints:`);
        console.log(`   GET  /world/state - Get world state`);
        console.log(`   GET  /world/locations - List all locations`);
        console.log(`   GET  /world/events - Get recent events`);
        console.log(`   POST /agent/enter - Join the world`);
        console.log(`   POST /agent/action - Submit action`);
        console.log(`   GET  /leaderboard - Top agents by MON`);
        console.log(`\nEntry Fee: ${tokenLedger.getEntryFee()} MON`);
        console.log(`\nReady for agents to enter!\n`);
    });

    // Cleanup expired sessions periodically
    setInterval(() => {
        const cleaned = paymentGateway.cleanupExpiredSessions();
        if (cleaned > 0) {
            console.log(`Cleaned up ${cleaned} expired sessions`);
        }
    }, 60000); // Every minute

    // Save world state periodically
    setInterval(() => {
        worldState.saveState();
        console.log(' World state saved');
    }, 30000); // Every 30 seconds

    // Check for Titan Respawn
    setInterval(() => {
        if (worldBossManager.shouldRespawn()) {
            console.log('⚔️ THE TITAN RELOADS! Broadasting global event...');
            worldBossManager.spawnBoss();

            // Broadcast Event
            wsServer.broadcastEvent({
                id: `evt_boss_${Date.now()}`,
                type: EventType.AGENT_JOINED, // Reusing event type for visibility, or create new one
                agentId: 'system',
                locationId: 'boss_arena',
                timestamp: Date.now(),
                description: "💀 THE TITAN HAS RETURNED! Gather your forces!",
                data: { bossId: worldBossManager.getBossState()?.bossId }
            });
        }
    }, 60000); // Check every minute

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nShutting down gracefully...');
        worldState.saveState();
        console.log('Final state saved');
        process.exit(0);
    });
}

// Run the server
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
