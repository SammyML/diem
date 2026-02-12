
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const AGENT_NAME = `Crafter_${Math.floor(Math.random() * 1000)}`;

async function main() {
    console.log(`Starting ${AGENT_NAME}...`);

    try {
        const enterRes = await axios.post(`${API_URL}/agent/enter`, {
            agentName: AGENT_NAME,
            initialMon: 300
        });

        if (!enterRes.data.success) return;
        const { agent, sessionToken } = enterRes.data;

        await axios.post(`${API_URL}/faction/join`, { agentId: agent.id, faction: 'salvagers' });

        // Helper for navigation
        const safeMove = async (targetId: string, currentLoc: string) => {
            if (currentLoc === targetId) return;

            console.log(`Moving to ${targetId}...`);
            try {
                // Try direct move
                const moveRes = await axios.post(`${API_URL}/agent/action`, {
                    sessionToken,
                    action: { type: 'move', targetLocationId: targetId }
                });

                if (!moveRes.data.success) {
                    // If failed, try via Market Square (Hub)
                    console.log(`  > Direct move failed. Routing via Market...`);
                    await axios.post(`${API_URL}/agent/action`, {
                        sessionToken,
                        action: { type: 'move', targetLocationId: 'market_square' }
                    });
                    await new Promise(r => setTimeout(r, 500)); // Short pause
                    await axios.post(`${API_URL}/agent/action`, {
                        sessionToken,
                        action: { type: 'move', targetLocationId: targetId }
                    });
                }
            } catch (e) {
                console.log('Move Error, retrying...');
            }
        };

        while (true) {
            const agentState = (await axios.get(`${API_URL}/agent/${agent.id}`)).data;
            const inventory = agentState.inventory || [];

            const wood = inventory.find((i: any) => i.resourceType === 'wood')?.quantity || 0;
            const ore = inventory.find((i: any) => i.resourceType === 'ore')?.quantity || 0;

            console.log(`[Inv] Wood: ${wood} | Ore: ${ore} | Loc: ${agentState.locationId}`);

            // Goal: Craft Iron Tool (Requires 2 Ore, 1 Wood)
            if (wood < 1) {
                // Need Wood -> Forest
                await safeMove('forest', agentState.locationId);
                // Gather
                const gatherRes = await axios.post(`${API_URL}/agent/action`, {
                    sessionToken,
                    action: { type: 'gather', targetResourceType: 'wood' }
                });
                if (gatherRes.data.success) console.log(`  > +Wood`);
            } else if (ore < 2) {
                // Need Ore -> Mines
                await safeMove('mining_caves', agentState.locationId);
                // Gather
                const gatherRes = await axios.post(`${API_URL}/agent/action`, {
                    sessionToken,
                    action: { type: 'gather', targetResourceType: 'ore' }
                });
                if (gatherRes.data.success) console.log(`  > +Ore`);
            } else {
                // Have Materials -> Workshop -> Craft
                await safeMove('workshop', agentState.locationId);
                // Craft
                console.log('Crafting Iron Tool...');
                const craftRes = await axios.post(`${API_URL}/agent/action`, {
                    sessionToken,
                    action: {
                        type: 'craft',
                        craftingRecipe: 'craft_tool'
                    }
                });

                if (craftRes.data.success) {
                    console.log('  > CRAFT SUCCESS! Items Created +1');
                } else {
                    console.log(`  > Craft Failed: ${craftRes.data.message}`);
                }
            }

            await new Promise(r => setTimeout(r, 1000));
        }

    } catch (error: any) {
        console.error('Error:', error?.response?.data || error.message);
    }
}

main();
