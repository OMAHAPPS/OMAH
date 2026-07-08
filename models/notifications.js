const mongoose = require('mongoose')

const Schema = mongoose.Schema

const notificationSchema = new Schema({

      parentId: { type: String, required: true },
      count: { type: Number, required: true },
      notify: { type: Array, default: [], required: false }
})

notificationSchema.index({ parentId: 1, count: 1 })

const Notification = new mongoose.model('notifications', notificationSchema)

module.exports = Notification