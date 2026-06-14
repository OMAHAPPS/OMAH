const mongoose = require('mongoose')

const Schema = mongoose.Schema

const followersShema = new Schema({

       parentId: { type: String, required: true },
       count: { type: Number, required: true },
       followers: { type: Array, default: [], required: false }
})

followersShema.index({ parentId: 1, count: 1 })

const Followers = new mongoose.model('followers', followersShema)

module.exports = Followers