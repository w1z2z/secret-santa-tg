import mongoose from "mongoose";

const ParticipantsSchema = new mongoose.Schema({
  name: String,
  santa: { type: mongoose.Schema.Types.ObjectId, ref: 'Santa' },
  telegramAccount: { type: Number, default: null },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Participants', default: null },
  isGifted: { type: Boolean, default: false }
});

export const Participants = mongoose.model('Participants', ParticipantsSchema);
