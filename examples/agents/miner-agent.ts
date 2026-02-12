
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
    console.log(`Using API URL: ${API_URL}`);

    try {
        // 1. Enter World
        console.log(`Attempting to enter world at ${API_URL}/agent/enter`);
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
        try {
            await axios.post(`${API_URL}/faction/join`, {
                agentId: agent.id,
                faction: 'salvagers'
            });
            console.log('Joined faction: salvagers');
        } catch (e) {
            console.log('Faction join skipped/failed (non-critical)');
        }

        // 3. Loop
        while (true) {
            try {
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
                    const moveRes = await axios.post(`${API_URL}/agent/action`, {
                        sessionToken,
                        action: { type: 'move', targetLocationId: 'mining_caves' }
                    });
                    console.log(`Move: ${moveRes.data.message}`);
                }
            } catch (loopError: any) {
                console.error('Loop Error:', loopError.message);
            }

            await new Promise(r => setTimeout(r, 5000)); // Slow down to 5s to avoid rate limits
        }

    } catch (error: any) {
        console.error('Fatal Error:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data));
        } else if (error.request) {
            console.error('No response received from server.');
        }
    }
}

main();
