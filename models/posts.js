const mongoose = require('mongoose')

const Schema = mongoose.Schema

const postSchema = new Schema({
     
       userId: { type: String, required: true },
       userName: { type: String, required: true },
       userRealm: { type: String, required: true },
       post: { type: String, required: true },
       image: { type: String, default: 'none', required: false },
       likes: { type: Number, default: 0, required: false }
}, { timestamps: true })

const Post = new mongoose.model('posts', postSchema)

module.exports = Post