const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const GftshoppeMoonpaySchema = mongoose.Schema({
    sender: {
        type: ObjectId,
        required: true,
        ref: 'GftshoppeUser'
    },
    amount: {
        type: Number
    },
    status: {
        type: String, 
        enum: ['request', 'pending', 'done'],
        default: 'request'
    },
},
{
  timestamps: true
});

const GftshoppeMoonpay = mongoose.model('gftshoppe_moonpay', GftshoppeMoonpaySchema)

module.exports = GftshoppeMoonpay;