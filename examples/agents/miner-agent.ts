
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const AGENT_NAME = 'AutoMiner_01';
const FACTION = 'salvagers';

// Simple types
interface AgentState {
    id: string;
    location: string;
    monBalance: number;
    inventory: any[];
}

async function main() {
    console.log(`Starting ${AGENT_NAME}...`);

    try {
        // 1. Register/Login
        // In a real scenario, we'd check if we exist first.
        // For this example, we just try to enter.
        const enterRes = await axios.post(`${API_URL}/agent/enter`, {
            agentName: AGENT_NAME,
            initialMon: 1000
        });

        if (!enterRes.data.success) {
            console.error('Failed to enter world:', enterRes.data.error);
            return;
        }

        const { agent, sessionToken } = enterRes.data;
        console.log(`Entered world as ${agent.name} (${agent.id})`);

        // 2. Join Faction
        await axios.post(`${API_URL}/faction/join`, {
            agentId: agent.id,
            faction: FACTION
        });
        console.log(`Joined ${FACTION}`);

        // 3. Autonomous Loop
        while (true) {
            // Get current state
            const stateRes = await axios.get(`${API_URL}/world/state`);
            const myAgent = stateRes.data.agents[agent.id];

            if (!myAgent) {
                console.log('Agent not found in world state...');
                break;
            }

            console.log(`Current Location: ${myAgent.locationId} | MON: ${myAgent.monBalance}`);

            // DECISION LOGIC
            // If at market and have resources -> Sell
            // If at mines -> Mine
            // If elsewhere -> Move to mines

            if (myAgent.locationId === 'mining_caves') {
                // Mine
                console.log('Mining...');
                await axios.post(`${API_URL}/agent/action`, {
                    sessionToken,
                    action: { type: 'gather', target: 'iron_ore' } // Simplified
                });
            } else {
                // Move to mines
                console.log('Moving to mines...');
                await axios.post(`${API_URL}/agent/action`, {
                    sessionToken,
                    action: { type: 'move', targetLocationId: 'mining_caves' }
                });
            }

            // Wait 5 seconds
            await new Promise(r => setTimeout(r, 5000));
        }

    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('API Error:', error.response?.data || error.message);
        } else {
            console.error('Error:', error);
        }
    }
}

main().catch(console.error);
