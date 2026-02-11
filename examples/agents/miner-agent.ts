import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';

interface Agent {
    id: string;
    name: string;
}

async function runMinerAgent() {
    const agentName = `Miner_${Math.floor(Math.random() * 1000)}`;
    console.log(`\n ${agentName} starting up...`);

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
                let atMiningCaves = false;

                // 1. Move to mining caves if not there
                try {
                    const moveRes = await axios.post(`${API_URL}/agent/action`, {
                        sessionToken,
                        action: {
                            type: 'move',
                            targetLocationId: 'mining_caves'
                        }
                    });
                    if (moveRes.data.success) {
                        atMiningCaves = true;
                    } else if (moveRes.data.message.includes('Already at')) {
                        atMiningCaves = true;
                    }
                } catch (e: any) {
                    // Ignore move errors, but don't set flag
                }

                if (atMiningCaves) {
                    // 2. Gather ore
                    const response = await axios.post(`${API_URL}/agent/action`, {
                        sessionToken,
                        action: {
                            type: 'gather',
                            targetResourceType: 'ore'
                        }
                    });

                    if (response.data && response.data.success) {
                        console.log(`gathered resources: ${response.data.message}`);
                    } else {
                        const msg = response.data?.message || 'Unknown error';
                        // Only log if it's not a generic "cooldown" spam, or maybe just silence failures to look cleaner?
                        // "World Class" logs are informative.
                        console.log(`mining status: ${msg}`);
                    }
                } else {
                    // console.log('Moving to caves...');
                }

            } catch (error: any) {
                console.log(`mining action failed: ${error.message}`);
                if (error.response) {
                    console.log(`   Status: ${error.response.status}`);
                    console.log(`   URL: ${error.config.url}`);
                    console.log(`   Method: ${error.config.method}`);
                    console.log(`   Data:`, JSON.stringify(error.response.data));
                }
            }
        }, 3000);

    } catch (error: any) {
        console.error(` failed to start:`, error.response?.data || error.message);
    }
}


// Prevent crash on unhandled errors
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
});

runMinerAgent();
