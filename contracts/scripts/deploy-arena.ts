import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying Arena with account:", deployer.address);

    // Load existing addresses
    const addressesPath = path.join(__dirname, "../deployment-addresses.json");
    let addresses: any = {};
    if (fs.existsSync(addressesPath)) {
        addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    }

    const monTokenAddress = addresses.MONToken || "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Fallback to local default

    // Deploy Arena
    // Oracle is initially the deployer (server can transfer ownership later)
    const oracleAddress = deployer.address;

    console.log("Using MON Token at:", monTokenAddress);

    const Arena = await ethers.getContractFactory("Arena");
    const arena = await Arena.deploy(monTokenAddress, oracleAddress);
    await arena.waitForDeployment();

    const arenaAddress = await arena.getAddress();
    console.log("Arena deployed to:", arenaAddress);

    // Save address
    addresses.Arena = arenaAddress;
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
