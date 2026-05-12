const express = require('express');
const { Sequelize } = require('sequelize');

const router = express.Router();

// Initialize database connection for the router
const sequelize = new Sequelize({ 
  dialect: 'sqlite', 
  storage: './database.sqlite',
  logging: false 
});

const User = require('../models/User')(sequelize);

/**
 * POST /api/chips/purchase
 * Handles adding chips to a user's account after an Ethereum transaction
 */
router.post('/purchase', async (req, res) => {
  try {
    const { userId, amount, transactionHash } = req.body;

    // Validate required fields
    if (!userId || !amount || !transactionHash) {
      return res.status(400).json({ error: 'Missing required purchase data' });
    }

    // Retrieve the user from the database
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Note: In a production environment, you would use ethers.js here to verify 
    // the transactionHash on the Sepolia blockchain before granting the chips.

    // Update the user's chip balance
    user.chips += parseInt(amount, 10);
    await user.save();

    res.status(200).json({ 
      message: 'Chips purchased successfully', 
      newBalance: user.chips 
    });

  } catch (error) {
    console.error("Chip purchase error:", error);
    res.status(500).json({ error: 'Internal server error processing chip purchase' });
  }
});

/**
 * POST /api/chips/daily-reward
 * Grants a daily chip allowance to users with an active subscription
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

    // Verify if the user has an active subscription
    const now = new Date();
    if (!user.subscriptionExpiry || user.subscriptionExpiry < now) {
      return res.status(403).json({ error: 'Active subscription required for daily reward' });
    }

    // Grant daily allowance (e.g., 20 chips)
    const rewardAmount = 20;
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