const mongoose = require('mongoose');

const WhitelistSchema = mongoose.Schema({
    address: {
        type: String,
        unique: true,
    },
},
{
  timestamps: true
});

const Whitelist = mongoose.model('gftshoppe_whitelist', WhitelistSchema)

module.exports = Whitelist;