var fs = require('fs');
var parse = require('csv-parse/lib/sync');
var tokenSender = require('./token-sender.js');

const Tx = require('ethereumjs-tx');
const Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/vCfQu4uCspVZEATQTcmJ'));


var myAddress = "0xA0bEc14CCf8Cb61db70557b07F2703C7c8ce4C69";
var myPrivateKey = "eb9c47dbe32787bb641048df11ea0ed5ca93f1d40b0343a4be0da7c2713358a6";


// input is an array of objects
var input = parse(fs.readFileSync('Destinations.csv', 'utf-8'), {columns: true});

input.forEach((element) => {
	sendToken(element.Address, element.Amount);
});


function sendToken(toAddress, amount) {
	
    var abiArray = JSON.parse(fs.readFileSync('abi.json', 'utf-8'));
    var contractAddress = "0x14466590b32b83BE64898fD8b70E1a050DA0a9D0";
    var contract = web3.eth.contract(abiArray).at(contractAddress);
    var count = web3.eth.getTransactionCount(myAddress);
    var rawTransaction = {
        "from": "myAddress",
        "nonce": web3.toHex(count),
        "gasPrice": web3.toHex(4),
        "gasLimit": web3.toHex(1000000),
        "to": contractAddress,
        "value": web3.toHex(0),
        "data": contract.transfer.getData(toAddress, amount, {from: "myAddress"}),
        "chainId": 0x03
    };

    var privKey = new Buffer(myPrivateKey, 'hex');
    var tx = new Tx(rawTransaction);

    tx.sign(privKey);
    var serializedTx = tx.serialize();

    web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'), function(err, hash) {
        if (!err){
            console.log(hash);
        }
        else
            console.log(err);
    });

};