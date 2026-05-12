const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');

const app = express();

// Configure middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Initialize SQLite database connection
const sequelize = new Sequelize({ 
  dialect: 'sqlite', 
  storage: './database.sqlite',
  logging: false 
});

// Import database models
const User = require('./models/User')(sequelize);
const Match = require('./models/Match')(sequelize);

// Define model relationships
User.hasMany(Match, { foreignKey: 'userId' });
Match.belongsTo(User, { foreignKey: 'userId' });

// Import API routes
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');
const chipRoutes = require('./routes/chips'); // ADDED: Chip routing import

// Register API routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/chips', chipRoutes); // ADDED: Chip route mounting

// Synchronize database schema and start server
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database synchronization failed:", err);
  });