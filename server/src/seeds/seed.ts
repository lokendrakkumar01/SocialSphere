import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';
import { Like } from '../models/Like';
import { Follow } from '../models/Follow';
import { Story } from '../models/Story';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { Notification } from '../models/Notification';
import { Report } from '../models/Report';
import { AuditLog } from '../models/AuditLog';
import { hashPassword } from '../utils/password';

export const seedDatabase = async () => {
  console.log('[Seed] Starting database seed...');
  await connectDB();

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Comment.deleteMany({}),
    Like.deleteMany({}),
    Follow.deleteMany({}),
    Story.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
    Notification.deleteMany({}),
    Report.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  const defaultPasswordHash = await hashPassword('password123');

  // 1. Create Users
  const users = await User.create([
    {
      username: 'admin',
      email: 'admin@socialsphere.app',
      passwordHash: defaultPasswordHash,
      displayName: 'System Admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      bio: 'SocialSphere Platform Lead Administrator & System Architect 🛡️',
      website: 'https://socialsphere.app',
      role: 'admin',
      status: 'active',
      isVerified: true,
      followersCount: 1240,
      followingCount: 180,
      postsCount: 4,
    },
    {
      username: 'alex_tech',
      email: 'alex@example.com',
      passwordHash: defaultPasswordHash,
      displayName: 'Alex Chen',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      coverPhoto: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      bio: 'Full-stack builder. Crafting next-gen web applications, AI tools & open-source software 💻⚡ #tech #coding',
      website: 'https://alexchen.dev',
      role: 'user',
      status: 'active',
      isVerified: true,
      followersCount: 890,
      followingCount: 210,
      postsCount: 3,
    },
    {
      username: 'sarah_travel',
      email: 'sarah@example.com',
      passwordHash: defaultPasswordHash,
      displayName: 'Sarah Jenkins',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      coverPhoto: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      bio: 'Digital nomad exploring remote corners of the globe 🌍 Travel photographer & storyteller 📸',
      website: 'https://sarahtravels.blog',
      role: 'user',
      status: 'active',
      isVerified: true,
      followersCount: 3450,
      followingCount: 412,
      postsCount: 4,
    },
    {
      username: 'elena_design',
      email: 'elena@example.com',
      passwordHash: defaultPasswordHash,
      displayName: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
      coverPhoto: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80',
      bio: 'Product Designer & Design Systems enthusiast. Minimalism, typography and delightful micro-interactions ✨',
      website: 'https://elenarostova.design',
      role: 'moderator',
      status: 'active',
      isVerified: true,
      followersCount: 1560,
      followingCount: 330,
      postsCount: 3,
    },
    {
      username: 'marcus_fit',
      email: 'marcus@example.com',
      passwordHash: defaultPasswordHash,
      displayName: 'Marcus Cole',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      coverPhoto: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
      bio: 'Strength Coach & Nutritionist. Consistency beats intensity every single day 🏋️‍♂️🥗 #fitness #wellness',
      website: 'https://marcuscolefitness.com',
      role: 'user',
      status: 'active',
      isVerified: false,
      followersCount: 620,
      followingCount: 150,
      postsCount: 2,
    },
  ]);

  const [admin, alex, sarah, elena, marcus] = users;

  // 2. Create Follow Relationships
  await Follow.create([
    { follower: alex._id, following: sarah._id, status: 'accepted' },
    { follower: alex._id, following: elena._id, status: 'accepted' },
    { follower: sarah._id, following: alex._id, status: 'accepted' },
    { follower: sarah._id, following: elena._id, status: 'accepted' },
    { follower: elena._id, following: alex._id, status: 'accepted' },
    { follower: marcus._id, following: alex._id, status: 'accepted' },
    { follower: marcus._id, following: sarah._id, status: 'accepted' },
    { follower: admin._id, following: alex._id, status: 'accepted' },
    { follower: admin._id, following: sarah._id, status: 'accepted' },
  ]);

  // 3. Create Posts
  const posts = await Post.create([
    {
      author: alex._id,
      content:
        'Just launched SocialSphere v1.0! 🚀 Built with React, Vite, TypeScript, Socket.IO real-time channels, and an expressive MongoDB database. Check it out and let me know your thoughts! #tech #webdev #typescript #socialmedia',
      media: [
        {
          url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80',
          type: 'image',
        },
      ],
      hashtags: ['tech', 'webdev', 'typescript', 'socialmedia'],
      mentions: ['elena_design'],
      likesCount: 38,
      commentsCount: 3,
      sharesCount: 5,
      visibility: 'public',
    },
    {
      author: sarah._id,
      content:
        'Sunrise over the Dolomites in northern Italy. Woke up at 4:30 AM and hiked through the mist, but moments like this make every single step worth it. 🏔️✨ #travel #photography #nature #adventure',
      media: [
        {
          url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
          type: 'image',
        },
      ],
      hashtags: ['travel', 'photography', 'nature', 'adventure'],
      mentions: [],
      likesCount: 142,
      commentsCount: 5,
      sharesCount: 12,
      visibility: 'public',
    },
    {
      author: elena._id,
      content:
        'Designing a modern dark mode is not just about inverting hex values to pure black #000000. It is about depth, layering, subtle elevation tints, and reduced contrast fatigue. Here is our design token palette! 🎨 #design #ui #ux #darkmode',
      media: [
        {
          url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1000&q=80',
          type: 'image',
        },
      ],
      hashtags: ['design', 'ui', 'ux', 'darkmode'],
      mentions: ['alex_tech'],
      likesCount: 79,
      commentsCount: 2,
      sharesCount: 8,
      visibility: 'public',
    },
    {
      author: marcus._id,
      content:
        'Remember that recovery is where progress actually happens. Sleep, hydration, and nutrient-dense food fuel your next breakthrough session. Take care of your body today! 🥗💪 #fitness #wellness #health',
      media: [
        {
          url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1000&q=80',
          type: 'image',
        },
      ],
      hashtags: ['fitness', 'wellness', 'health'],
      mentions: [],
      likesCount: 24,
      commentsCount: 1,
      sharesCount: 2,
      visibility: 'public',
    },
    {
      author: admin._id,
      content:
        'Welcome to SocialSphere! 🎉 Our goal is to empower genuine connection, open real-time communication, and creator freedom without algorithmic manipulation. Read our platform guidelines and enjoy!',
      media: [],
      hashtags: ['announcement', 'socialsphere'],
      mentions: [],
      likesCount: 95,
      commentsCount: 4,
      sharesCount: 14,
      visibility: 'public',
    },
  ]);

  // 4. Create Comments
  await Comment.create([
    {
      post: posts[0]._id,
      author: elena._id,
      content: 'The typography and fluid transitions in SocialSphere feel incredible! Well done Alex! 🙌',
      likesCount: 7,
    },
    {
      post: posts[0]._id,
      author: sarah._id,
      content: 'Can confirm, uploaded my travel photos in milliseconds! Love this!',
      likesCount: 4,
    },
    {
      post: posts[1]._id,
      author: alex._id,
      content: 'This lighting is unbelievable Sarah! What camera setup did you use?',
      likesCount: 3,
    },
    {
      post: posts[1]._id,
      author: sarah._id,
      content: '@alex_tech Shot on Sony A7IV with 24-70mm GM II lens!',
      likesCount: 2,
    },
  ]);

  // 5. Create Likes
  await Like.create([
    { user: elena._id, target: posts[0]._id, targetType: 'Post' },
    { user: sarah._id, target: posts[0]._id, targetType: 'Post' },
    { user: marcus._id, target: posts[0]._id, targetType: 'Post' },
    { user: alex._id, target: posts[1]._id, targetType: 'Post' },
    { user: admin._id, target: posts[1]._id, targetType: 'Post' },
  ]);

  // 6. Create Stories (24-hour expiration)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  await Story.create([
    {
      author: sarah._id,
      mediaUrl: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image',
      caption: 'Sunset in Santorini 🌅',
      expiresAt: tomorrow,
      viewers: [sarah._id, alex._id],
    },
    {
      author: elena._id,
      mediaUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image',
      caption: 'New design system tokens coming together ✨',
      expiresAt: tomorrow,
      viewers: [elena._id],
    },
    {
      author: alex._id,
      mediaUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image',
      caption: 'Coding session deep in the flow state ☕💻',
      expiresAt: tomorrow,
      viewers: [alex._id],
    },
  ]);

  // 7. Create Direct Messaging Conversation
  const conversation = await Conversation.create({
    participants: [alex._id, sarah._id],
  });

  const msg1 = await Message.create({
    conversation: conversation._id,
    sender: sarah._id,
    content: 'Hey Alex! Loved your launch post about SocialSphere!',
    readBy: [sarah._id, alex._id],
    createdAt: new Date(Date.now() - 3600000),
  });

  const msg2 = await Message.create({
    conversation: conversation._id,
    sender: alex._id,
    content: 'Thanks so much Sarah! Let me know if you need any features for your photography albums.',
    readBy: [alex._id],
    createdAt: new Date(Date.now() - 1800000),
  });

  conversation.lastMessage = msg2._id as any;
  await conversation.save();

  // 8. Create Notifications
  await Notification.create([
    {
      recipient: alex._id,
      sender: elena._id,
      type: 'like',
      post: posts[0]._id,
      message: 'liked your post',
      isRead: false,
    },
    {
      recipient: alex._id,
      sender: sarah._id,
      type: 'comment',
      post: posts[0]._id,
      message: 'commented on your post',
      isRead: false,
    },
    {
      recipient: sarah._id,
      sender: alex._id,
      type: 'follow',
      message: 'started following you',
      isRead: true,
    },
  ]);

  // 9. Create a Sample Moderation Report
  await Report.create({
    reporter: marcus._id,
    targetId: posts[3]._id,
    targetType: 'post',
    reason: 'spam',
    details: 'Testing report functionality for the moderation queue.',
    status: 'pending',
  });

  // 10. Create Initial Audit Log
  await AuditLog.create({
    actor: admin._id,
    action: 'SYSTEM_BOOTSTRAP',
    targetType: 'System',
    details: { message: 'Database initialized with demo users, posts, and relations' },
  });

  console.log('[Seed] Database successfully seeded with demo accounts:');
  console.log(' - Admin: admin / password123');
  console.log(' - Creator: alex_tech / password123');
  console.log(' - Creator: sarah_travel / password123');
  console.log(' - Moderator: elena_design / password123');
  console.log(' - User: marcus_fit / password123');
};

seedDatabase()
  .then(async () => {
    await disconnectDB();
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Seed Error]', err);
    process.exit(1);
  });

