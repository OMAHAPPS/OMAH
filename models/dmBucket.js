const mongoose = require('mongoose')

const Schema = mongoose.Schema

const dmSchema = new Schema({

     roomId: { type: String, required: true, index: true },
     userAId: { type: String, required: true, index: true },
     userBId: { type: String, required: true, index: true }, 
     count: { type: Number, required: true },
     messages: { type: Array, default: [], required: false }
}, { timestamps: true })



const Chat = new mongoose.model('dmBucket', dmSchema)

module.exports = Chat