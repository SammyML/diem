import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';

interface Agent {
    id: string;
    name: string;
}

async function runTestAgent(agentName: string, role: string) {
    console.log(`\n🤖 ${agentName} (${role}) starting...`);

    try {
        // Enter the world
        const enterRes = await axios.post(`${API_URL}/agent/enter`, {
            name: agentName,
            walletAddress: `0x${Math.random().toString(16).slice(2, 42)}`
        });

        const agent: Agent = enterRes.data.agent;
        console.log(`✅ ${agentName} entered the world! ID: ${agent.id}`);

        // Main loop - perform actions every 5 seconds
        setInterval(async () => {
            try {
                // Randomly choose an action
                const actions = ['gather', 'craft', 'trade'];
                const action = actions[Math.floor(Math.random() * actions.length)];

                switch (action) {
                    case 'gather':
                        await axios.post(`${API_URL}/agent/${agent.id}/gather`, {
                            locationId: 'mining_caves'
                        });
                        console.log(`⛏️  ${agentName} gathered resources`);
                        break;

                    case 'craft':
                        await axios.post(`${API_URL}/agent/${agent.id}/craft`, {
                            itemType: 'tool'
                        });
                        console.log(`🔨 ${agentName} crafted an item`);
                        break;

                    case 'trade':
                        await axios.post(`${API_URL}/agent/${agent.id}/trade`, {
                            targetAgentId: 'market',
                            offer: { type: 'ore', amount: 10 }
                        });
                        console.log(`${agentName} completed a trade`);
                        break;
                }
            } catch (error: any) {
                console.log(`${agentName} action failed: ${error.response?.data?.error || error.message}`);
            }
        }, 5000);

    } catch (error: any) {
        console.error(`${agentName} failed to start:`, error.response?.data || error.message);
        process.exit(1);
    }
}

// Get agent name and role from command line args
const agentName = process.argv[2] || `Agent${Math.floor(Math.random() * 1000)}`;
const role = process.argv[3] || 'explorer';

runTestAgent(agentName, role);

// Keep process alive
process.on('SIGINT', () => {
    console.log(`\n👋 ${agentName} exiting...`);
    process.exit(0);
});
