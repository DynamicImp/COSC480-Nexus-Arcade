const express = require('express');
const { Sequelize } = require('sequelize');
const { ethers } = require('ethers');
require('dotenv').config();

const router = express.Router();

const sequelize = new Sequelize({ 
  dialect: 'sqlite', 
  storage: './database.sqlite',
  logging: false 
});

const User = require('../models/User')(sequelize);

// WEB3 ORACLE INITIALIZATION (WITH FALLBACKS TO PREVENT CRASHES)
const providerUrl = process.env.PROVIDER_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const provider = new ethers.JsonRpcProvider(providerUrl);

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error("🚨 WARNING: PRIVATE_KEY is missing from backend/.env! Cash Out will fail.");
}

// Fallback dummy key to prevent the server from crashing on boot if .env is missing
const safePrivateKey = privateKey || "0x0000000000000000000000000000000000000000000000000000000000000001";
const wallet = new ethers.Wallet(safePrivateKey, provider);

const contractAddress = process.env.CONTRACT_ADDRESS || "0x39e3f80A0e1e9eCF60A941aD295Cd4db6204d596";
const abi = ["function cashOutPlayer(address payable _player, uint256 _ethAmount) public"];
const contract = new ethers.Contract(contractAddress, abi, wallet);
// =======================================================================


/**
 * POST /api/chips/purchase
 * Handles adding chips and processing VIP subscriptions
 */
router.post('/purchase', async (req, res) => {
  try {
    const { userId, amount, transactionHash, isSubscription } = req.body;

    if (!userId || !amount || !transactionHash) {
      return res.status(400).json({ error: 'Missing required purchase data' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.chips += parseInt(amount, 10);

    if (isSubscription) {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.setDate(now.getDate() + 30));
      user.subscriptionExpiry = thirtyDaysFromNow;
    }

    await user.save();

    res.status(200).json({ 
      message: 'Transaction processed successfully', 
      newBalance: user.chips 
    });

  } catch (error) {
    console.error("Purchase error:", error);
    res.status(500).json({ error: 'Internal server error processing transaction' });
  }
});

/**
 * POST /api/chips/sell
 * Handles verifying database balance and executing the Web3 Cash Out
 */
router.post('/sell', async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ error: 'Missing required withdrawal data' });
    }

    const withdrawAmount = parseInt(amount, 10);
    if (withdrawAmount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.chips < withdrawAmount) {
      return res.status(400).json({ error: 'Insufficient chip balance for withdrawal' });
    }

    if (!user.walletAddress) {
      return res.status(400).json({ error: 'No wallet linked to this account' });
    }

    if (!privateKey) {
      return res.status(500).json({ error: 'Server configuration error: Oracle cannot sign transactions.' });
    }

    // 1. Calculate ETH value based on your conversion rate (100 chips = 0.001 ETH)
    const ethToReturn = ethers.parseEther((withdrawAmount * 0.00001).toFixed(18));

    // 2. Trigger Blockchain Transaction via the Backend Oracle
    console.log(`Initiating ETH transfer of ${ethers.formatEther(ethToReturn)} to ${user.walletAddress}`);
    const tx = await contract.cashOutPlayer(user.walletAddress, ethToReturn);
    
    // Wait for the blockchain to confirm the transaction
    await tx.wait(); 

    // 3. Update Database only AFTER the blockchain transfer is successful
    user.chips -= withdrawAmount;
    await user.save();

    res.status(200).json({ 
      message: 'Withdrawal processed successfully', 
      newBalance: user.chips,
      transactionHash: tx.hash
    });

  } catch (error) {
    console.error("Sell error:", error);
    res.status(500).json({ error: 'Failed to execute withdrawal. Please check vault liquidity.' });
  }
});

/**
 * POST /api/chips/daily-reward
 * Grants a daily chip allowance to VIP users
 */
router.post('/daily-reward', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date();
    if (!user.subscriptionExpiry || new Date(user.subscriptionExpiry) < now) {
      return res.status(403).json({ error: 'Active VIP Pass required for daily reward' });
    }

    const rewardAmount = 500;
    user.chips += rewardAmount;
    await user.save();

    res.status(200).json({ 
      message: 'Daily reward claimed successfully', 
      rewardAmount,
      newBalance: user.chips 
    });

  } catch (error) {
    console.error("Daily reward error:", error);
    res.status(500).json({ error: 'Internal server error processing daily reward' });
  }
});

module.exports = router;