var fs = require('fs');
var parse = require('csv-parse/lib/sync');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var stringigy = require('csv-stringify');

const Tx = require('ethereumjs-tx');
const Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/vCfQu4uCspVZEATQTcmJ'));

// input is an array of objects
var input = parse(fs.readFileSync('Destinations.csv', 'utf-8'), {columns: true});

app.use(bodyParser.urlencoded({ extended: true }));

var myAddress, myPrivateKey;
var transactionRecords = [];


app.post('/send', (req, res) => {
    myAddress = req.body.fromAddress;
    myPrivateKey = req.body.fromPrivateKey;
    var count = web3.eth.getTransactionCount(myAddress);
    var itemsProcessed = 0;

    input.forEach((element) => {
        hash = sendToken(element.Address, element.Amount, count);
        count++;  
    });
// create a csv record
// fs.writeFile("./output.csv", stringigy(transactionRecords), (err)=>{
//     if(err) return console.log(err);
//     console.log("The file was saved!");
// });

});

function sendToken(toAddress, amount, count) {

    var abiArray = JSON.parse(fs.readFileSync('abi.json', 'utf-8'));
    var contractAddress = "0x14466590b32b83BE64898fD8b70E1a050DA0a9D0";
    var contract = web3.eth.contract(abiArray).at(contractAddress);

    var rawTransaction = {
        "from": "myAddress",
        "nonce": web3.toHex(count),
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
        }
        else{
            console.log(err);
        }

    });

};

var port = 8080;
app.listen(port, () => console.log("Listening on port " + port));

