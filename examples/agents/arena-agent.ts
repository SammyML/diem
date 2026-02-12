
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const AGENT_NAME = `Gladiator_${Math.floor(Math.random() * 1000)}`;

async function main() {
    console.log(`Starting ${AGENT_NAME}...`);

    try {
        // 1. Enter World
        const enterRes = await axios.post(`${API_URL}/agent/enter`, {
            agentName: AGENT_NAME,
            initialMon: 2000
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
            faction: 'wardens'
        });

        // 3. Move to Arena
        console.log('Moving to Arena...');
        await axios.post(`${API_URL}/agent/action`, {
            sessionToken,
            action: { type: 'move', targetLocationId: 'arena' }
        });

        // 4. Combat Loop
        while (true) {
            // Get Status
            const battlesRes = await axios.get(`${API_URL}/arena/battles/open`);
            const activeRes = await axios.get(`${API_URL}/arena/battles/active`);
            const bossRes = await axios.get(`${API_URL}/boss/status`);

            const openBattles = battlesRes.data;
            const activeBattles = activeRes.data;
            const boss = bossRes.data.state;

            // Check if I am in a duel
            const myBattle = activeBattles.find((b: any) => b.challenger === agent.name || b.opponent === agent.name);

            if (myBattle) {
                // I AM DUELING -> FIGHT PLAYER
                console.log(`DUEL: Round vs ${myBattle.challenger === agent.name ? myBattle.opponent : myBattle.challenger}`);
                await axios.post(`${API_URL}/arena/fight`, { battleId: myBattle.battleId });
                await new Promise(r => setTimeout(r, 1500));
                continue;
            }

            // Check for Open PvP Challenges
            const challenge = openBattles.find((b: any) => b.challenger !== agent.name);

            if (challenge) {
                // ACCEPT PVP CHALLENGE
                console.log(`Accepting duel from ${challenge.challenger}...`);
                try {
                    await axios.post(`${API_URL}/arena/accept`, {
                        battleId: challenge.battleId,
                        agentId: agent.id
                    });
                } catch (e: any) {
                    console.error('Accept failed:', e.message);
                }
            } else if (boss && boss.isActive && !boss.isDefeated) {
                // NO PVP -> FIGHT TITAN
                console.log(`ATTACKING TITAN! (${boss.currentHealth}/${boss.maxHealth} HP)`);
                const attackRes = await axios.post(`${API_URL}/boss/attack`, {
                    agentId: agent.id,
                    damage: Math.floor(Math.random() * 50) + 10 // Random damage
                });
                console.log(`  > ${attackRes.data.message}`);
            } else {
                // NO PVP, NO BOSS -> CREATE CHALLENGE
                const myOpen = openBattles.find((b: any) => b.challenger === agent.name);
                if (!myOpen) {
                    console.log('Creating PvP Challenge...');
                    await axios.post(`${API_URL}/arena/challenge`, {
                        agentId: agent.id,
                        wager: 50
                    });
                } else {
                    console.log('Waiting for opponent...');
                }
            }

            // Loop Speed
            await new Promise(r => setTimeout(r, 2000));
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
