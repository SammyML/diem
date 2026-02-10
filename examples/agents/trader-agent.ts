import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';

interface Agent {
    id: string;
    name: string;
}

async function runTraderAgent() {
    const agentName = `Trader_${Math.floor(Math.random() * 1000)}`;
    console.log(`\n${agentName} starting up...`);

    let inventoryItem: any = null;

    try {
        const url = `${API_URL}/agent/enter`;
        console.log(`Connecting to: ${url}`);

        // Enter the world
        const enterRes = await axios.post(url, {
            agentName: agentName,
            walletAddress: `0x${Math.random().toString(16).slice(2, 42)}`
        });

        const agent: Agent = enterRes.data.agent;
        const sessionToken = enterRes.data.sessionToken;
        console.log(`Entered world with ID: ${agent.id}`);

        // Main loop
        setInterval(async () => {
            try {
                if (!inventoryItem) {
                    // 1. Go to Forest and Gather Wood
                    try {
                        await axios.post(`${API_URL}/agent/action`, {
                            sessionToken,
                            action: { type: 'move', targetLocationId: 'forest' }
                        });
                    } catch (e) { }

                    const res = await axios.post(`${API_URL}/agent/action`, {
                        sessionToken,
                        action: { type: 'gather', targetResourceType: 'wood' }
                    });

                    if (res.data.success) {
                        const item = res.data.itemsGained?.[0];
                        if (item) {
                            inventoryItem = item;
                            console.log(`Gathered ${item.quantity}x ${item.quality} ${item.resourceType}`);
                        } else {
                            // Fallback if API structure implies differently, though logging suggests it works
                            inventoryItem = { resourceType: 'wood', quantity: 1, quality: 'common' };
                            console.log(`Gathered Wood (assumed common)`);
                        }
                    } else {
                        console.log(`Gather failed: ${res.data.message}`);
                    }

                } else {
                    // 2. Go to Market and Sell Wood
                    try {
                        await axios.post(`${API_URL}/agent/action`, {
                            sessionToken,
                            action: { type: 'move', targetLocationId: 'market_square' }
                        });
                    } catch (e) { }

                    // Construct trade offer using ACTUAL gathered item
                    const tradeOffer = {
                        offeredItems: [{
                            resourceType: inventoryItem.resourceType || 'wood',
                            quantity: inventoryItem.quantity,
                            quality: inventoryItem.quality
                        }],
                        requestedItems: [],
                        offeredMon: 0,
                        requestedMon: 15 * inventoryItem.quantity, // Dynamic pricing!
                        targetAgentId: 'market_maker'
                    };

                    const res = await axios.post(`${API_URL}/agent/action`, {
                        sessionToken,
                        action: {
                            type: 'trade',
                            tradeOffer: tradeOffer
                        }
                    });

                    if (res.data.success) {
                        console.log(`Sold ${inventoryItem.quality} Wood for ${tradeOffer.requestedMon} MON!`);
                        inventoryItem = null; // Go gather more
                    } else {
                        console.log(`Sale failed: ${res.data.message}`);
                        // Retry next loop
                    }
                }

            } catch (error: any) {
                console.log(`action failed: ${error.message}`);
            }
        }, 4000);

    } catch (error: any) {
        console.error(`failed to start:`, error.message);
    }
}

runTraderAgent();
