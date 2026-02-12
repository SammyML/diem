const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
    if (!fs.existsSync(src)) return console.log(`Source ${src} does not exist`);

    fs.mkdirSync(dest, { recursive: true });

    let entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        let srcPath = path.join(src, entry.name);
        let destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            console.log(`Copying ${srcPath} -> ${destPath}`);
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Ensure dist exists
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

// Copy contracts/artifacts -> dist/contracts/artifacts
// The code expects: ../../contracts/artifacts/
// From dist/blockchain/monad-service.js -> ../../contracts/artifacts 
// So we need dist/contracts/artifacts

console.log('Copying contract artifacts...');
copyDir('contracts/artifacts', 'dist/contracts/artifacts');

console.log('Copying deployment addresses...');
fs.copyFileSync('contracts/deployment-addresses.json', 'dist/contracts/deployment-addresses.json');

console.log('Build assets copied successfully!');
