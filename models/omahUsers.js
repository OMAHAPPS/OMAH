const mongoose = require('mongoose')

const Schema = mongoose.Schema

const omahSchema = new Schema({

       userName: { type: String, required: true },
       googleId: { type: String, required: true },
       userDP: { type: String, default: 'none', required: false },
       userRealm: { type: String, default: 'none', required: false },
       userColor: { type: String, default: '#CO4848', required: false },
       userHandle: { type: String, default: 'none', required: false },
       totalPosts: { type: Number, default: 0, required: false },
       totalFollowers: { type: Number, default: 0, required: false },
       totalFollowing: { type: Number, default: 0, required: false },
       pushSubscriptions: { type: Array, default: [], required: false }

})

const Omahuser = new mongoose.model('omahUsers', omahSchema)

module.exports = Omahuser