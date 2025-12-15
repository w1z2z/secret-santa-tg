import mongoose from "mongoose";

const SantaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  giftPrice: { type: String, required: true },
  code: { type: Number, required: true, unique: true, index: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Participants' }]
});

export const Santa = mongoose.model('Santa', SantaSchema);
