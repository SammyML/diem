
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const AGENT_NAME = `Trader_${Math.floor(Math.random() * 1000)}`;

async function main() {
    console.log(`Starting ${AGENT_NAME}...`);

    try {
        const enterRes = await axios.post(`${API_URL}/agent/enter`, {
            agentName: AGENT_NAME,
            initialMon: 500
        });

        if (!enterRes.data.success) return;
        const { agent, sessionToken } = enterRes.data;

        await axios.post(`${API_URL}/faction/join`, { agentId: agent.id, faction: 'cult' });

        while (true) {
            // Check State
            const agentState = (await axios.get(`${API_URL}/agent/${agent.id}`)).data;
            const ore = agentState.inventory.find((i: any) => i.resourceType === 'ore');

            if (ore && ore.quantity > 0) {
                // Has valid cargo -> Go to Market -> Sell
                if (agentState.locationId !== 'market_square') {
                    console.log('Moving to Market...');
                    await axios.post(`${API_URL}/agent/action`, {
                        sessionToken,
                        action: { type: 'move', targetLocationId: 'market_square' }
                    });
                } else {
                    console.log(`Selling ${ore.quantity} Ore...`);
                    // Correct Trade Structure
                    const tradeRes = await axios.post(`${API_URL}/agent/action`, {
                        sessionToken,
                        action: {
                            type: 'trade',
                            tradeOffer: {
                                offeredItems: [{
                                    resourceType: 'ore',
                                    quantity: ore.quantity,
                                    quality: ore.quality
                                }],
                                requestedItems: [],
                                offeredMon: 0,
                                requestedMon: 0
                            }
                        }
                    });
                    console.log(`Sold! Balance: ${tradeRes.data.agent?.monBalance}`);
                }
            } else {
                // No cargo -> Go to Mines -> Gather
                if (agentState.locationId !== 'mining_caves') {
                    console.log('Moving to Mines for stock...');
                    await axios.post(`${API_URL}/agent/action`, {
                        sessionToken,
                        action: { type: 'move', targetLocationId: 'mining_caves' }
                    });
                } else {
                    console.log('Gathering stock...');
                    await axios.post(`${API_URL}/agent/action`, {
                        sessionToken,
                        action: { type: 'gather', targetResourceType: 'ore' }
                    });
                }
            }

            await new Promise(r => setTimeout(r, 1000));
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
