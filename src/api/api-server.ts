import express, { Request, Response } from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import { WorldStateManager } from '../core/world-state';
import { TokenLedger } from '../token/token-ledger';
import { PaymentGateway } from '../token/payment-gateway';
import { ActionProcessor } from './action-processor';
import { AgentAction, ActionType } from '../types';
import { MonadBlockchainService } from '../blockchain/monad-service';
import { worldBossManager } from '../mechanics/world-boss';
import { factionManager, Faction } from '../mechanics/factions';
import { pvpArenaManager } from '../mechanics/pvp-arena';
import { seasonManager } from '../mechanics/seasons';

/**
 * REST API Server for Diem
 */
export class ApiServer {
    private app: express.Application;
    private worldState: WorldStateManager;
    private tokenLedger: TokenLedger;
    private paymentGateway: PaymentGateway;
    private actionProcessor: ActionProcessor;
    private blockchainService?: MonadBlockchainService;

    constructor(
        worldState: WorldStateManager,
        tokenLedger: TokenLedger,
        paymentGateway: PaymentGateway,
        actionProcessor: ActionProcessor,
        blockchainService?: MonadBlockchainService
    ) {
        this.app = express();
        this.worldState = worldState;
        this.tokenLedger = tokenLedger;
        this.paymentGateway = paymentGateway;
        this.actionProcessor = actionProcessor;
        this.blockchainService = blockchainService;

        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware(): void {
        this.app.use(cors());
        this.app.use(express.json());
    }

    private setupRoutes(): void {
        // Root route
        this.app.get('/', (req, res) => {
            res.json({
                service: 'Diem API Server',
                status: 'running',
                mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
                version: '1.0.0',
                endpoints: [
                    '/health',
                    '/world/state',
                    '/world/locations'
                ]
            });
        });

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', timestamp: Date.now() });
        });

        // Get world state
        this.app.get('/world/state', (req, res) => {
            const state = this.worldState.getState();
            res.json({
                locations: Array.from(state.locations.values()),
                agentCount: state.agents.size,
                agents: Object.fromEntries(state.agents),
                events: this.worldState.getRecentEvents(50), // Send last 50 events for spectator mode
                economicStats: state.economicStats,
                startTime: state.startTime,
                lastUpdate: state.lastUpdate
            });
        });

        // Get all locations
        this.app.get('/world/locations', (req, res) => {
            const state = this.worldState.getState();
            const locations = Array.from(state.locations.values()).map(loc => {
                // Count agents at this location
                const agentCount = Array.from(state.agents.values())
                    .filter(agent => agent.locationId === loc.id).length;

                return {
                    ...loc,
                    agentCount
                };
            });
            res.json(locations);
        });

        // Get specific location
        this.app.get('/world/locations/:locationId', (req, res) => {
            const location = this.worldState.getLocation(req.params.locationId);
            if (!location) {
                return res.status(404).json({ error: 'Location not found' });
            }
            res.json(location);
        });

        // Get recent events
        this.app.get('/world/events', (req, res) => {
            const limit = parseInt(req.query.limit as string) || 50;
            const events = this.worldState.getRecentEvents(limit);
            res.json(events);
        });

        // Get leaderboard
        this.app.get('/leaderboard', (req, res) => {
            const limit = parseInt(req.query.limit as string) || 10;
            const leaderboard = this.tokenLedger.getLeaderboard(limit);

            // Enrich with agent names
            const enriched = leaderboard.map(entry => {
                const agent = this.worldState.getAgent(entry.agentId);
                return {
                    agentId: entry.agentId,
                    name: agent?.name || 'Unknown',
                    balance: entry.balance,
                    stats: agent?.stats
                };
            });

            res.json(enriched);
        });

        // Agent entry - pay fee and join world
        this.app.post('/agent/enter', (req, res) => {
            const { agentName, initialMon } = req.body;

            if (!agentName) {
                return res.status(400).json({ error: 'Agent name required' });
            }

            // Create agent with initial MON (for demo purposes)
            const agent = this.worldState.addAgent(agentName, 0);

            // Initialize MON balance
            const monAmount = initialMon || 200; // Default 200 MON (enough for entry + activities)
            this.tokenLedger.initializeBalance(agent.id, monAmount);

            // Process entry payment
            const paymentResult = this.paymentGateway.processEntry(agent.id);

            if (!paymentResult.success) {
                return res.status(400).json({ error: paymentResult.message });
            }

            res.json({
                success: true,
                agent: {
                    id: agent.id,
                    name: agent.name,
                    locationId: agent.locationId,
                    monBalance: this.tokenLedger.getBalance(agent.id)
                },
                sessionToken: paymentResult.sessionToken,
                message: paymentResult.message
            });
        });

