const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const GftshoppeUser = require('../../models/gftshoppeUsersModel.js');
const config = require('../../config.js');

require('dotenv').config();

const signup = async (req, res) => {
    bcrypt.genSalt(10, (err, salt) => {
        if(err) return err;
        // Create the hashed password
        bcrypt.hash(req.body.formdata.password, salt, (err, hash) => {
            if(err) return err;
            // creating confirmation code
            const token = jwt.sign({email: req.body.formdata.email}, config.jwtSecret);

            gftshoppeUser = new GftshoppeUser({
                email: req.body.formdata.email,
                password: hash,
                confirmationCode: token
            });
            
            // Save the User
            gftshoppeUser.save()
            .then(( result ) => {
                // sending verification email
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.MAIL_ADDRESS,
                        pass: process.env.MAIL_APP_PASSWORD
                    }
                });
                let emailTemplate = fs.readFileSync('./views/mail-templates/register-verification.html', { encoding: 'utf-8' });
                emailTemplate = handlebars.compile(emailTemplate);
                const replacements = {
                    useremail: gftshoppeUser.email,
                    confirmationCode: token
                };
                const htmlToSend = emailTemplate(replacements);
                const mailOptions = {
                    from: process.env.MAIL_ADDRESS,
                    // to: 'kostas@republicrealm.com',
                    to: gftshoppeUser.email,
                    subject: 'Thank you for registering with GFTShoppe',
                    html: htmlToSend
                }
                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                        console.log(error);
                        res.json({status: false});
                    } else {
                        res.json({status: true});
                    }
                })
            })
            .catch((err) => {
                console.log(err)
                if (err.code === 11000) 
                    res.json({ status: false, error: "Email is already registered" });
                else
                    res.json({ status: false, error: err.errmsg });
            });
      });
  });
}

const confirmRegister = async (req, res) => {
    const code = req.body.code;
    let gftshoppeUser = await GftshoppeUser.findOne({confirmationCode: code});
    
    if (gftshoppeUser) {
        gftshoppeUser.status = 'Active';
        gftshoppeUser.save()
        .then(result => {
            const token = jwt.sign({
                id: result._id,
                email: result.email
            }, config.jwtSecret);
            session = req.session;
            session.token = token;

            res.json({ token: token, status: true, user: result })
        })
        .catch(err => {
            res.json({status: false})    
        })
    } else {
        res.json({status: false})
    }
}

const signin = async (req, res) => {
    GftshoppeUser.findOne({email: req.body.formdata.email}, (err, user) => {
        if (err) throw err;
        if (Boolean(user)) {
            // Match Password
            bcrypt.compare(req.body.formdata.password, user.password, (err, isMatch) => {
                if (err) return err;

                if (user.status === 'Pending') {
                    return res.json({ error: 'You are not verified. Please check your email.', status: false });
                }

                if (isMatch) {
                    const token = jwt.sign({
                            id: user._id,
                            email: user.email
                        }, config.jwtSecret);
                    session = req.session;
                    session.token = token;
                    if (req.body.formdata.rememberme) 
                        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; 
                    else 
                        req.session.cookie.expires = false;
                    res.json({ token: token, status: true, user: user })
                } else {
                   res.json({ error: 'Invalid Username or Password', status: false });
                }
            });
        } else {
            res.json({ error: 'Invalid Username or Password', status: false });
        }
    });
}

const checkLogin = (req, res) => {
    if (req.session.token !== undefined) {
        decoded = jwt.verify(req.session.token, config.jwtSecret);
        res.json({ email: decoded.email, id: decoded.id, token:req.session.token, isLogined: true });
    } else {
        res.json({ isLogined: false });
    }
}

const logout = (req, res) => {
    req.session.destroy();
    res.json({ status: true });
}

const sendForgotPwdEmail = async (req, res) => {
    gftshoppeUser = await GftshoppeUser.findOne({email: req.body.email});
    if (gftshoppeUser == null) {
        return res.json({status: false, error: "Email is not registered"});
    }
    const token = jwt.sign({email: req.body.email}, config.jwtSecret);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_ADDRESS,
            pass: process.env.MAIL_APP_PASSWORD
        }
    });
    let emailTemplate = fs.readFileSync('./views/mail-templates/forgot-password.html', { encoding: 'utf-8' });
    emailTemplate = handlebars.compile(emailTemplate);
    const replacements = {
        useremail: req.body.email,
        token: token
    };
    const htmlToSend = emailTemplate(replacements);
    const mailOptions = {
        from: process.env.MAIL_ADDRESS,
        to: req.body.email,
        subject: 'Please reset your password',
        html: htmlToSend
    }
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            res.json({status: false, error: "Send email Failed"});
        } else {
            res.json({status: true});
        }
    })    
}

const getForgotPwdEmail = async (req, res) => {
    const decoded = jwt.verify(req.body.token, config.jwtSecret);
    const email = decoded.email;
    res.json({status: true, email: email});
}

const resetPwd = async (req, res) => {
    let gftshoppeUser = await GftshoppeUser.findOne({email: req.body.formdata.email});
    if (gftshoppeUser == null) {
        return res.json({status: false, error: "Email is not registered"});
    }

    bcrypt.genSalt(10, (err, salt) => {
        if(err) 
            return res.json({status: false, error: "Failed on making new Password"});
        // Create the hashed password
        bcrypt.hash(req.body.formdata.password, salt, (err, hash) => {
            if(err) 
                return res.json({status: false, error: "Failed on making new Password"});
            // creating confirmation code
            gftshoppeUser.password = hash;
            gftshoppeUser.save()
            .then(user => {
                const token = jwt.sign({
                    id: user._id,
                    email: user.email
                }, config.jwtSecret);
                session = req.session;
                session.token = token;
                req.session.cookie.expires = false;
                res.json({ token: token, status: true, user: user })
            })
            .catch(error => {
                res.json({status: false, error: "Failed on making new Password"});
            })
        });
    });
}

module.exports = { signup, confirmRegister, signin, checkLogin, logout, sendForgotPwdEmail, getForgotPwdEmail, resetPwd };