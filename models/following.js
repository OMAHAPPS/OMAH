const mongoose = require('mongoose')

const Schema = mongoose.Schema

const followingSchema = new Schema({

       parentId: { type: String, required: true },
       bucketId: { type: String, required: true },
       count: { type: Number, required: true },
       following: { type: Array, default: [], required: false }

}, { timestamps: true })

const Following = new mongoose.model('following', followingSchema)

module.exports = Following