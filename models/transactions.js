const mongoose = require('mongoose')

const Schema = mongoose.Schema

const transactionSchema = new Schema({
       
       tranx_type: { type: String, required: true },
        method: { type: String, required: true}, 
        userId: { type: String, required: true },
        amount: { type: Number, default: 0, required: false },
        status: { type: String, required: true },         
      pplEmail: { type: String, default: 'none', required: false},
      mpesaObject: {
        mpesaNumber: { type: Number, default: 254, required: false },
        reqID: { type: String, default: 'none', required: false },
        status: {
           resultCode: { type: Number, default: 555, required: false },
           resultDesc: { type: String, default: 'none', required: false },
        }

      }
}, { timestamps: true })

const Transaction = new mongoose.model('transactions', transactionSchema)

module.exports = Transaction