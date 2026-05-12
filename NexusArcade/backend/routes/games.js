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
const Match = require('../models/Match')(sequelize);

/**
 * POST /api/games/record
 * Records a match outcome and updates the user's chip balance atomically
 */
router.post('/record', async (req, res) => {
  try {
    const { userId, gameName, wager, result, payout } = req.body;

    // Validate required fields
    if (!userId || !gameName || wager === undefined || !result || payout === undefined) {
      return res.status(400).json({ error: 'Missing required match data' });
    }

    // Retrieve the user to verify existence and check current balance
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Ensure user does not wager more chips than they possess
    if (wager > 0 && user.chips < wager) {
      return res.status(400).json({ error: 'Insufficient chips for this wager' });
    }

    // Start a database transaction to ensure data integrity
    const transaction = await sequelize.transaction();

    try {
      // Create the match history record
      const match = await Match.create({
        userId,
        gameName,
        wager,
        result,
        payout
      }, { transaction });

      // Update the user's chip balance
      user.chips += payout;
      await user.save({ transaction });

      // Commit the transaction to save changes
      await transaction.commit();

      res.status(201).json({ 
        message: 'Match recorded successfully', 
        matchId: match.id,
        newBalance: user.chips
      });
    } catch (transactionError) {
      // Revert all database changes if an error occurs mid-transaction
      await transaction.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error("Match recording error:", error);
    res.status(500).json({ error: 'Internal server error while recording match' });
  }
});

/**
 * GET /api/games/history/:userId
 * Retrieves the match history for a specific user, limited to the 50 most recent games
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch matches associated with the user ID, ordered by creation date
    const matches = await Match.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 50 
    });

    res.status(200).json({ matches });

  } catch (error) {
    console.error("History retrieval error:", error);
    res.status(500).json({ error: 'Internal server error fetching match history' });
  }
});

module.exports = router;