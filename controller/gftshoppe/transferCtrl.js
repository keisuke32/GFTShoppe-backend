const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const GftshoppeUser = require('../../models/gftshoppeUsersModel.js');
const GftshoppeTransfer = require('../../models/gftshoppeTransferModel.js');
const ContractUtil = require('../../utility/contractUtil');
const config = require('../../config.js');

require('dotenv').config();

const transferbywallet = (req, res) => {
    let transfer = new GftshoppeTransfer({
        sender: req.body.sender,
        receiver: req.body.formdata.email,
        senderEmail: req.body.formdata.senderEmail,
        message: req.body.formdata.message,
        tokenId: req.body.tokenId,
        transactionHash: req.body.transactionHash,
        type: "Wallet",
        status: "Sent"
    });
    transfer.save()
    .then(result => {
        res.json({ status: true });
    })
    .catch(err => {
        res.json({ status: false });
    })
}

const getAdminWallet = (req, res) => {
    res.json({ adminWallet: process.env.ADMIN_WALLET });
}

const transfertoemail = (req, res) => {
    let transfer = new GftshoppeTransfer({
        sender: req.body.sender,
        receiver: req.body.formdata.email,
        senderEmail: req.body.formdata.senderEmail,
        message: req.body.formdata.message,
        tokenId: req.body.tokenId,
        transactionHash: req.body.transactionHash,
        type: "Email",
        status: "Pending"
    });
    transfer.save()
    .then(result => {
        // send email to receiver for getting email
        // sending verification email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_ADDRESS,
                pass: process.env.MAIL_APP_PASSWORD
            }
        });
        let emailTemplate = fs.readFileSync('./views/mail-templates/transfer-pending.html', { encoding: 'utf-8' });
        emailTemplate = handlebars.compile(emailTemplate);
        const replacements = {
            useremail: req.body.formdata.email,
            fromemail: req.body.formdata.senderEmail !== "" ? req.body.formdata.senderEmail : 'a secret admirer',
            id: result._id
        };
        const htmlToSend = emailTemplate(replacements);

        const mailOptions = {
            from: process.env.MAIL_ADDRESS,
            // to: 'kostas@republicrealm.com',
            to: req.body.formdata.email,
            subject: 'Happy Holidays - You’ve been sent a GFT!',
            html: htmlToSend
        }
        transporter.sendMail(mailOptions, function(error, info){
            if (error) 
                return res.json({status: false});
            
            if (req.body.formdata.senderEmail && req.body.formdata.senderEmail != '') {
                // send email to sender 
                let emailTemplate = fs.readFileSync('./views/mail-templates/transfer-to-sender.html', { encoding: 'utf-8' });
                emailTemplate = handlebars.compile(emailTemplate);
                const replacements = {
                    useremail: req.body.formdata.senderEmail,
                    toemail: req.body.formdata.email,
                };
                const htmlToSend = emailTemplate(replacements);
    
                const mailOptions = {
                    from: process.env.MAIL_ADDRESS,
                    // to: 'kostas@republicrealm.com',
                    to: req.body.formdata.senderEmail,
                    subject: 'Happy Holidays - Your GFT is on the way!',
                    html: htmlToSend
                }
                transporter.sendMail(mailOptions, function(error1, info1) {
                    if (error1) 
                        return res.json({status: false});
    
                    res.json({status: true});
                })
            } else {
                res.json({status: true});
            }
        })
        res.json({ status: true });
    })
    .catch(err => {
        res.json({ status: false });
    })
}

const transfertoownwallet = (req, res) => {
    ContractUtil.transfer(req.body.address, req.body.tokenId)
    .then(async result => {
        await GftshoppeUser.updateOne(
            {"_id": req.body.userid},
            {"$pull": {tokens: {tokenId:req.body.tokenId}}}
        );

        res.json({status: true})
    })
    .catch(err => {
        res.json({status: false, error: "Something is wrong"})
    })
}

const receiveGFT = async (req, res) => {
    let gftshoppeTransfer = await GftshoppeTransfer.findById(req.body.id);
    if (gftshoppeTransfer.status == 'Sent') {
        return res.json({status: false, error: "GFT has already been retrieved"});
    }
    console.log(gftshoppeTransfer)
    ContractUtil.transfer(req.body.address, gftshoppeTransfer.tokenId)
    .then(async result => {
        gftshoppeTransfer.status = 'Sent';
        await gftshoppeTransfer.save();
        res.json({status: true})
    })
    .catch(err => {
        res.json({status: false, error: "Something is wrong"})
    })
}

const transferfromemailtowallet = async (req, res) => {
    ContractUtil.transfer(req.body.formdata.email, req.body.tokenId)
    .then(async result => {
        await GftshoppeUser.updateOne(
            {"_id": req.body.userid},
            {"$pull": {tokens: {tokenId:req.body.tokenId}}}
        );
        let transfer = new GftshoppeTransfer({
            sender: req.body.userid,
            receiver: req.body.formdata.email,
            senderEmail: req.body.formdata.senderEmail,
            message: req.body.formdata.message,
            tokenId: req.body.tokenId,
            transactionHash: result.transactionHash,
            type: "Wallet",
            status: "Sent"
        });
        await transfer.save()
        .then(result => {
            // send email to sender 
            let emailTemplate = fs.readFileSync('./views/mail-templates/transfer-to-sender.html', { encoding: 'utf-8' });
            emailTemplate = handlebars.compile(emailTemplate);
            const replacements = {
                useremail: req.body.formdata.senderEmail,
                toemail: req.body.formdata.email,
            };
            const htmlToSend = emailTemplate(replacements);

            const mailOptions = {
                from: process.env.MAIL_ADDRESS,
                // to: 'kostas@republicrealm.com',
                to: req.body.formdata.senderEmail,
                subject: 'Happy Holidays - Your GFT is on the way!',
                html: htmlToSend
            }
            transporter.sendMail(mailOptions, function(error1, info1) {
                if (error1) 
                    return res.json({status: false});

                res.json({status: true});
            })
        })
        .catch(err => {
            res.json({status: false, error: "Something is wrong"})
        });
    })
    .catch(err => {
        res.json({status: false, error: "Something is wrong"})
    })
}

