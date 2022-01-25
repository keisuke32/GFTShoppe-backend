const mongoose = require('mongoose');

const GftshoppeTransferSchema = mongoose.Schema({
    sender: {
        type: String
    },
    receiver: {
        type: String,
    },
    receiverAddress: {
        type: String,
    },
    senderEmail: {
        type: String,
    },
    message: {
        type: String,
    },
    tokenId: {
        type: String,
    },
    transactionHash: {
        type: String,
    },
    type: {
        type: String, 
        enum: ['Email', 'Wallet'],
    },
    status: {
        type: String,
        enum: ['Request', 'Pending', 'Sent']
    }
},
{
  timestamps: true
});

const GftshoppeTransfer = mongoose.model('gftshoppe_transfer', GftshoppeTransferSchema)

module.exports = GftshoppeTransfer;