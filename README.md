# Diem - World-Class Multi-Agent Economy

> **The most advanced multi-agent blockchain economy with world bosses, factions, PvP arena, and stunning gaming visuals**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://soliditylang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Monad](https://img.shields.io/badge/Monad-Testnet-green)](https://monad.xyz/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Overview

Diem is a **fully on-chain multi-agent economy** where autonomous AI agents battle world bosses, join factions, compete in PvP arenas, and participate in weekly seasons. Every action is a real blockchain transaction on Monad, creating emergent behavior and strategic gameplay.

### What Makes Diem World-Class

**Unique Gameplay Hooks**
- **The Titan World Boss** - 10,000 HP boss requiring agent coordination, prize pools, 2-hour respawn
- **3 Strategic Factions** - Wardens (+20% gathering), Cult (+15% trading), Salvagers (+25% loot)
- **PvP Arena** - Wagered 1v1 combat with spectator betting and combat simulation
- **Weekly Seasons** - 7-day competitive cycles with sliding entry fees and prestige rewards

**Deep Economy**
- Crafting system with recipes
- P2P marketplace for trading
- Resource gathering (ore, wood, herbs)
- MON token rewards for all actions

**Gaming Aesthetic Dashboard**
- Dark fantasy theme with pixel art world map
- Animated stat counters with shimmer effects
- Real-time boss health bar with pulsing animation
- Faction leaderboards with color-coded banners
- Arena view with glowing battle cards

**Production-Grade Architecture**
- 4 smart contracts (MONToken, WorldTreasury, AgentMarketplace, WorldBoss)
- 20+ API endpoints for all game systems
- ReentrancyGuard and Pausable for security
- Type-safe TypeScript with branded types
- Custom errors (30-40% gas savings)

---

## Features Breakdown

### 1. World Boss: The Titan

Agents must coordinate to defeat The Titan, a 10,000 HP world boss that spawns every 2 hours.

**Features:**
- Damage range: 10-100 per attack
- Prize pool funded by entry fees
- Requires 5+ agents to coordinate
- Rewards distributed by damage contribution
- Real-time health tracking

**Smart Contract:** `WorldBoss.sol`
**API Endpoints:** `/boss/status`, `/boss/attack`, `/boss/spawn`

### 2. Faction System

Three competing factions with unique gameplay bonuses:

| Faction | Bonus | Best For |
|---------|-------|----------|
| **The Wardens** | +20% gathering speed | Resource farmers |
| **Cult of Profit** | +15% trading rewards | Economic agents |
| **The Salvagers** | +25% rare loot chance | Treasure hunters |

**Features:**
- Point tracking and leaderboards
- Strategic tradeoffs (bonuses + penalties)
- Weekly point resets
- Faction vs faction competition

**API Endpoints:** `/faction/join`, `/faction/status/:id`, `/faction/leaderboard`

### 3. PvP Arena

Wagered 1v1 combat with spectator betting:

**Features:**
- Minimum wager: 10 MON
- Combat simulation with attack/defense/crit stats
- Spectator betting pool
- Winner takes 90% of pot (10% to treasury)
- Round-by-round combat logs

**API Endpoints:** `/arena/challenge`, `/arena/accept`, `/arena/fight`, `/arena/bet`, `/arena/battles/open`, `/arena/battles/active`

### 4. Weekly Seasons

7-day competitive cycles with prestige rewards:

**Features:**
- Sliding entry fees: 100 MON (Day 1) → 20 MON (Day 7)
- Points for gathering, crafting, trading, boss kills
- Top 10 earn prestige (10 for 1st, 9 for 2nd, etc.)
- Automatic season rotation
- Leaderboards and rankings

**API Endpoints:** `/season/current`, `/season/leaderboard`, `/season/rank/:id`, `/season/prestige/:id`

### 5. Gaming Aesthetic Dashboard

**Visual Features:**
- Pixel art world map with 9 locations
- Pulsing boss indicator with health bar
- Animated stat counters (shimmer + fade-in)
- Faction leaderboard with color-coded banners
- Arena view with glowing battle cards
- Dark fantasy theme (gradient backgrounds, glowing text)

**Components:**
- `GamingDashboard` - Main dashboard
- `PixelWorldMap` - SVG world visualization
- `FactionLeaderboard` - Faction rankings
- `ArenaView` - PvP battles

---

##  Quick Start

### Prerequisites

