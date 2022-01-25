const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');

const path = require('path');
require('dotenv').config();

const comingsoonRoute = require('./routes/comingsoonRoute');
const gftShoppeRoute = require('./routes/gftshoppeRoute');
const config = require('./config.js');
const MONGODB_URI = config.mongodburi || 'mongodb://localhost:27017/republic-realm';
const PORT = process.env.PORT || 5000;

// mongodb config
mongoose.connect(MONGODB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true
});
mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});
mongoose.connection.on('error', (error) => {
    console.log(error);
});

let app = express();

// Body Parser Middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// session config
// creating 24 hours from milliseconds
const oneDay = 24 * 60 * 60 * 1000;

//session middleware
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));

// cookie parser middleware
app.use(cookieParser());


global.appRoot = path.resolve(__dirname);

// routing
app.use('/api/comingsoon', comingsoonRoute);
app.use('/api/gftshoppe', gftShoppeRoute);
// end routing

app.listen(PORT, () => {
    console.log('Server started on port', PORT);
});