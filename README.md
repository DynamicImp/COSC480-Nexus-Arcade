**COSC 480 Final Project**

Nexus Arcade is a full-stack Web3 application that bridges the gap between traditional off-chain gaming and decentralized on-chain economies. It features a bi-directional Ethereum-pegged economy where players can securely purchase arcade chips using Sepolia ETH, play games without paying gas fees, and cash out their winnings back to their digital wallets.

## 🌟 Key Features

* Purchase chips with ETH and withdraw chips back to ETH using a secure smart contract vault.
* Cash-outs are secured by a Node.js Oracle that verifies off-chain SQLite balances before signing and executing on-chain Ethereum transactions.
* All game logic and chip tracking (e.g., Pong scoring) happens off-chain in a local database, preventing players from having to pay network fees for every game action.
* Players can purchase 30-day VIP passes via smart contract to unlock premium features, such as the Daily Scratch-Offs.
* Seamless integration with MetaMask using `ethers.js` (v6).

## 🛠️ Tech Stack

* **Frontend:** React.js, HTML5 Canvas (Pong), CSS3
* **Backend:** Node.js, Express.js
* **Database:** SQLite3, Sequelize ORM
* **Web3:** Solidity, Hardhat, Ethers.js
* **Network:** Ethereum Sepolia Testnet

---

## 🏗️ Architecture Overview

The application utilizes a hybrid Web2/Web3 architecture:

1. Holds Sepolia ETH liquidity. It logs incoming payments (Buy) and exposes a restricted `cashOutPlayer` function (Sell) that only the server can trigger.
2. An SQLite database securely tracks user accounts, VIP expiration dates, and chip balances in real-time.
3. Listens for frontend requests, verifies user balances in the database, and uses a secure Private Key to sign transactions telling the Smart Contract to release funds.

---

## Local Setup & Installation

### Prerequisites
* Node.js (v16+)
* MetaMask Wallet Extension (Configured to Sepolia Testnet)
* Sepolia Test ETH (Available via public faucets)

### 1. Smart Contract Deployment
1. Navigate to the Web3 directory: `cd web3`
2. Install dependencies: `npm install`
3. Deploy the contract to Sepolia:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia