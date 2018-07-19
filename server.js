var fs = require('fs');
var parse = require('csv-parse/lib/sync');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var stringigy = require('csv-stringify');

const Tx = require('ethereumjs-tx');
const Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/vCfQu4uCspVZEATQTcmJ'));


app.use(bodyParser.urlencoded({ extended: true }));

var myAddress = "0xA0bEc14CCf8Cb61db70557b07F2703C7c8ce4C69";
var myPrivateKey = "eb9c47dbe32787bb641048df11ea0ed5ca93f1d40b0343a4be0da7c2713358a6";
var contractAddress = "0x14466590b32b83BE64898fD8b70E1a050DA0a9D0";
var inputFileName = 'Destinations.csv';

var transactionRecords = [];

var input = readCSV(inputFileName);
var abiArray = JSON.parse(fs.readFileSync('abi.json', 'utf-8'));
var contract = web3.eth.contract(abiArray).at(contractAddress);

var transactionCount = web3.eth.getTransactionCount(myAddress);


app.post('/send', (req, res) => {

    input.forEach((element) => {

        

        var toAddress = element.toAddress;
        var amount = element.amount;

        var rawTransaction = {
            "from": "myAddress",
            "nonce": web3.toHex(transactionCount),
            "gasPrice": web3.toHex(10),
            "gasLimit": web3.toHex(500000),
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



// create a csv record
// fs.writeFile("./output.csv", stringigy(transactionRecords), (err)=>{
//     if(err) return console.log(err);
//     console.log("The file was saved!");
// });

});

console.log(transactionRecords);

})

//     async function sendToken(toAddress, amount, count) {

//         var abiArray = JSON.parse(fs.readFileSync('abi.json', 'utf-8'));
//         var contractAddress = "0x14466590b32b83BE64898fD8b70E1a050DA0a9D0";
//         var contract = web3.eth.contract(abiArray).at(contractAddress);

//         console.log("Count: " + count);

//         var rawTransaction = {
//             "from": "myAddress",
//             "nonce": web3.toHex(count),
//             "gasPrice": web3.toHex(count),
//             "gasLimit": web3.toHex(500000),
//             "to": contractAddress,
//             "value": web3.toHex(0),
//             "data": contract.transfer.getData(toAddress, amount, {from: "myAddress"}),
//             "chainId": 0x03
//         };

//         var privKey = new Buffer(myPrivateKey, 'hex');
//         var tx = new Tx(rawTransaction);

//         tx.sign(privKey);
//         var serializedTx = tx.serialize();

//         web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'), function(err, hash) {
//             if (!err){
//                 console.log(hash);

//                 let transactionRecord = {
//                     Address: toAddress,
//                     Amount: amount,
//                     TxHash: hash
//                 }
//                 transactionRecords.push(transactionRecord);
//                 console.log("# of transactions: " + transactionRecords.length);
//                 return hash;
//            // console.log(transactionRecords);
//        }
//        else{
//         console.log(err);
//     }
// });

var port = 8080;
app.listen(port, () => console.log("Listening on port " + port));

function readCSV (fileName) {
    return parse(fs.readFileSync(fileName, 'utf-8'), {columns: true});
}
