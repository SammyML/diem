import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';

interface Agent {
    id: string;
    name: string;
}

async function runCrafterAgent() {
    const agentName = `Crafter_${Math.floor(Math.random() * 1000)}`;
    console.log(`\n${agentName} starting up...`);

    let step = 0; // 0: Gather Ore, 1: Gather Wood, 2: Craft

    const moveTo = async (sessionToken: string, target: string) => {
        // Always route through market_square to ensure connection
        if (target !== 'market_square') {
            try {
                await axios.post(`${API_URL}/agent/action`, {
                    sessionToken,
                    action: { type: 'move', targetLocationId: 'market_square' }
                });
            } catch (e) { }
        }

        try {
            await axios.post(`${API_URL}/agent/action`, {
                sessionToken,
                action: { type: 'move', targetLocationId: target }
            });
        } catch (e) { }
    };

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
        console.log(`entered world with ID: ${agent.id}`);

        // Main loop
        setInterval(async () => {
            try {
                if (step === 0) {
                    // Gather ORE at mining caves
                    await moveTo(sessionToken, 'mining_caves');

                    const res = await axios.post(`${API_URL}/agent/action`, {
                        sessionToken,
                        action: { type: 'gather', targetResourceType: 'ore' }
                    });

                    if (res.data.success) {
                        console.log(`Step 1: Gathered Ore`);
                        step = 1;
                    }

                } else if (step === 1) {
                    // Gather WOOD at forest
                    await moveTo(sessionToken, 'forest');

                    const res = await axios.post(`${API_URL}/agent/action`, {
                        sessionToken,
                        action: { type: 'gather', targetResourceType: 'wood' }
                    });

                    if (res.data.success) {
                        console.log(`Step 2: Gathered Wood`);
                        step = 2;
                    }

                } else {
                    // Craft Tool at workshop
                    await moveTo(sessionToken, 'workshop');

                    const res = await axios.post(`${API_URL}/agent/action`, {
                        sessionToken,
                        action: { type: 'craft', craftingRecipe: 'craft_tool' }
                    });

                    if (res.data.success) {
                        console.log(`Step 3: Crafted Iron Tool!`);
                        step = 0; // Reset loop
                    } else {
                        console.log(`Step 3: Craft failed (${res.data.message}), retrying...`);

                        // If failed due to missing resources (maybe consumption failed?), go back to start
                        if (res.data.message.includes("resources")) step = 0;
                    }
                }

            } catch (error: any) {
                console.log(`action failed: ${error.message}`);
            }
        }, 5000);

    } catch (error: any) {
        console.error(`failed to start:`, error.message);
    }
}

runCrafterAgent();
