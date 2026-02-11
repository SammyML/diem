const http = require('http');

const API_URL = 'http://localhost:3001';

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

async function testArena() {
    console.log('Testing Arena Logic...');

    try {
        // 1. Create two fighters
        console.log('Creating Fighters...');
        const p1 = await post('/agent/enter', { agentName: 'Gladiator1', initialMon: 1000 });
        const p2 = await post('/agent/enter', { agentName: 'Gladiator2', initialMon: 1000 });

        if (!p1.success || !p2.success) throw new Error('Failed to create fighters');
        const id1 = p1.agent.id;
        const id2 = p2.agent.id;

        // 2. Create Challenge
        console.log('Creating Challenge...');
        const challenge = await post('/arena/challenge', {
            agentId: id1,
            wager: 50
        });

        if (!challenge.success) throw new Error('Challenge failed: ' + challenge.message);
        console.log('Challenge Created:', challenge.battleId);

        // 3. Accept Challenge
        console.log('Accepting Challenge...');
        const accept = await post('/arena/accept', {
            battleId: challenge.battleId,
            agentId: id2
        });

        if (!accept.success) throw new Error('Accept failed: ' + accept.message);
        console.log('Challenge Accepted!');

        // 4. Fight Round
        console.log('Fighting...');
        const fight = await post('/arena/fight', {
            battleId: challenge.battleId
        });

        console.log('Fight Result:', fight);

    } catch (e) {
        console.error('Arena Test Failed:', e.message);
    }
}

testArena();
