const mongoose = require('mongoose')

const Schema = mongoose.Schema

const postSchema = new Schema({
     
       userId: { type: String, required: true, index: true },
       userName: { type: String, required: true },
       userHandle: { type: String, default: 'none', required: false },
       post: { type: String, default: 'none', required: false },
       videoUrl: { type: String, default: 'none', required: false },
       images: { type: Array, default: [], required: false },
       likes: { type: Number, default: 0, required: false },
       interactions: { type: Number, default: 0, required: false },
       replies: { type: Number, default: 0, required: false }
}, { timestamps: true })

const Post = new mongoose.model('posts', postSchema)

module.exports = Post