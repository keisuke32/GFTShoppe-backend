const mongoose = require('mongoose');

const GftshoppeUserSchema = mongoose.Schema({
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    tokens: [{
        tokenId: String,
        image: String
    }],
    status: {
        type: String, 
        enum: ['Pending', 'Active'],
        default: 'Pending'
    },
    confirmationCode: { 
        type: String, 
        unique: true 
    },
},
{
  timestamps: true
});

const GftshoppeUser = mongoose.model('gftshoppe_user', GftshoppeUserSchema)

module.exports = GftshoppeUser;