        // Get agent info
        this.app.get('/agent/:agentId', (req, res) => {
            const agent = this.worldState.getAgent(req.params.agentId);
            if (!agent) {
                return res.status(404).json({ error: 'Agent not found' });
            }

            res.json({
                ...agent,
                monBalance: this.tokenLedger.getBalance(agent.id)
            });
        });

        // Submit agent action
        this.app.post('/agent/action', async (req, res) => {
            const { sessionToken, action } = req.body;

            if (!sessionToken) {
                return res.status(401).json({ error: 'Session token required' });
            }

            // Validate session
            const validation = this.paymentGateway.validateSession(sessionToken);
            if (!validation.valid) {
                return res.status(401).json({ error: validation.message });
            }

            const agentId = validation.agentId!;

            // Parse action
            const agentAction: AgentAction = {
                agentId,
                type: action.type as ActionType,
                targetLocationId: action.targetLocationId,
                targetResourceType: action.targetResourceType,
                craftingRecipe: action.craftingRecipe,
                tradeOffer: action.tradeOffer
            };

            // Process action
            const result = await this.actionProcessor.processAction(agentAction);

            // Get updated agent state
            const agent = this.worldState.getAgent(agentId);

            res.json({
                ...result,
                agent: agent ? {
                    ...agent,
                    monBalance: this.tokenLedger.getBalance(agentId)
                } : undefined
            });
        });

        // Blockchain Agent Entry
        this.app.post('/agent/enter/blockchain', async (req, res) => {
            const { agentName, walletAddress } = req.body;

            if (!agentName || !walletAddress) {
                return res.status(400).json({ error: 'Name and wallet required' });
            }

            const agentId = walletAddress.toLowerCase();
            let agent = this.worldState.getAgent(agentId);

            if (!agent) {
                // Create agent in local state (Mon balance will act as cache)
                // Use wallet address as ID for easy mapping
                agent = {
                    id: agentId,
                    name: agentName,
                    locationId: 'market_square',
                    monBalance: 0,
                    inventory: [],
                    stats: {
                        miningSkill: 0,
                        gatheringSkill: 0,
                        craftingSkill: 0,
                        tradingSkill: 0,
                        totalActions: 0,
                        // Combat Init
                        hp: 100,
                        maxHp: 100,
                        attack: 10,
                        defense: 5,
                        wins: 0,
                        losses: 0
                    },
                    joinedAt: Date.now(),
                    lastAction: Date.now()
                };
                this.worldState.updateAgent(agentId, agent);
            }

            res.json({
                success: true,
                agent,
                message: 'Agent registered for blockchain mode'
            });
        });

        // Blockchain Agent Action
        this.app.post('/agent/action/blockchain', async (req, res) => {
            const { walletAddress, action } = req.body;

            if (!walletAddress || !this.blockchainService) {
                return res.status(400).json({ error: 'Invalid request or blockchain service not verified' });
            }

            const agentId = walletAddress.toLowerCase();
            const agent = this.worldState.getAgent(agentId);

            if (!agent) {
                return res.status(404).json({ error: 'Agent not found locally' });
            }

            // Execute logic locally
            const agentAction: AgentAction = {
                agentId,
                type: action.type as ActionType,
                targetLocationId: action.targetLocationId,
                targetResourceType: action.targetResourceType,
                craftingRecipe: action.craftingRecipe,
                tradeOffer: action.tradeOffer
            };

            // Capture logic result (but override rewards for on-chain)
            const logicResult = await this.actionProcessor.processAction(agentAction);

            if (!logicResult.success) {
                return res.json(logicResult);
            }

            // Game Master Logic: If action earned MON, trigger on-chain reward
            if (logicResult.success && logicResult.monEarned && logicResult.monEarned > 0) {
                try {
                    const rewardAmount = logicResult.monEarned;
                    const actionType = action.type.charAt(0).toUpperCase() + action.type.slice(1);

                    // Trigger transaction (Server pays gas)
                    console.log(`GM issuing reward to ${agentId}: ${rewardAmount} MON`);
                    const txHash = await this.blockchainService.distributeReward(
                        walletAddress,
                        rewardAmount,
                        `${actionType} reward`
                    );

                    logicResult.message += ` (Reward TX: ${txHash.substring(0, 10)}...)`;
                } catch (error) {
                    console.error('Blockchain reward failed:', error);
                    logicResult.message += ' (Blockchain reward pending/failed)';
                }
            }

            res.json(logicResult);
        });

        // Get agent transactions
        this.app.get('/agent/:agentId/transactions', (req, res) => {
            const limit = parseInt(req.query.limit as string) || 50;
            const transactions = this.tokenLedger.getTransactionHistory(req.params.agentId, limit);
            res.json(transactions);
        });

