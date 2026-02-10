import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const AGENT_NAME = process.argv[2] || 'Gladiator';

// Simple delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log(`\n⚔️ Arena Agent ${AGENT_NAME} starting up...`);

    // 1. Enter World
    let agentId: string;
    try {
        const enterRes = await axios.post(`${API_URL}/agent/enter`, {
            agentName: AGENT_NAME,
            initialMon: 1000
        });
        agentId = enterRes.data.agent.id;
        console.log(`✅ Entered world with ID: ${agentId}`);
    } catch (error: any) {
        console.error('Failed to enter world:', error.message);
        return;
    }

    // Main Loop
    while (true) {
        try {
            // Check Open Battles
            const openBattlesRes = await axios.get(`${API_URL}/arena/battles/open`);
            const openBattles = openBattlesRes.data;

            // Check Active Battles (Am I fighting?)
            const activeBattlesRes = await axios.get(`${API_URL}/arena/battles/active`);
            const myBattle = activeBattlesRes.data.find((b: any) =>
                b.challenger === agentId || b.opponent === agentId
            );

            if (myBattle) {
                console.log(`🔥 In Active Battle: ${myBattle.battleId}`);
                // Simple logic: If it's active, try to trigger 'fight' round
                // In a real game, maybe we wait for turn? But here we spam attack.
                const fightRes = await axios.post(`${API_URL}/arena/fight`, {
                    battleId: myBattle.battleId
                });

                if (fightRes.data.success) {
                    console.log(fightRes.data.message);
                    if (fightRes.data.winner) {
                        console.log(`🏆 Winner: ${fightRes.data.winner}`);
                        await delay(5000); // Celebration delay
                    }
                }
            } else if (openBattles.length > 0) {
                // Find a battle to accept (that isn't mine)
                const targetBattle = openBattles.find((b: any) => b.challenger !== agentId);

                if (targetBattle) {
                    console.log(`⚔️ Accepting challenge from ${targetBattle.challenger}`);
                    await axios.post(`${API_URL}/arena/accept`, {
                        battleId: targetBattle.battleId,
                        agentId: agentId
                    });
                } else {
                    console.log('👀 Waiting for opponents (my challenge is pending)...');
                }
            } else {
                // No battles, create one
                console.log('📣 Creating new Arena Challenge...');
                await axios.post(`${API_URL}/arena/challenge`, {
                    agentId: agentId,
                    wager: 50
                });
            }

        } catch (error: any) {
            console.error('Loop error:', error.message);
            // If error is 400/404, maybe cooldown or invalid state
        }

        await delay(3000);
    }
}

main();
