const { Sequelize } = require('sequelize');

// Connect to local SQLite database
const sequelize = new Sequelize({ 
  dialect: 'sqlite', 
  storage: './database.sqlite',
  logging: false 
});

const User = require('./models/User')(sequelize);

async function grantAdminPerks() {
  try {
    // Find the first user registered in the database
    const user = await User.findOne(); 

    if (!user) {
      console.log("❌ No users found! Please register an account on the frontend first.");
      return;
    }

    // 1. Give 10,000 chips
    user.chips += 10000;

    // 2. Grant VIP status for 30 days (Required for Scratch-Offs)
    const now = new Date();
    user.subscriptionExpiry = new Date(now.setDate(now.getDate() + 30));

    await user.save();

    console.log(`✅ Success! Granted 10,000 Chips and 30-Day VIP to user: ${user.username}`);
    console.log(`Current Balance: ${user.chips} Chips`);
    
  } catch (error) {
    console.error("Error updating user:", error);
  }
}

grantAdminPerks();