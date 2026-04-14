/**
 * Run: node scripts/make-admin.js
 * Connects to the same DB as the server and promotes the first user
 * (or a user matching --name or --phone arg) to admin.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User     = require('../models/User');

const arg   = process.argv[2] || '';   // e.g. node make-admin.js 9876543210
const byPhone = /^\d+$/.test(arg);

async function main() {
  const uri = process.env.MONGO_URI;
  console.log('Connecting to MongoDB…');

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 });
    console.log('✅ Connected to Atlas');
  } catch {
    console.log('⚠️  Atlas unreachable — this script only works when Atlas is online.');
    console.log('   While the app is running in in-memory mode, use the API instead:');
    console.log('   curl -X POST http://localhost:3456/api/admin/promote \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"phone":"YOUR_PHONE","secret":"lifelink_admin_2024"}\'');
    process.exit(1);
  }

  let user;
  if (byPhone) {
    user = await User.findOne({ phone: arg });
  } else {
    // promote the first non-admin user found
    user = await User.findOne({ isAdmin: false });
  }

  if (!user) {
    console.log('No matching user found. Register via the app first.');
    process.exit(1);
  }

  user.isAdmin = true;
  await user.save();
  console.log(`✅ Promoted: ${user.fullName} (${user.phone}) → isAdmin=true`);
  console.log('   Log out and log back in — the 🛡️ Admin tab will appear.');
  mongoose.disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
