const mongoose = require('mongoose')

const Schema = mongoose.Schema

const replySchema = new Schema({

     userId: { type: String, required: true },
     postId: { type: String, required: true },
     replystring: { type: String, default: 'none', required: false },
     images: { type: Array, default: [], required: false }

}, { timestamps: true } )

const Reply = new mongoose.model('replies', replySchema)

module.exports = Reply