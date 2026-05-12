const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    username: { 
      type: DataTypes.STRING, 
      unique: true, 
      allowNull: false 
    },
    password: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    walletAddress: { 
      type: DataTypes.STRING, 
      // A default blank Ethereum address
      defaultValue: "0x0000000000000000000000000000000000000000" 
    },
    chips: { 
      type: DataTypes.INTEGER, 
      // Give new users 50 free chips to start playing the gambling games
      defaultValue: 50 
    },
    subscriptionExpiry: { 
      type: DataTypes.DATE, 
      // If this is null, or the date has passed, they are on the "Free" tier
      allowNull: true 
    }
  });

  return User;
};