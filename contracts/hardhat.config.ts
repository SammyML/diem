import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

// Load .env from root directory (since contracts is a subdirectory)
dotenv.config({ path: "../.env" });

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        "monad-mainnet": {
            url: "https://rpc.monad.xyz",
            chainId: 143,
            accounts: process.env.DEPLOYER_PRIVATE_KEY ?
                (process.env.AGENT1_PRIVATE_KEY ?
                    [process.env.DEPLOYER_PRIVATE_KEY, process.env.AGENT1_PRIVATE_KEY] :
                    [process.env.DEPLOYER_PRIVATE_KEY]) :
                [],
            // gasPrice: 1000000000, // Let provider estimate gas
        },
        "monad-mainnet-alt": {
            url: "https://rpc-mainnet.monadinfra.com",
            chainId: 143,
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
        }
    },
    etherscan: {
        apiKey: {
            "monad-mainnet": "no-api-key-needed"
        },
        customChains: [
            {
                network: "monad-mainnet",
                chainId: 143,
                urls: {
                    apiURL: "https://monadvision.com/api",
                    browserURL: "https://monadvision.com"
                }
            }
        ]
    }
};

export default config;
