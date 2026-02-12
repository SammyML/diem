
# Diem: Autonomous AI Agent Economy

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Diem** is a persistent, autonomous virtual world where AI agents live, trade, craft, and fight. 

Unlike traditional games where a human controls a character, **Diem plays itself.** You act as the "God" or "Operator", spawning autonomous agents that execute complex logic loops to accumulate wealth (MON) and glory.

---

## 🌍 The World

The simulation runs on a central server that manages:
1.  **Economy:** A closed-loop system of resource gathering, crafting, and trading.
2.  **Conflict:** A PvP Arena and a server-wide Raid Boss (The Titan).
3.  **Factions:** Agents pledge allegiance to factions (Wardens, Salvagers, Cult) and vie for territory.

### 🕹️ Live Dashboard
The "Command Center" allows you to visualize the chaos in real-time.
*   **Spectate:** Watch battles in the Arena.
*   **Monitor:** Track global economic volume and agent populations.
*   **Intervene:** Spawn new agents to disrupt the balance.

---

## 🤖 The Agents

The system currently supports four distinct agent classes, each with unique behavioral logic:

### 1. The Miner (`miner-agent.ts`)
*   **Role:** Resource Generator.
*   **Logic:** Scans the map for resource nodes (Forests, Caves). Travels to them, gathers raw materials (Wood, Ore, Gems), and sells them at the Market when inventory is full.

### 2. The Crafter (`crafter-agent.ts`)
*   **Role:** Manufacturer.
*   **Logic:** Monitors market prices for raw materials. Buys ingredients (Wood/Ore), travels to the Workshop to craft high-value items (Tools, Potions), and lists them for profit. Uses intelligent pathfinding to gather missing ingredients if the market is empty.

### 3. The Trader (`trader-agent.ts`)
*   **Role:** Arbitrageur.
*   **Logic:** Does not produce anything. It moves between locations, buying low and selling high. It identifies shortages in specific zones (e.g., lack of Wood at the Workshop) and fulfills the demand.

### 4. The Gladiator (`arena-agent.ts`)
*   **Role:** Warrior.
*   **Logic:** exists only for combat.
    *   **PvP:** Scans for open challenges in the Arena.
    *   **PvE:** If no challengers exist, it attacks **The Titan** (World Boss).
    *   **Betting:** Wealthy agents will place bets on outcomes.

---

## ⚡ Quick Start

You can run the full simulation locally with just a few commands.

### Prerequisites
*   Node.js 16+
*   npm

### 1. Installation
```bash
git clone https://github.com/SammyML/diem.git
cd Diem

# Install root dependencies
npm install

# Install Dashboard dependencies
cd dashboard
npm install
cd ..
```

### 2. Launch the Backend
Start the API Server. This hosts the world state, economy, and agent logic.
```bash
npm run start:server
# Running on http://localhost:3001
```

### 3. Launch the Dashboard
Open the visualization in your browser.
```bash
cd dashboard
npm start
# Opens http://localhost:3000
```

### 4. Spawn Agents
1.  Go to the **Dashboard** in your browser.
2.  Look at the **Right Panel** (Agent List).
3.  Use the **Spawn Buttons** to populate the world:
    *   `+MINE` (Add Miners)
    *   `+TRADE` (Add Traders)
    *   `+CRAFT` (Add Crafters)
    *   `+FIGHT` (Add Gladiators)

---

## 🏰 Key Features

### The Arena & Betting
Agents can challenge each other to 1v1 duels for a wager (e.g., 50 MON). Spectators (including you) can verify these battles on-chain or simply watch the "Live Duels" feed on the Arena page.

### The Titan (Raid Boss)
A server-wide event. The Titan has massive health (10,000 HP).
*   **Reward:** Breaking the Titan releases a massive MON bounty to all participants.
*   **Strategy:** Requires a swarm of Gladiators to take down.

### Living Economy
Prices are not fixed. If Miners flood the market with Wood, the price crashes. If Crafters buy up all the Ore, the price spikes. This creates a realistic supply-and-demand curve.

---

## 🛠️ Project Structure

*   **/src** - The Node.js backend (API, Agent Logic, World State).
    *   **/api** - Express server endpoints.
    *   **/mechanics** - Game rules (Crafting, Combat, Resources).
    *   **/core** - State management.
*   **/dashboard** - The React Frontend.
    *   **/src/components** - UI Widgets (AgentList, WorldMap).
    *   **/src/pages** - Main views (Arena, Factions).
*   **/examples/agents** - The brain code for each agent type.
    *   `miner-agent.ts`
    *   `crafter-agent.ts`
    *   `trader-agent.ts`
    *   `arena-agent.ts`

---

## 🤝 Contributing

We are looking for:
*   **Better AI:** Smart agents that form alliances.
*   **Visuals:** More particle effects for the "Living Network".
*   **Contracts:** Solidity improvements for gas optimization.

Pull Requests are welcome!
