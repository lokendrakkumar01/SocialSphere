import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  reporter: mongoose.Types.ObjectId;
  targetId: mongoose.Types.ObjectId;
  targetType: 'post' | 'user';
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  resolvedBy?: mongoose.Types.ObjectId;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'targetType',
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ['post', 'user'],
    },
    reason: {
      type: String,
      required: true,
      enum: ['spam', 'harassment', 'hate_speech', 'misinformation', 'inappropriate', 'other'],
    },
    details: {
      type: String,
      default: '',
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

export const Report = mongoose.model<IReport>('Report', ReportSchema);
