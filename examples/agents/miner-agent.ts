
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const AGENT_NAME = `Miner_${Math.floor(Math.random() * 1000)}`;

// Resource types from server
const RESOURCES = {
    ORE: 'ore',
    GEM: 'rare_gem'
};

async function main() {
    console.log(`Starting ${AGENT_NAME}...`);

    try {
        // 1. Enter World
        const enterRes = await axios.post(`${API_URL}/agent/enter`, {
            agentName: AGENT_NAME,
            initialMon: 200
        });

        if (!enterRes.data.success) {
            console.error('Failed to enter:', enterRes.data.error);
            return;
        }

        const { agent, sessionToken } = enterRes.data;
        console.log(`Entered as ${agent.name} (${agent.id})`);

        // 2. Join Faction
        await axios.post(`${API_URL}/faction/join`, {
            agentId: agent.id,
            faction: 'salvagers'
        });

        // 3. Loop
        while (true) {
            // Get Agent State
            const agentRes = await axios.get(`${API_URL}/agent/${agent.id}`);
            const myAgent = agentRes.data;

            if (myAgent.locationId === 'mining_caves') {
                console.log('Mining ore...');
                const actionRes = await axios.post(`${API_URL}/agent/action`, {
                    sessionToken,
                    action: {
                        type: 'gather',
                        targetResourceType: RESOURCES.ORE
                    }
                });

                if (actionRes.data.success) {
                    console.log(`+ ${actionRes.data.message}`);
                } else {
                    console.log(`! ${actionRes.data.message}`);
                }
            } else {
                console.log('Moving to mines...');
                await axios.post(`${API_URL}/agent/action`, {
                    sessionToken,
                    action: { type: 'move', targetLocationId: 'mining_caves' }
                });
            }

            await new Promise(r => setTimeout(r, 1000));
        }

    } catch (error: any) {
        console.error('Error:', error?.response?.data || error.message);
    }
}

main();
