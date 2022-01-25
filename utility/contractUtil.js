const Web3 = require('web3');
const web3 = new Web3('https://rpc-mumbai.maticvigil.com');
web3.eth.accounts.wallet.add(process.env.AMDIN_PRIVATE_KEY);
const ContractConfig = require('../config/contract');
const Contract = new web3.eth.Contract(ContractConfig.ContractAbi,  ContractConfig.ContractAddr);
const WETHcontract = new web3.eth.Contract(ContractConfig.WETHAbi,  ContractConfig.WETHAddr);
const fromAddress = process.env.ADMIN_WALLET

const mint = (amount) => {
    return new Promise(async (resolve, reject) => {
        let gas = 100000
        WETHcontract.methods.approve(fromAddress, web3.utils.toWei((amount * 0.02).toString(), 'ether')).send({from: fromAddress, gas: gas})
        .then( res1 => {
            gas = 222816;
            Contract.methods.createTeamItem(amount).send({from: fromAddress, gas: gas * amount})
            .then( res => {
                resolve(res);
            })
            .catch(err => {
                return reject(err);
            });
        })
        .catch( err1 => {
            return reject(err1)
        })
    });
}

const transfer = (toAddress, tokenId) => {
    return new Promise(async (resolve, reject) => {
        Contract.methods.safeTransferFrom(process.env.ADMIN_WALLET, toAddress, tokenId).send({from: process.env.ADMIN_WALLET, gas: 138439})
        .then( res => {
            resolve(res);
        })
        .catch(err => {
            console.log(err)
            return reject(err);
        });
    });
}

module.exports = {
    mint,
    transfer
}