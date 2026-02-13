# Diem: Sovereign Agent Economy

![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![React](https://img.shields.io/badge/React-18.0-61dafb.svg)
![Node.js](https://img.shields.io/badge/Node.js-18.0-green.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

Diem is a persistent, autonomous simulation where AI agents interact within a closed-loop economy. Unlike traditional multiplayer environments, Diem is designed for zero-player operation; agents are self-sovereign entities that execute complex behavioral loops to accumulate wealth (MON tokens), control territory, and compete for dominance.

The system serves as a reference implementation for large-scale multi-agent coordination, economic modeling, and on-chain interaction.

---

## System Architecture

The simulation logic is centralized in a Node.js backend that maintains the canonical World State, while a React-based frontend visualizes the network activity in real-time.

### Core Components

1.  **World State Manager**: Maintains the authoritative state of all agents, locations, and market data.
2.  **Economic Engine**: Simulates supply and demand dynamically. Resource scarcity drives price fluctuations, incentivize agents to switch roles (e.g., from mining to trading).
3.  **Conflict Resolution**: Handles turn-based combat in the Arena and real-time raid mechanics against the World Boss.
4.  **Event Loop**: A server-side heartbeat that manages tick-based logic, such as resource regeneration and Titan respawning.

---

## Agent Protocol

The system supports four distinct agent archetypes, each programmed with specific utility functions to maximize their net worth.

### 1. The Miner (Resource Generator)
**Objective**: Extraction and Supply.
*   **Logic**: Scans the environment for resource nodes (Forests, Caves). Navigates to these locations to gather raw materials (Wood, Ore, Gems).
*   **Economic Impact**: Provides the base liquidity for the economy. High miner activity lowers raw material prices.

### 2. The Crafter (Manufacturer)
**Objective**: Value Addition.
*   **Logic**: Monitors market spreads. Purchases raw materials and processes them at the Workshop into finished goods (Tools, Potions).
*   **Economic Impact**: Consumes raw materials and supplies utility items required for combat and high-tier gathering.

### 3. The Trader (Arbitrageur)
**Objective**: Distribution and Efficiency.
*   **Logic**: Analyzes price differentials across zones. Buys low in surplus areas and sells high in deficit areas.
*   **Economic Impact**: Smooths market inefficiencies and ensures resources reach agents who need them.

### 4. The Gladiator (Combatant)
**Objective**: Glory and Speculation.
*   **Logic**: Dedicated to combat. Queues for PvP duels in the Arena or participates in global raids.
*   **Economy**: Earns MON through wagered duels and bounty payouts from boss raids.

---

## Key Systems

### PvP Arena & Wagering
The Arena allows agents to stake MON tokens on the outcome of duals.
*   **Challenge Protocol**: Agents broadcast challenges with a specific wager amount.
*   **Resolution**: Combat is resolved deterministically based on agent stats (Attack, Defense, Equipment).
*   **Settlement**: The winner claims the total stake minus a protocol fee.

### The Titan (World Boss)
The Titan is a server-wide raid boss that serves as a global sink and redistribution mechanism.
*   **Raid Mechanics**: Agents of all factions must coordinate to deplete the Titan's 10,000 HP.
*   **Auto-Respawn Loop**: The system monitors the Titan's state. Upon defeat, a 2-hour cooldown timer initiates. Once elapsed, a new, stronger Titan automatically respawns, triggering a global broadcast event.
*   **Rewards**: Defeating the Titan distributes a massive MON bounty to all participants based on damage contribution.

---

## Installation & Deployment

### Prequisties
*   Node.js 16+
*   npm

### Local Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/SammyML/diem.git
    cd Diem
    ```

2.  **Install Dependencies**
    ```bash
    # Install backend dependencies
    npm install

    # Install frontend dependencies
    cd dashboard
    npm install
    cd ..
    ```

3.  **Start the Backend**
    This initializes the World State and API endpoints.
    ```bash
    npm run start:server
    # Server active at http://localhost:3000
    ```

4.  **Start the Visualization**
    Launch the React dashboard.
    ```bash
    cd dashboard
    npm start
    # Dashboard active at http://localhost:3000
    ```

---

## Project Structure

*   `src/` - Backend Source Code
    *   `api/` - REST and WebSocket endpoints.
    *   `core/` - World State and Event Loop logic.
    *   `mechanics/` - Implementations of Crafting, Combat, and Mining.
    *   `blockchain/` - Interfaces for on-chain settlement.
*   `dashboard/` - Frontend Source Code
    *   `src/components/` - React components for the UI.
    *   `src/pages/` - Route views (Leaderboard, Arena, World Map).
*   `examples/agents/` - Reference implementations for agent behaviors.

---

## Contributing

We welcome contributions to the protocol. Areas of specific interest include:

*   **Heuristic Optimization**: Improving agent decision-making algorithms.
*   **Smart Contract Integration**: Enhancing the on-chain settlement layer.
*   **Visualization**: Improving the real-time data representation in the dashboard.

Please submit Pull Requests via the standard GitHub workflow.
