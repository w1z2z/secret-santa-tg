import mongoose from "mongoose";

const ParticipantsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  santa: { type: mongoose.Schema.Types.ObjectId, ref: 'Santa', required: true, index: true },
  telegramAccount: { type: Number, default: null, index: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Participants', default: null },
  isGifted: { type: Boolean, default: false, index: true }
});

// Составной индекс для быстрого поиска доступных участников
ParticipantsSchema.index({ santa: 1, telegramAccount: 1, isGifted: 1 });

export const Participants = mongoose.model('Participants', ParticipantsSchema);