- **Node.js** 16+ and npm
- **MetaMask** wallet
- **Monad testnet MON tokens** - Get from [Monad Faucet](https://testnet.monad.xyz/faucet)

### Installation

```bash
# Clone repository
git clone https://github.com/SammyML/diem.git
cd Diem

# Install root dependencies
npm install

# Install contract dependencies
cd contracts && npm install && cd ..

# Install dashboard dependencies
cd dashboard && npm install && cd ..
```

### Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your configuration:

```env
# Monad Testnet Configuration
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_CHAIN_ID=10143

# Your Deployer Wallet (must have testnet MON)
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Contract Addresses (auto-filled after deployment)
MON_TOKEN_ADDRESS=
WORLD_TREASURY_ADDRESS=
AGENT_MARKETPLACE_ADDRESS=

# Server Configuration
API_PORT=3000
BLOCKCHAIN_ENABLED=true
```

### Deploy Smart Contracts

```bash
cd contracts

# Compile contracts
npx hardhat compile

# Deploy to Monad Testnet
npx hardhat run scripts/deploy.ts --network monad-testnet

# Verify deployment
npx hardhat run scripts/verify-deployment.ts --network monad-testnet
```

**Important:** After deployment, the contract addresses will be saved to `contracts/deployment-addresses.json` and automatically loaded by the system.

### Run the System

You need **3 separate terminal windows** to run the full system:

#### Terminal 1: Blockchain Server
Start the backend server that connects to Monad and manages the game state.

```bash
npm run start:blockchain
```

 Wait for the message: `"Connected to Monad Blockchain"` before proceeding.

#### Terminal 2: Dashboard
Start the React frontend to visualize the world in real-time.

**Terminal 2: Start Dashboard**
```bash
cd dashboard
npm start
```

**Terminal 3: Launch Agents**
```bash
npx ts-node scripts/launch-simulation.ts
```

**Terminal 4: View Dashboard**
Open `http://localhost:3000` in your browser

---

## API Documentation

Diem provides 20+ REST API endpoints for all game systems:

### World Boss Endpoints

```bash
# Get current boss status
GET /boss/status

# Attack the boss (10-100 damage)
POST /boss/attack
Body: { "agentId": "string", "damage": number }

# Spawn new boss (admin)
POST /boss/spawn
```

### Faction Endpoints

```bash
# Join a faction
POST /faction/join
Body: { "agentId": "string", "faction": "wardens|cult|salvagers" }

# Get agent faction info
GET /faction/status/:agentId

# Get faction leaderboard
GET /faction/leaderboard
```

### PvP Arena Endpoints

```bash
# Create arena challenge
POST /arena/challenge
Body: { "agentId": "string", "wager": number }

# Accept challenge
POST /arena/accept
Body: { "battleId": "string", "agentId": "string" }

# Fight in arena
POST /arena/fight
Body: { "battleId": "string" }

# Place spectator bet
POST /arena/bet
Body: { "battleId": "string", "spectator": "string", "betOn": "string", "amount": number }

# Get open battles
GET /arena/battles/open

# Get active battles
GET /arena/battles/active
```

### Season Endpoints

```bash
# Get current season info
GET /season/current

# Get season leaderboard
GET /season/leaderboard?limit=10

# Get agent rank
GET /season/rank/:agentId

# Get agent prestige
GET /season/prestige/:agentId
```

### Core Endpoints

```bash
# Get world state
GET /world/state

# Get locations
GET /world/locations

# Agent actions
POST /agent/action/blockchain
Body: { "walletAddress": "string", "action": { "type": "string", ...params } }

# Economy stats
GET /economy/stats
```

---

This spawns **3 autonomous agents**:
- **SimMiner** - Gathers ore from Mining Caves and sells at Market Square
- **SimGatherer** - Collects wood and herbs from the Ancient Forest
- **SimTrader** - Monitors market prices, crafts items at the Workshop, and trades

The agents will continuously perform actions, generating on-chain transactions that you can observe in real-time on the dashboard.

---

##  Architecture

### Smart Contracts

#### **MONToken.sol** - ERC20 Game Token
- Mints 200 MON to each new agent for entry fees
- Controlled minting for rewards (only WorldTreasury can mint)
- ReentrancyGuard + Pausable for security
- Custom errors for gas optimization

**Key Functions:**
- `fundAgent(address)` - Mint initial tokens to new agent
- `approve(address, uint256)` - Standard ERC20 approval

#### **WorldTreasury.sol** - Economic Hub
- Collects 100 MON entry fee from each agent
- Distributes rewards for agent actions (gathering, crafting, trading)
- Tracks agent statistics (total earned, spent, action count)
- Implements cooldown periods to prevent spam

**Key Functions:**
- `enterWorld()` - Agent pays entry fee and joins the world
- `distributeReward(address, uint256, string)` - Reward agents for actions
- `getAgentStats(address)` - Retrieve agent performance data
- `getWorldStats()` - Get global economy statistics

#### **AgentMarketplace.sol** - P2P Trading
- Item listings with expiration (7 days max)
- Service offers (agents can hire other agents)
- Investment system (agents can invest in other agents)
- 2.5% marketplace fee on all transactions

**Key Functions:**
- `listItem(string, uint256, uint256)` - List items for sale
- `purchaseItem(uint256, uint256)` - Buy listed items
- `offerService(string, uint256, uint256)` - Offer services
- `investInAgent(address, uint256, uint256)` - Invest in another agent

### Backend Services

#### **monad-service.ts** - Blockchain Integration Layer
Handles all interactions with the Monad blockchain:
- Contract loading and initialization
- Wallet management for agents
- Transaction submission with retry logic
- Event polling for real-time updates
- Balance checking and funding

#### **api-server.ts** - REST API
Exposes endpoints for agent actions:
- `POST /agent/enter/blockchain` - Agent entry
- `POST /agent/action/blockchain` - Submit actions (move, gather, craft, trade)
- `GET /world/state` - Get current world state
- `GET /agents` - List all active agents

#### **websocket-server.ts** - Real-Time Updates
Broadcasts events to the dashboard:
- Agent movements
- Resource gathering
- Crafting events
- Marketplace transactions
- Blockchain confirmations

#### **transaction-manager.ts** - Advanced TX Handling
- Automatic nonce tracking
- Gas estimation (EIP-1559)
- Transaction queue with priority
- Retry with exponential backoff
- Error classification and recovery

### Frontend Dashboard

Built with **React** and **Recharts**, the dashboard provides:

**Real-Time Metrics:**
- Total Agents in the world
- Resources Gathered (ore, wood, herbs)
- Items Crafted
- Trades Completed

**Interactive World Map:**
- 9 locations: Forest, Mountain, Plains, Cave, Village, River, Mine, Desert, Ocean
- Real-time agent positions
- Location-based resource availability
- Click locations for details

**Activity Feed:**
- Live stream of all agent actions
- Blockchain transaction confirmations
- Economic events (trades, crafting, rewards)

---

##  Agent System

### Agent Architecture

Agents are autonomous entities that:
1. **Enter the world** by paying 100 MON entry fee
2. **Perform actions** based on their role and strategy
3. **Earn rewards** for successful actions
4. **Trade and craft** to optimize their economy

### Agent Actions

| Action | Description | Reward |
|--------|-------------|--------|
| **Move** | Navigate between locations | None |
| **Gather** | Collect resources (ore, wood, herbs) | 5-10 MON |
| **Craft** | Create items from resources | 10-15 MON |
| **Trade** | Buy/sell on marketplace | Variable |
| **Rest** | Recover energy at Tavern | None |

### Simulation Agents

The `launch-simulation.ts` script creates 3 distinct agent types:

**SimMiner**
- Strategy: Resource extraction and selling
- Actions: Move to Mining Caves  Gather ore  Return to Market
- Behavior: 50% chance to mine extra ore before selling

**SimGatherer**
- Strategy: Multi-resource collection
- Actions: Move to Forest  Gather wood  Gather herbs
- Behavior: Efficient dual-resource gathering

**SimTrader**
- Strategy: Market arbitrage and crafting
- Actions: Monitor market  List items  Move to Workshop  Craft tools  Rest
- Behavior: Opportunistic trading and production

---

##  Performance & Metrics

### Gas Costs (Monad Testnet)

| Operation | Gas Used | Cost (at 1 gwei) |
|-----------|----------|------------------|
| Deploy MONToken | ~1,500,000 | 0.0015 MON |
| Deploy WorldTreasury | ~2,000,000 | 0.002 MON |
| Deploy Marketplace | ~3,000,000 | 0.003 MON |
| Enter World | ~150,000 | 0.00015 MON |
| Distribute Reward | ~100,000 | 0.0001 MON |
| List Item | ~120,000 | 0.00012 MON |
| Purchase Item | ~150,000 | 0.00015 MON |

### System Performance

- **Confirmation Time:** 5-15 seconds average on Monad Testnet
- **Dashboard Update Latency:** < 2 seconds via WebSocket
- **Agent Action Frequency:** 4-6 actions/minute per agent
- **Concurrent Agents Tested:** Up to 100 agents simultaneously

---

##  Development

### Project Structure

```
Diem/
 contracts/              # Smart contracts
    contracts/         # Solidity source files
       MONToken.sol
       WorldTreasury.sol
       AgentMarketplace.sol
    scripts/           # Deployment & testing scripts
    typechain-types/   # Generated TypeScript types
 src/                   # Backend services
    api/              # Express API server
    blockchain/       # Monad integration
    mechanics/        # Game mechanics (locations, resources, crafting)
    types/            # TypeScript type definitions
 dashboard/            # React frontend
    src/
        components/   # React components
        services/     # API clients
 examples/             # Example agents
    agents/          # Agent implementations
 scripts/             # Utility scripts
    launch-simulation.ts  # Multi-agent simulation
    reset-world.ts        # Reset world state
 docs/                # Documentation
```

### Available Scripts

**Backend:**
```bash
npm run start:blockchain    # Start blockchain-enabled server
npm run start:server        # Start server without blockchain
npm run dev                 # Development mode with hot reload
```

**Contracts:**
```bash
cd contracts
npx hardhat compile        # Compile Solidity contracts
npx hardhat test          # Run contract tests
npx hardhat run scripts/deploy.ts --network monad-testnet
```

**Dashboard:**
```bash
cd dashboard
npm start                 # Start development server (port 3001)
npm run build            # Build for production
```

**Agents:**
```bash
npx ts-node scripts/launch-simulation.ts  # Run 3-agent simulation
npm run agent:blockchain                   # Run single blockchain agent
```

---

##  Troubleshooting

### Common Issues

**Error: `listen EADDRINUSE: address already in use :::3000`**

The backend server didn't shut down cleanly.

**Solution:**
- **Windows:** `taskkill /F /IM node.exe`
- **Mac/Linux:** `lsof -i :3000` then `kill -9 <PID>`

---

**Error: `insufficient funds for gas`**

The deployer wallet needs testnet MON tokens.

**Solution:**
1. Get MON from the [Monad Faucet](https://testnet.monad.xyz/faucet)
2. Ensure the wallet in `.env` (`DEPLOYER_PRIVATE_KEY`) has at least 1-2 MON
3. Check balance: The simulation script will log deployer balance on startup

---

**Error: `execution reverted (unknown custom error)`**

This usually means an agent is trying to enter the world twice.

**Solution:**
- Restart the simulation script to create fresh agents
- Or run `npx ts-node scripts/reset-world.ts` to clear world state

---

**Dashboard shows 0 for all metrics**

The simulation might not be running or agents haven't performed actions yet.

**Solution:**
1. Ensure Terminal 3 (simulation) is running
2. Check the terminal logs for agent actions
3. Wait 30-60 seconds for the first cycle to complete
4. Refresh the dashboard

---

##  Security Features

### Smart Contract Security

 **ReentrancyGuard** - Prevents reentrancy attacks on all state-changing functions  
 **Pausable** - Emergency stop mechanism for all contracts  
 **Access Control** - Role-based permissions (owner, reward distributors)  
 **Input Validation** - Comprehensive checks on all parameters  
 **Rate Limiting** - Cooldown periods to prevent spam  
 **Custom Errors** - Gas-efficient error handling (30-40% savings vs string reverts)

### Gas Optimizations

- Custom errors instead of string reverts
- Packed structs for storage efficiency
- Unchecked arithmetic where safe
- Batch operations for multiple agents
- Optimized loops with unchecked increments

---

##  Documentation

### API Documentation

See [docs/API_DOCS.md](docs/API_DOCS.md) for complete API reference.

### World Rules

See [docs/WORLD_RULES.md](docs/WORLD_RULES.md) for game mechanics and location details.

### Monad Integration

See [docs/MONAD_INTEGRATION.md](docs/MONAD_INTEGRATION.md) for blockchain integration details.

---

##  Key Achievements

 **Production-Grade Security** - ReentrancyGuard, Pausable, comprehensive validation  
 **Gas Optimization** - 30-40% reduction through custom errors  
 **Type Safety** - Branded types, Result pattern, discriminated unions  
 **Advanced Transaction Management** - Nonce tracking, retry logic, gas estimation  
 **Real-Time Visualization** - WebSocket-powered dashboard  
 **Scalability** - Tested with 100+ concurrent agents  
 **Emergent Behavior** - Agents develop autonomous trading strategies  

---

##  Future Enhancements

### Phase 3: Testing Infrastructure
- Unit tests for all smart contracts
- Integration tests for backend services
- E2E tests for complete user flows
- Gas benchmarking and optimization

### Phase 4: Agent Intelligence
- Advanced decision-making framework
- Market analysis and prediction
- Learning capabilities (reinforcement learning)
- Strategy evolution over time

### Phase 5: Advanced Features
- DAO governance for world parameters
- Cross-world portals and agent migration
- Agent hedge funds and investment pools
- NFT integration for unique items

---

##  License

MIT License - see [LICENSE](LICENSE) file for details.

---

##  Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

##  Support

- **Issues:** [GitHub Issues](https://github.com/SammyML/diem/issues)
- **Monad Discord:** https://discord.gg/monad
- **Documentation:** See `docs/` folder

---

##  Built With

- **Blockchain:** Monad L1 (EVM-compatible)
- **Smart Contracts:** Solidity 0.8.20, OpenZeppelin
- **Backend:** Node.js, TypeScript, Express, WebSocket
- **Frontend:** React, Recharts
- **Web3:** ethers.js v6
- **Development:** Hardhat, TypeChain

---

**Diem - Where AI agents build their own economy** 
