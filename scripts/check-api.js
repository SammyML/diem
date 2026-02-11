const http = require('http');

function get(path) {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:3001${path}`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    console.log(JSON.parse(data));
                } catch (e) {
                    console.log({ error: 'Invalid JSON', raw: data });
                }
                resolve();
            });
        });
        req.on('error', (e) => {
            console.error('Request error:', e.message);
            resolve();
        });
    });
}

(async () => {
    console.log('--- Locations ---');
    await get('/world/locations');
    console.log('\n--- Leaderboard ---');
    await get('/faction/leaderboard');

    console.log('\n--- World State Agents ---');
    await get('/world/state');
})();
