const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  // Define the Match model for the database schema
  const Match = sequelize.define('Match', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // Establishes foreign key relationship with Users table
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    gameName: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    wager: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      defaultValue: 0 
    },
    result: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    payout: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    }
  });

  return Match;
};