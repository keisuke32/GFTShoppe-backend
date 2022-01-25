const express = require('express');
const gftshoppeAuthCtrl = require('../controller/gftshoppe/authCtrl');
const gftshoppeTransferCtrl = require('../controller/gftshoppe/transferCtrl');
const gftshoppeMintCtrl = require('../controller/gftshoppe/mintCtrl');
const router = express.Router();

// product category
router.post('/auth/signup', gftshoppeAuthCtrl.signup);
router.post('/auth/confirmRegister', gftshoppeAuthCtrl.confirmRegister);
router.post('/auth/signin', gftshoppeAuthCtrl.signin);
router.post('/auth/checkLogin', gftshoppeAuthCtrl.checkLogin);
router.post('/auth/logout', gftshoppeAuthCtrl.logout);
router.post('/auth/sendForgotPwdEmail', gftshoppeAuthCtrl.sendForgotPwdEmail);
router.post('/auth/getForgotPwdEmail', gftshoppeAuthCtrl.getForgotPwdEmail);
router.post('/auth/resetPwd', gftshoppeAuthCtrl.resetPwd);

router.post('/transfer/transferbywallet', gftshoppeTransferCtrl.transferbywallet);
router.post('/transfer/getAdminWallet', gftshoppeTransferCtrl.getAdminWallet);
router.post('/transfer/transfertoemail', gftshoppeTransferCtrl.transfertoemail);
router.post('/transfer/transfertoownwallet', gftshoppeTransferCtrl.transfertoownwallet);
router.post('/transfer/receiveGFT', gftshoppeTransferCtrl.receiveGFT);
router.post('/transfer/transferfromemailtowallet', gftshoppeTransferCtrl.transferfromemailtowallet);
router.post('/transfer/transferfromemailtoemail', gftshoppeTransferCtrl.transferfromemailtoemail);
router.post('/transfer/transfertoonlywallet', gftshoppeTransferCtrl.transfertoonlywallet);

router.post('/mint/requestMoonpay', gftshoppeMintCtrl.requestMoonpay);
router.post('/mint/buy', gftshoppeMintCtrl.buy);
router.post('/mint/getGFTs', gftshoppeMintCtrl.getGFTs);
router.post('/mint/saveWhitelist', gftshoppeMintCtrl.saveWhitelist);
router.post('/mint/checkWhitelist', gftshoppeMintCtrl.checkWhitelist);
// router.post('/auth/profile', gftshoppeCtrl.profile);
// router.post('/successMint', gftshoppeCtrl.successMint);

module.exports = router;
