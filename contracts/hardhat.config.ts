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
        "monad-testnet": {
            url: "https://testnet-rpc.monad.xyz",
            chainId: 10143,
            accounts: process.env.DEPLOYER_PRIVATE_KEY ?
                (process.env.AGENT1_PRIVATE_KEY ?
                    [process.env.DEPLOYER_PRIVATE_KEY, process.env.AGENT1_PRIVATE_KEY] :
                    [process.env.DEPLOYER_PRIVATE_KEY]) :
                [],
            // gasPrice: 1000000000, // Let provider estimate gas
        },
        "monad-testnet-alt": {
            url: "https://rpc-testnet.monadinfra.com",
            chainId: 10143,
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
        },
        "monad-mainnet": {
            url: "https://rpc.monad.xyz",
            chainId: 143,
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
        }
    },
    etherscan: {
        apiKey: {
            "monad-testnet": "no-api-key-needed"
        },
        customChains: [
            {
                network: "monad-testnet",
                chainId: 10143,
                urls: {
                    apiURL: "https://testnet.monad.xyz/api",
                    browserURL: "https://testnet.monad.xyz"
                }
            }
        ]
    }
};

export default config;
