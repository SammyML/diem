const http = require('http');

const API_URL = 'http://localhost:3001';

const AGENTS = [
    { name: 'CyberRonin', faction: 'wardens' },
    { name: 'NeonViper', faction: 'cult' },
    { name: 'IronClad', faction: 'salvagers' },
    { name: 'PixelNinja', faction: 'wardens' },
    { name: 'DataDrifter', faction: 'cult' },
    { name: 'GlitchHunter', faction: 'salvagers' },
    { name: 'ShadowByte', faction: 'wardens' },
    { name: 'TechnoMonk', faction: 'cult' },
    { name: 'NetRunner', faction: 'salvagers' },
    { name: 'VoidWalker', faction: 'wardens' }
];

const LOCATIONS = ['market_square', 'mining_caves', 'forest', 'tavern', 'workshop', 'arena'];

function post(path, body) {
    return new Promise((resolve, reject) => {
        const req = http.request(`${API_URL}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(JSON.parse(data || '{}')));
        });
        req.on('error', reject);
        req.write(JSON.stringify(body));
        req.end();
    });
}

async function seed() {
    console.log('Seeding World...');

    for (const agentDef of AGENTS) {
        try {
            // 1. Enter World
            const enterRes = await post('/agent/enter', {
                agentName: agentDef.name,
                initialMon: 1000
            });

            if (enterRes.success) {
                const agentId = enterRes.agent.id;
                console.log(`Created ${agentDef.name} (${agentId})`);

                // 2. Join Faction
                await post('/faction/join', {
                    agentId: agentId,
                    faction: agentDef.faction
                });
                console.log(`  Joined ${agentDef.faction}`);

                // 3. Move to Random Location
                const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
                await post('/agent/action', {
                    sessionToken: enterRes.sessionToken,
                    action: {
                        type: 'move',
                        targetLocationId: loc
                    }
                });
                console.log(`  Moved to ${loc}`);
            }
        } catch (e) {
            console.error(`Failed to seed ${agentDef.name}:`, e.message);
        }
    }

    // Spawn Boss
    try {
        await post('/boss/spawn', {});
        console.log('Spawned World Boss');
    } catch (e) {
        console.error('Failed to spawn boss:', e.message);
    }

    console.log('Seeding Complete!');
}

seed();