const transferfromemailtoemail = async (req, res) => {
    await GftshoppeUser.updateOne(
        {"_id": req.body.userid},
        {"$pull": {tokens: {tokenId:req.body.tokenId}}}
    );
    let transfer = new GftshoppeTransfer({
        sender: req.body.userid,
        receiver: req.body.formdata.email,
        senderEmail: req.body.formdata.senderEmail,
        message: req.body.formdata.message,
        tokenId: req.body.tokenId,
        transactionHash: '',
        type: "Wallet",
        status: "Pending"
    });

    transfer.save()
    .then(result => {
        // send email to receiver for getting email
        // sending verification email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_ADDRESS,
                pass: process.env.MAIL_APP_PASSWORD
            }
        });
        let emailTemplate = fs.readFileSync('./views/mail-templates/transfer-pending.html', { encoding: 'utf-8' });
        emailTemplate = handlebars.compile(emailTemplate);
        const replacements = {
            useremail: req.body.formdata.email,
            fromemail: req.body.formdata.senderEmail,
            id: result._id
        };
        const htmlToSend = emailTemplate(replacements);

        const mailOptions = {
            from: process.env.MAIL_ADDRESS,
            to: req.body.formdata.email,
            subject: 'Happy Holidays - You’ve been sent a GFT!',
            html: htmlToSend
        }
        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                return res.json({status: false});
            } 
            // send email to sender 
            let emailTemplate = fs.readFileSync('./views/mail-templates/transfer-to-sender.html', { encoding: 'utf-8' });
            emailTemplate = handlebars.compile(emailTemplate);
            const replacements = {
                useremail: req.body.formdata.senderEmail,
                toemail: req.body.formdata.email,
            };
            const htmlToSend = emailTemplate(replacements);

            const mailOptions = {
                from: process.env.MAIL_ADDRESS,
                to: req.body.formdata.email,
                to: req.body.formdata.email,
                subject: 'Happy Holidays - Your GFT is on the way!',
                html: htmlToSend
            }
            transporter.sendMail(mailOptions, function(error1, info1) {
                if (error1) 
                    return res.json({status: false});

                res.json({status: true});
            })
        })

    })
    .catch(err => {
        res.json({ status: false });
    })
}

const transfertoonlywallet = async (req, res) => {
    let transfer = new GftshoppeTransfer({
        sender: req.body.sender,
        receiverAddress: req.body.formdata.address,
        receiver: req.body.formdata.email,
        senderEmail: req.body.formdata.senderEmail,
        message: req.body.formdata.message,
        tokenId: req.body.tokenId,
        transactionHash: req.body.transactionHash,
        type: "Wallet",
        status: "Sent"
    });
    transfer.save()
    .then(async result => {
        if (req.body.formdata.email && req.body.formdata.email != '') {
            console.log("okay")
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.MAIL_ADDRESS,
                    pass: process.env.MAIL_APP_PASSWORD
                }
            });
            let emailTemplate = fs.readFileSync('./views/mail-templates/transfer-to-receiver.html', { encoding: 'utf-8' });
            emailTemplate = handlebars.compile(emailTemplate);
            const replacements = {
                useremail: req.body.formdata.email,
                fromemail: req.body.formdata.senderEmail != "" ? req.body.formdata.senderEmail : req.body.sender,
            };
            const htmlToSend = emailTemplate(replacements);
    
            const mailOptions = {
                from: process.env.MAIL_ADDRESS,
                // to: 'kostas@republicrealm.com',
                to: req.body.formdata.email,
                subject: 'Happy Holidays - You’ve been sent a GFT!',
                html: htmlToSend
            }
            sendReceiverResult  = await transporter.sendMail(mailOptions, function(error, info) {
                console.log('send to receiver')
            });
        } 

        if (req.body.formdata.senderEmail && req.body.formdata.senderEmail != '') {
            setTimeout(() => {
                console.log("good");
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.MAIL_ADDRESS,
                        pass: process.env.MAIL_APP_PASSWORD
                    }
                });
                // send email to sender 
                let emailTemplate = fs.readFileSync('./views/mail-templates/transfer-to-sender.html', { encoding: 'utf-8' });
                emailTemplate = handlebars.compile(emailTemplate);
                const replacements = {
                    useremail: req.body.formdata.senderEmail,
                    toemail: req.body.formdata.email != '' ? req.body.formdata.email : req.body.formdata.address,
                };
                const htmlToSend = emailTemplate(replacements);
    
                const mailOptions = {
                    from: process.env.MAIL_ADDRESS,
                    // to: 'kostas@republicrealm.com',
                    to: req.body.formdata.senderEmail,
                    subject: 'Happy Holidays - Your GFT is on the way!',
                    html: htmlToSend
                }
                transporter.sendMail(mailOptions, function(error1, info1) {
                    console.log('send to sender')    
                })
            }, 1000)
        } 
        res.json({ status: true });
        
    })
    .catch(err => {
        res.json({ status: false });
    })
}

module.exports = { transferbywallet, getAdminWallet, transfertoemail, transfertoownwallet, receiveGFT, transferfromemailtowallet, transferfromemailtoemail, transfertoonlywallet };