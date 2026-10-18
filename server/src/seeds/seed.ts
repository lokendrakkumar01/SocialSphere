/**
 * SocialSphere Database Reset & Clean Seed
 * Clears ALL existing data and creates 5 demo accounts only.
 * Real posts/follows/etc will be created by actual users.
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set in .env');
  process.exit(1);
}

// ── Models (inline lightweight schemas to avoid import chain issues) ──────────
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  passwordHash: String,
  displayName: String,
  bio: String,
  avatar: String,
  coverPhoto: String,
  website: String,
  role: { type: String, default: 'user' },
  status: { type: String, default: 'active' },
  isVerified: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false },
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  postsCount: { type: Number, default: 0 },
  blockedUsers: [mongoose.Schema.Types.ObjectId],
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function main() {
  console.log('🔌 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  // ── Drop ALL collections ───────────────────────────────────────────────────
  console.log('\n🧹 Clearing all collections...');
  const db = mongoose.connection.db!;
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    await db.collection(col.name).deleteMany({});
    console.log(`   ✓ Cleared: ${col.name}`);
  }
  console.log('   All collections cleared.\n');

  // ── Create demo accounts ───────────────────────────────────────────────────
  const password = await bcrypt.hash('Admin@123', 12);
  const userPassword = await bcrypt.hash('password123', 12);

  const demoUsers = [
    {
      username: 'admin',
      email: 'admin@socialsphere.com',
      passwordHash: password,
      displayName: 'System Admin',
      bio: 'Platform Administrator 🛡️',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      coverPhoto: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&q=80',
      role: 'admin',
      isVerified: true,
      status: 'active',
    },
    {
      username: 'alex_tech',
      email: 'alex@socialsphere.com',
      passwordHash: userPassword,
      displayName: 'Alex Chen',
      bio: 'Full-Stack Developer | Open Source Enthusiast 🚀',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
      coverPhoto: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
      role: 'user',
      isVerified: true,
      status: 'active',
    },
    {
      username: 'sarah_travel',
      email: 'sarah@socialsphere.com',
      passwordHash: userPassword,
      displayName: 'Sarah Wilson',
      bio: 'Travel Photographer 📸 | Exploring the world one frame at a time ✈️',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      coverPhoto: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&q=80',
      role: 'user',
      isVerified: true,
      status: 'active',
    },
    {
      username: 'elena_design',
      email: 'elena@socialsphere.com',
      passwordHash: userPassword,
      displayName: 'Elena Rodriguez',
      bio: 'UI/UX Designer | Design Systems | Making digital experiences beautiful 🎨',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elena',
      coverPhoto: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200&q=80',
      role: 'moderator',
      isVerified: true,
      status: 'active',
    },
    {
      username: 'marcus_fit',
      email: 'marcus@socialsphere.com',
      passwordHash: userPassword,
      displayName: 'Marcus Johnson',
      bio: 'Fitness Coach | Nutrition Expert | Helping you live your best life 💪',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus',
      coverPhoto: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80',
      role: 'user',
      isVerified: false,
      status: 'active',
    },
  ];

  console.log('👤 Creating demo accounts...');
  const created = await User.insertMany(demoUsers);
  for (const u of created) {
    console.log(`   ✓ @${(u as any).username} [${(u as any).role}]`);
  }

  console.log('\n✅ Database reset complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Demo Accounts Created:');
  console.log('  👑 admin         / Admin@123    (Admin)');
  console.log('  👤 alex_tech     / password123  (User, Verified)');
  console.log('  ✈️  sarah_travel  / password123  (User, Verified)');
  console.log('  🎨 elena_design  / password123  (Moderator, Verified)');
  console.log('  💪 marcus_fit    / password123  (User)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Real posts will be created by actual users on the platform.');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