        // Get economic stats
        this.app.get('/economy/stats', (req, res) => {
            const state = this.worldState.getState();
            res.json({
                ...state.economicStats,
                totalMonInCirculation: this.tokenLedger.getTotalCirculation(),
                activeSessions: this.paymentGateway.getActiveSessionCount()
            });
        });

        // World Boss Endpoints

        // Get boss status
        this.app.get('/boss/status', (req, res) => {
            const bossState = worldBossManager.getBossState();
            const bossSummary = worldBossManager.getBossSummary();
            const recentAttacks = worldBossManager.getRecentAttacks();

            res.json({
                boss: bossSummary,
                state: bossState,
                recentAttacks
            });
        });

        // Attack boss
        this.app.post('/boss/attack', (req, res) => {
            const { agentId, damage } = req.body;

            if (!agentId) {
                return res.status(400).json({ error: 'Agent ID required' });
            }

            const agent = this.worldState.getAgent(agentId);
            if (!agent) {
                return res.status(404).json({ error: 'Agent not found' });
            }

            // Process attack
            const attackDamage = damage || Math.floor(Math.random() * 90) + 10;
            const result = worldBossManager.attackBoss(agentId, attackDamage);

            res.json({
                success: result.success,
                message: result.message,
                boss: {
                    health: result.remainingHealth,
                    isDefeated: result.isDefeated
                }
            });
        });

        // Spawn new boss
        this.app.post('/boss/spawn', (req, res) => {
            worldBossManager.spawnBoss();
            const bossSummary = worldBossManager.getBossSummary();

            res.json({
                success: true,
                message: 'Boss spawned successfully',
                boss: bossSummary
            });
        });

        // Faction Endpoints

        // Join faction
        this.app.post('/faction/join', (req, res) => {
            const { agentId, faction } = req.body;

            if (!agentId || !faction) {
                return res.status(400).json({ error: 'Agent ID and faction required' });
            }

            const agent = this.worldState.getAgent(agentId);
            if (!agent) {
                return res.status(404).json({ error: 'Agent not found' });
            }

            const result = factionManager.joinFaction(agentId, faction as Faction);

            res.json({
                success: result.success,
                message: result.message,
                bonuses: result.bonuses
            });
        });

        // Get faction status
        this.app.get('/faction/status/:agentId', (req, res) => {
            const agentId = req.params.agentId;
            const faction = factionManager.getAgentFaction(agentId);
            const bonuses = factionManager.getFactionBonuses(agentId);
            const points = factionManager.getAgentPoints(agentId);

            res.json({
                faction,
                bonuses,
                points
            });
        });

        // Get faction leaderboard
        this.app.get('/faction/leaderboard', (req, res) => {
            const summary = factionManager.getFactionSummary();
            res.json(summary);
        });

        // PvP Arena Endpoints

        // Create arena challenge
        this.app.post('/arena/challenge', (req, res) => {
            const { agentId, wager } = req.body;

            if (!agentId || !wager) {
                return res.status(400).json({ error: 'Agent ID and wager required' });
            }

            const result = pvpArenaManager.createChallenge(agentId, wager);
            res.json(result);
        });

        // Accept arena challenge
        this.app.post('/arena/accept', (req, res) => {
            const { battleId, agentId } = req.body;

            if (!battleId || !agentId) {
                return res.status(400).json({ error: 'Battle ID and agent ID required' });
            }

            const result = pvpArenaManager.acceptChallenge(battleId, agentId);
            res.json(result);
        });

        // Fight in arena
        this.app.post('/arena/fight', (req, res) => {
            const { battleId } = req.body;

            if (!battleId) {
                return res.status(400).json({ error: 'Battle ID required' });
            }

            const battle = pvpArenaManager.getBattle(battleId);
            if (!battle || !battle.challenger || !battle.opponent) {
                return res.status(400).json({ error: 'Invalid battle or missing participants' });
            }

            const challenger = this.worldState.getAgent(battle.challenger);
            const opponent = this.worldState.getAgent(battle.opponent);

            if (!challenger || !opponent) {
                return res.status(404).json({ error: 'One or more agents not found' });
            }

            const result = pvpArenaManager.simulateCombat(battleId, challenger, opponent);

            // If combat finished, update World State (HP, Mon, etc)
            if (result.success && result.winner) {
                // Award winner (already handled in manager? No, manager returns result)
                // We need to apply the payouts here or in manager?
                // Manager calculatePayouts exists.

                const payouts = pvpArenaManager.calculatePayouts(battleId);

                // Pay Winner
                this.tokenLedger.award(result.winner, payouts.winnerPayout, `Arena Win: ${battleId}`);
                this.worldState.updateMonBalance(result.winner, payouts.winnerPayout, 'arena_win');
                this.worldState.updateStats(result.winner, { wins: (this.worldState.getAgent(result.winner)?.stats.wins || 0) + 1 });

                const loser = result.winner === challenger.id ? opponent.id : challenger.id;
                this.worldState.updateStats(loser, { losses: (this.worldState.getAgent(loser)?.stats.losses || 0) + 1 });

                // Pay Spectators
                payouts.spectatorPayouts.forEach((amount, spectatorId) => {
                    this.tokenLedger.award(spectatorId, amount, `Arena Bet Win: ${battleId}`);
                });

                result.message += ` Payouts distributed. Winner gets ${payouts.winnerPayout} MON.`;
            }

            res.json(result);
        });

