import mongoose from "mongoose";

const SantaSchema = new mongoose.Schema({
  name: String,
  giftPrice: String,
  code: Number,
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Participants' }]
});

export const Santa = mongoose.model('Santa', SantaSchema);
