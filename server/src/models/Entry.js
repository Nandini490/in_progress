import mongoose from 'mongoose';

const linkSubSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, default: '' },
    url: { type: String, required: true },
  },
  { _id: false }
);

const imageMetaSubSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, default: 'screenshot.png' },
    sizeBytes: { type: Number, default: 0 },
    mimeType: { type: String, default: 'image/png' },
    caption: { type: String, default: '' },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

const entrySchema = new mongoose.Schema(
  {
    // Client-assigned unique ID (e.g. entry_1790528828562_abc)
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    schemaVersion: {
      type: Number,
      default: 1,
    },
    date: {
      type: String,
      required: true,
      index: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'],
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },

    // Core Journal Sections
    didToday: { type: String, default: '' },
    learned: { type: String, default: '' },
    built: { type: String, default: '' },
    challenges: { type: String, default: '' },
    solutions: { type: String, default: '' },
    importantMoments: { type: String, default: '' },
    discoveries: { type: String, default: '' },
    improvements: { type: String, default: '' },
    tomorrow: { type: String, default: '' },

    // Optional Life Tracks (Extensible)
    dsa: { type: String, default: '' },
    projects: { type: String, default: '' },
    collegeWork: { type: String, default: '' },
    mistakes: { type: String, default: '' },

    // Dynamic Custom Sections (Extensibility)
    customSections: {
      type: Map,
      of: String,
      default: () => new Map(),
    },

    // Metadata & Attachments
    tags: {
      type: [String],
      index: true,
      default: [],
    },
    links: {
      type: [linkSubSchema],
      default: [],
    },
    // Metadata only; binary files reside in object storage / client DB
    images: {
      type: [imageMetaSubSchema],
      default: [],
    },

    createdAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
    updatedAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    timestamps: false, // We maintain explicit ISO string createdAt / updatedAt
    toJSON: {
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
        if (ret.customSections instanceof Map) {
          ret.customSections = Object.fromEntries(ret.customSections);
        }
        return ret;
      },
    },
  }
);

// Compound text index for MongoDB full-text search capability
entrySchema.index(
  {
    title: 'text',
    didToday: 'text',
    learned: 'text',
    built: 'text',
    challenges: 'text',
    solutions: 'text',
    importantMoments: 'text',
    discoveries: 'text',
    dsa: 'text',
    projects: 'text',
    mistakes: 'text',
    tags: 'text',
  },
  {
    name: 'EntryTextIndex',
  }
);

export const EntryModel = mongoose.model('Entry', entrySchema);
