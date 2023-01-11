const mongoose = require('mongoose');
const { stringify } = require('nodemon/lib/utils');


const matchSchema = new mongoose.Schema(
  {
  matchNumber: {type: Number, required: true },
  matchOpen: { type: Boolean,  default:true },
  playingUser: {type:String, default: "first"},
  gamePositions: { type: String,  default: "" },
  userIdX: {type: String,  default: ""},
  userIdO: {type: String,  default: ""},
  chat:{type:String, default:""},
  createdAt: { type: Date, expires: '1h', default: Date.now }
}
);
module.exports = mongoose.model('Match', matchSchema);



