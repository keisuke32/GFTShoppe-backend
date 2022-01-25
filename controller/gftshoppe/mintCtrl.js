const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require("fs");

const GftshoppeMoonpay = require('../../models/gftshoppeMoonpayModel.js');
const GftshoppeUser = require('../../models/gftshoppeUsersModel.js');
const GftshoppeWhitelist = require('../../models/gftshoppeWhitelist.js');

const ContractUtil = require('../../utility/contractUtil');
const config = require('../../config.js');
require('dotenv').config();

const requestMoonpay = (req, res) => {
    gftshoppeMoonpay = new GftshoppeMoonpay();
    gftshoppeMoonpay.sender = req.body.id;
    gftshoppeMoonpay.amount = req.body.amount;
    gftshoppeMoonpay.save()
    .then(result => {
        res.json({status: true, id:result._id, adminWallet: process.env.ADMIN_WALLET});
    })
    .catch(err => {
        console.log(err)
        res.json({status: false});
    })
}

const buy = async (req, res) => {
    gftshoppeMoonpay = await GftshoppeMoonpay.findById(req.body.id);
    
    if (gftshoppeMoonpay.status === 'done') {
        return res.json({status: false, error: 'This transaction was done already.'})
    }
    if (gftshoppeMoonpay.status === 'pending') {
        return res.json({status: false, error: 'This transaction is on progress.'})
    }
    gftshoppeMoonpay.status = 'pending';
    await gftshoppeMoonpay.save();
    gftshoppeUser = await GftshoppeUser.findById(gftshoppeMoonpay.sender);
    ContractUtil.mint(gftshoppeMoonpay.amount)
    .then(result => {
        let tokenIds = [];
        if (result.events.Transfer.length === undefined) {
            tokenIds.push(result.events.Transfer.returnValues.tokenId)
            gftshoppeUser.tokens.push({tokenId: result.events.Transfer.returnValues.tokenId}) 
        } else {
            for (let i in result.events.Transfer) {
                tokenIds.push(result.events.Transfer[i].returnValues.tokenId)
                gftshoppeUser.tokens.push({tokenId: result.events.Transfer[i].returnValues.tokenId}) 
            }
        }
        gftshoppeUser.save()
        .then(async result => {
            gftshoppeMoonpay.status = "done";
            await gftshoppeMoonpay.save();
            // send email to user
            // send email to address
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                user: process.env.MAIL_ADDRESS,
                pass: process.env.MAIL_APP_PASSWORD
                }
            });
            let emailTemplate = fs.readFileSync('./views/mail-templates/success-mint.html', { encoding: 'utf-8' });
    
            let content = "<ul>";
            for (n in tokenIds) {
                content += "<li><p><a href='" + config.contractURI + "?a=" + tokenIds[n] + "'>" + config.contractURI + "?a=" + tokenIds[n] + "</a></p></li>";
            }
            let htmlcontent = emailTemplate.replace("[?!content!?]", content);
    
            const template = handlebars.compile(htmlcontent);
            const replacements = {
                useremail: gftshoppeUser.email,
            };
            const htmlToSend = template(replacements);
            const mailOptions = {
                from: process.env.MAIL_ADDRESS,
                to: gftshoppeUser.email,
                subject: 'Thank you for purchasing GFTs!',
                html: htmlToSend
            }
            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    res.json({status: false})        
                } else {
                    res.json({status: true})
                }
            })
        })
        .catch(err => {
            console.log(err)
            res.json({status: false})
        })
    })
    .catch(err => {
        console.log(err)
    })
}

const getGFTs = async (req, res) => {
    const gftshoppeUser = await GftshoppeUser.findById(req.body.id);
    const tokenIds = [];
    gftshoppeUser.tokens.map(token => {
        tokenIds.push(token.tokenId);
    })
    res.json({status: true, tokenIds: tokenIds, adminAddress: process.env.ADMIN_WALLET});
}

const saveWhitelist = async (req, res) => {
    gftshoppewhitelist = await GftshoppeWhitelist.findOne({address: req.body.whitelistAddress});
    if (gftshoppewhitelist != null) {
        return res.json({status: false, error: "This address is already registered"});
    }
    gftshoppewhitelist = new GftshoppeWhitelist({
        address: req.body.whitelistAddress
    });
    gftshoppewhitelist.save()
    .then(result => {
        res.json({status: true})
    })
    .catch(err => {
        res.json({status: false})
    });
}

const checkWhitelist = async(req, res) => {
    gftshoppewhitelist = await GftshoppeWhitelist.findOne({address: req.body.whitelistAddress});
    if (gftshoppewhitelist != null) {
        return res.json({status: false, error: "This address is already registered"});
    }
    
    res.json({status: true})
}

module.exports = { requestMoonpay, buy, getGFTs, saveWhitelist, checkWhitelist };