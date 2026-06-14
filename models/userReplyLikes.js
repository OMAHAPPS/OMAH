const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userReplyLikedSchema = new Schema({
      
      parentId: { type: String, required: true },
      count: { type: String, required: true },
      replies: { type: Array, default: [], required: false }
})

userReplyLikedSchema.index({ parentId: 1, count: 1 })

const LikedReply = new mongoose.model('userReplyLikes', userReplyLikedSchema)

module.exports = LikedReply