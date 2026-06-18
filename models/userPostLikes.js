const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userPostsLikedSchema = new Schema({

      parentId: { type: String, required: true },
      count: { type: Number, required: true },
      posts: { type: Array, default: [], required: false }
})

userPostsLikedSchema.index({ parentId: 1 })

const LikedPost = new mongoose.model('userPostLikes', userPostsLikedSchema)

module.exports = LikedPost