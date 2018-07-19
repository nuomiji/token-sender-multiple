var fs = require('fs');
var parse = require('csv-parse/lib/sync');
var config = require('./config');
// var stringigy = require('csv-stringify');

const Tx = require('ethereumjs-tx');
const Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/vCfQu4uCspVZEATQTcmJ'));

var transactionRecords = [];

var input = readCSV(config.inputFileName);
var abiArray = JSON.parse(fs.readFileSync('abi.json', 'utf-8'));
var contract = web3.eth.contract(abiArray).at(config.contractAddress);
var privKey = new Buffer(config.myPrivateKey, 'hex');

var transactionCount = web3.eth.getTransactionCount(config.myAddress);

input.forEach((element) => {

    var toAddress = element.toAddress;
    var amount = element.amount;

    var rawTransaction = {
        "from": "myAddress",
        "nonce": web3.toHex(transactionCount),
        "gasPrice": web3.toHex(10),
        "gasLimit": web3.toHex(500000),
        "to": config.contractAddress,
        "value": web3.toHex(0),
        "data": contract.transfer.getData(toAddress, amount, {from: "myAddress"}),
        "chainId": 0x03
    };


    var tx = new Tx(rawTransaction);

    tx.sign(privKey);
    var serializedTx = tx.serialize();

    web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'), function(err, hash) {
        if (!err){
            console.log(hash);

            let transactionRecord = {
                Address: toAddress,
                Amount: amount,
                TxHash: hash
            }
            transactionRecords.push(transactionRecord);
            console.log("# of transactions: " + transactionRecords.length);
       // console.log(transactionRecords);
       }
       else{
        console.error(err);
        }
    });


    transactionCount++;


});

console.log(transactionRecords);


function readCSV (fileName) {
    return parse(fs.readFileSync(fileName, 'utf-8'), {columns: true});
}