        // Place spectator bet
        this.app.post('/arena/bet', (req, res) => {
            const { battleId, spectator, betOn, amount } = req.body;

            if (!battleId || !spectator || !betOn || !amount) {
                return res.status(400).json({ error: 'All fields required' });
            }

            const result = pvpArenaManager.placeBet(battleId, spectator, betOn, amount);
            res.json(result);
        });

        // Get open battles
        this.app.get('/arena/battles/open', (req, res) => {
            const battles = pvpArenaManager.getOpenBattles();
            res.json(battles);
        });

        // Get active battles
        this.app.get('/arena/battles/active', (req, res) => {
            const battles = pvpArenaManager.getActiveBattles();
            res.json(battles);
        });

        // Season Endpoints

        // Get current season
        this.app.get('/season/current', (req, res) => {
            const summary = seasonManager.getSeasonSummary();
            res.json(summary);
        });

        // Get season leaderboard
        this.app.get('/season/leaderboard', (req, res) => {
            const limit = parseInt(req.query.limit as string) || 10;
            const leaderboard = seasonManager.getLeaderboard(limit);
            res.json(leaderboard);
        });

        // Get agent rank
        this.app.get('/season/rank/:agentId', (req, res) => {
            const rank = seasonManager.getAgentRank(req.params.agentId);
            res.json(rank);
        });

        // Get agent prestige
        this.app.get('/season/prestige/:agentId', (req, res) => {
            const prestige = seasonManager.getPrestige(req.params.agentId);
            res.json({ prestige });
        });

        // ============ Admin Endpoints ============

        this.app.post('/admin/spawn', (req, res) => {
            const { type } = req.body; // 'miner', 'arena', 'trader', 'crafter'

            const ALLOWED_TYPES = ['miner', 'arena', 'trader', 'crafter'];

            if (!type || !ALLOWED_TYPES.includes(type)) {
                return res.status(400).json({ error: `Invalid agent type. Use: ${ALLOWED_TYPES.join(', ')}` });
            }

            // Determine if we are in production or development
            // In production (Render), we run from 'dist/src/api/api-server.js' (or similar), so we need to find 'dist/examples/agents/...'
            // In development, we run 'src/api/api-server.ts' via ts-node, so we need 'examples/agents/...'

            const isProduction = process.env.NODE_ENV === 'production' || __dirname.includes('dist');

            let command = 'npx';
            let args: string[] = [];
            let cwd = path.join(__dirname, '../../'); // Default to root

            if (isProduction) {
                // Production: Run compiled JS with node
                // Assuming structure:
                // root/dist/src/api/api-server.js -> __dirname
                // root/dist/examples/agents/xxx-agent.js -> Target

                const scriptPath = path.join(__dirname, `../../examples/agents/${type}-agent.js`);

                console.log(`[Prod] Spawning ${type} agent from ${scriptPath}`);

                command = 'node';
                args = [scriptPath];
                // cwd stays as root of the project (where node_modules are) or can be inferred
            } else {
                // Development: Run TS with ts-node
                const scriptPath = path.join(__dirname, `../../examples/agents/${type}-agent.ts`);

                console.log(`[Dev] Spawning ${type} agent from ${scriptPath}`);

                command = 'npx';
                args = ['ts-node', scriptPath];
            }

            console.log(`Executing: ${command} ${args.join(' ')}`);

            try {
                const child = spawn(command, args, {
                    cwd: cwd,
                    stdio: 'inherit', // Changed to inherit to see logs in Render console
                    detached: true,
                    shell: true      // Needed for npx on Windows, and helpful generally
                });

                child.on('error', (err) => {
                    console.error('Failed to spawn agent process:', err);
                });

                child.unref();

                res.json({
                    success: true,
                    message: `Spawned ${type} agent (PID: ${child.pid})`
                });
            } catch (error: any) {
                console.error('Spawn error:', error);
                res.status(500).json({ error: `Failed to spawn agent: ${error.message}` });
            }
        });
    }

    public start(port: number = 3000): void {
        this.app.listen(port, () => {
            console.log(`Diem API Server running on port ${port}`);
            console.log(`Dashboard: http://localhost:${port}/world/state`);
        });
    }

    public getApp(): express.Application {
        return this.app;
    }
}
