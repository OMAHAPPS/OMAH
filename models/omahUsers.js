const mongoose = require('mongoose')

const Schema = mongoose.Schema

const omahSchema = new Schema({

       userName: { type: String, required: true },
       googleId: { type: String, required: true },
       userRealm: { type: String, default: 'none', required: false },
       userColor: { type: String, default: 'none', required: false },
       aiName: { type: String, default: 'none', required: false }

})

const Omahuser = new mongoose.model('omahUsers', omahSchema)

module.exports = Omahuser