const mongoose = require('mongoose')

const Schema = mongoose.Schema

const replySchema = new Schema({

     userId: { type: String, required: true },
     postId: { type: String, required: true },          // postId will either be main post ID or a Reply Id
     replyType: { type: String, required: true },       // parent || child if it is sub-reply
     replystring: { type: String, default: 'none', required: false },
     images: { type: Array, default: [], required: false },
     videoUrl: { type: String, default: 'none', required: false },
     likes: { type: Number, default: 0, required: false },
     interactions: { type: Number, default: 0, required: false }

}, { timestamps: true } )

const Reply = new mongoose.model('replies', replySchema)

module.exports = Reply