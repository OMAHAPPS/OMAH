const mongoose = require('mongoose')

const Schema = mongoose.Schema

const followingSchema = new Schema({

       parentId: { type: String, required: true },
       count: { type: Number, required: true },
       following: { type: Array, default: [], required: false }

})

followingSchema.index({ parentId: 1 })       // remember to maintain order when querring aggregation

const Following = new mongoose.model('following', followingSchema)

module.exports = Following