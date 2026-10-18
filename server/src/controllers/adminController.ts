import { Response } from 'express';
import { User } from '../models/User';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';
import { Report } from '../models/Report';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../types';
import { hashPassword } from '../utils/password';

export const getMetrics = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const [totalUsers, activeUsers, totalPosts, totalComments, pendingReports] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: 'active' }),
    Post.countDocuments({ isDeleted: false }),
    Comment.countDocuments(),
    Report.countDocuments({ status: 'pending' }),
  ]);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
  const newPostsThisWeek = await Post.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      totalPosts,
      totalComments,
      pendingReports,
      newUsersThisWeek,
      newPostsThisWeek,
    },
  });
};

export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const search = (req.query.search as string || '').trim();
  const role = req.query.role as string;
  const status = req.query.status as string;

  const query: any = {};

  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } },
    ];
  }

  if (role) query.role = role;
  if (status) query.status = status;

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const updateUserStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const adminId = req.user!.userId;
  const { id } = req.params;
  const { status, role } = req.body;

  const targetUser = await User.findById(id);
  if (!targetUser) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const previousStatus = targetUser.status;
  const previousRole = targetUser.role;

  if (status) targetUser.status = status;
  if (role) targetUser.role = role;

  await targetUser.save();

  // Create Audit Log
  await AuditLog.create({
    actor: adminId,
    action: 'UPDATE_USER_STATUS',
    targetType: 'User',
    targetId: targetUser._id,
    details: {
      fromStatus: previousStatus,
      toStatus: targetUser.status,
      fromRole: previousRole,
      toRole: targetUser.role,
    },
  });

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: targetUser,
  });
};

export const getReports = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const status = req.query.status as string || 'pending';

  const query: any = {};
  if (status !== 'all') query.status = status;

  const reports = await Report.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('reporter', 'username displayName avatar')
    .populate('resolvedBy', 'username displayName');

  const total = await Report.countDocuments(query);

  res.status(200).json({
    success: true,
    data: reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const updateReportStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const adminId = req.user!.userId;
  const { id } = req.params;
  const { status, resolutionNotes } = req.body;

  const report = await Report.findById(id);
  if (!report) {
    res.status(404).json({ success: false, message: 'Report not found' });
    return;
  }

  report.status = status;
  report.resolvedBy = adminId as any;
  if (resolutionNotes) report.resolutionNotes = resolutionNotes;

  await report.save();

  await AuditLog.create({
    actor: adminId,
    action: `REPORT_${status.toUpperCase()}`,
    targetType: 'Report',
    targetId: report._id,
    details: { resolutionNotes },
  });

  res.status(200).json({
    success: true,
    message: `Report marked as ${status}`,
    data: report,
  });
};

export const createReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const reporterId = req.user!.userId;
  const { targetId, targetType, reason, details } = req.body;

  if (!targetId || !targetType || !reason) {
    res.status(400).json({ success: false, message: 'Target, type, and reason are required' });
    return;
  }

  const report = await Report.create({
    reporter: reporterId,
    targetId,
    targetType,
    reason,
    details: details || '',
  });

  res.status(201).json({
    success: true,
    message: 'Report submitted. Our moderation team will review it.',
    data: report,
  });
};

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;

  const logs = await AuditLog.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('actor', 'username displayName role');

  const total = await AuditLog.countDocuments();

  res.status(200).json({
    success: true,
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const createAccountByAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const adminId = req.user!.userId;
  const { username, email, password, displayName, role, isVerified } = req.body;

  if (!username || !email || !password || !displayName) {
    res.status(400).json({ success: false, message: 'All fields (username, email, password, displayName) are required' });
    return;
  }

  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    res.status(409).json({ success: false, message: 'Email is already registered' });
    return;
  }

  const existingUser = await User.findOne({ username: username.toLowerCase() });
  if (existingUser) {
    res.status(409).json({ success: false, message: 'Username is already taken' });
    return;
  }

  const passwordHash = await hashPassword(password);

  const newUser = await User.create({
    username: username.toLowerCase().trim(),
    email: email.toLowerCase().trim(),
    displayName: displayName.trim(),
    passwordHash,
    role: role || 'user',
    isVerified: Boolean(isVerified),
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
  });

  await AuditLog.create({
    actor: adminId,
    action: 'ADMIN_CREATED_USER',
    targetType: 'User',
    targetId: newUser._id,
    details: { username: newUser.username, role: newUser.role, isVerified: newUser.isVerified },
  });

  res.status(201).json({
    success: true,
    message: `Account created successfully with role: ${newUser.role}`,
    data: newUser,
  });
};

