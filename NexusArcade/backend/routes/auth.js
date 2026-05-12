const express = require('express');
const bcrypt = require('bcryptjs');
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
 * POST /api/auth/register
 * Creates a new user in the database with a hashed password
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, walletAddress } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check for existing user
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Hash password and create user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      walletAddress: walletAddress || "0x0000000000000000000000000000000000000000"
    });

    res.status(201).json({ 
      message: 'User registered successfully', 
      userId: newUser.id,
      chips: newUser.chips 
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

/**
 * POST /api/auth/login
 * Authenticates a user and returns their profile data
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return user data (excluding password)
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        walletAddress: user.walletAddress,
        chips: user.chips,
        subscriptionExpiry: user.subscriptionExpiry
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

module.exports = router;