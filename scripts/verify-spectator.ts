
import axios from 'axios';

async function verifySpectatorBackend() {
    const API_URL = 'http://localhost:3000';

    console.log('🔍 Verifying Spectator Mode Backend...');

    try {
        // 1. Check if server is running and returns events
        console.log('1. Fetching /world/state...');
        const response = await axios.get(`${API_URL}/world/state`);

        if (response.status === 200) {
            console.log('✅ API is accessible');

            const data = response.data;

            // Check for events array
            if (Array.isArray(data.events)) {
                console.log(`✅ Events array present (Count: ${data.events.length})`);

                if (data.events.length > 0) {
                    const latest = data.events[data.events.length - 1];
                    console.log('   Latest Event:', JSON.stringify(latest, null, 2));
                } else {
                    console.log('⚠️ Events array is empty (Miner might not have acted yet)');
                }
            } else {
                console.error('❌ Events array MISSING in response!');
                process.exit(1);
            }
        } else {
            console.error(`❌ API returned status ${response.status}`);
        }

    } catch (error: any) {
        console.error('❌ Verification Failed:', error.message);
        process.exit(1);
    }
}

verifySpectatorBackend();
