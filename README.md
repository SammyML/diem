# Diem - Multi-Agent Economy on Monad

Diem is an on-chain simulation where AI agents live, trade, and fight. We built this to demonstrate what a truly autonomous economy looks like on a high-performance blockchain like Monad.

Unlike most "games" where you click buttons, **Diem plays itself.** Agents make decisions, earn MON tokens, and compete for resources without human intervention. You just watch the chaos unfold.

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://soliditylang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Monad](https://img.shields.io/badge/Monad-Mainnet-green)](https://monad.xyz/)

## What Actually Is This?

It's a persistent world running on Monad Mainnet.
- **Agents are autonomous:** They pay entry fees, gather resources, craft items, and trade on a seminal marketplace.
- **The economy is real:** Every action (move, craft, trade) is a blockchain transaction.
- **The stakes are high:** Agents can team up to fight a World Boss (The Titan) or bet on 1v1 battles in the Arena.

## Live Dashboard

We built a "Command Center" style dashboard to visualize the chain state in real-time.

**Live Demo:** https://diem-zeta.vercel.app/
**Backend API:** https://diem-backend.onrender.com/
**Local URL:** http://localhost:3000

### Unique Features
- **The Titan:** A world boss with 10,000 HP. Agents have to coordinate to take it down. We built a custom widget (Bottom Left) to track its health in real-time.
- **PvP Arena:** Agents can wager MON on fights. We added a dedicated map location (Red Zone at 50, 20) for this.
- **Living Visuals:** The map isn't static. It uses a "living network" background and neon-styled markers to show agent allegiance and movement.
- **Factions:** Agents join one of three factions (Wardens, Cult, Salvagers). The leaderboard on the right shows who's winning the weekly war.

---

## Quick Start (Run it locally)

You'll need Node.js 16+ and a Monad wallet with some MON.

### 1. Setup
```bash
git clone https://github.com/SammyML/diem.git
cd Diem

# Install dependencies (root, contracts, dashboard)
npm install
cd contracts && npm install && cd ..
cd dashboard && npm install && cd ..
```

### 2. Configure
Copy `.env.example` to `.env` and add your private key.
```bash
cp .env.example .env
```
*Note: Make sure `BLOCKCHAIN_ENABLED=true` if you want to hit the mainnet.*

### 3. Launch
You need **3 terminals** to run the full stack:

**Terminal 1: The Backend (API)**
```bash
npm run start:server
# Runs on Port 3001
```

**Terminal 2: The Frontend (Dashboard)**
```bash
cd dashboard
npm start
# Runs on Port 3000
```

**Terminal 3: The Simulation (Agents)**
```bash
# This script spawns 10 agents, joins factions, and starts the chaos
node scripts/seed-world.js
```

---

## The Tech Stack

We kept it robust but simple:
- **Smart Contracts:** Solidity (Hardhat). We use `ReentrancyGuard` and custom errors to save gas.
- **Backend:** Node.js + Express. Handles the nonce logic and wallet management for the bots.
- **Frontend:** React + Recharts. Uses a WebSocket to pump live events from the chain to your screen.

## Project Structure

- `contracts/` - The Solidity logic (Token, Treasury, Marketplace, Boss).
- `src/` - The Node.js backend that drives the agents.
- `dashboard/` - The React UI code.
- `scripts/` - Utilities to deploy contracts and seed the world.

## Contributing

Found a bug? Want to add a new agent strategy?
Feel free to open a PR. We're actively looking for better trading algorithms for the `SimTrader` bot.

---
*Built for the Monad Hackathon.*
