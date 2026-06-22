const mongoose = require('mongoose')

const Schema = mongoose.Schema

const dmSchema = new Schema({

     roomId: { type: String, required: true },
     count: { type: Number, required: true },
     messages: { type: Array, default: [], required: false }
}, { timestamps: true })

dmSchema.index({ roomId: 1 })

const Chat = new mongoose.model('dmBucket', dmSchema)

module.exports = Chat