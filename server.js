var config = require('./config/config');
var fs = require('fs');
var parse = require('csv-parse/lib/sync');
var delay = require('delay');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: './outputs/transactions.csv',
  header: [
    {id: 'Name', title: 'Name'},
    {id: 'Address', title: 'Address'},
    {id: 'Amount', title: 'Amount'},
    {id: 'TxHash', title: 'TxHash'},
  ]
});

const Tx = require('ethereumjs-tx');
const Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

var abiArray = JSON.parse(fs.readFileSync('./src/abi.json', 'utf-8'));
var contract = web3.eth.contract(abiArray).at(config.contractAddress);
var privKey = new Buffer(config.myPrivateKey, 'hex');
var transactionCount = web3.eth.getTransactionCount(config.myAddress);


var input = readCSV(config.inputFileName);
var transactionRecords = [];
var arrayCounter = 0;


console.log(web3.isConnected());
// sendTokens(input);
// writeToCSV();

function readCSV (fileName) {
  return parse(fs.readFileSync(fileName, 'utf-8'), {columns: true});
}

function buildRawTransaction(nonce, gasPrice, gasLimit, toAddress, amount){
  return {
    // "from": "myAddress",
    "nonce": web3.toHex(nonce),
    "gasPrice": web3.toHex(gasPrice),
    "gasLimit": web3.toHex(gasLimit),
    "to": config.contractAddress,
    "value": web3.toHex(0),
    "data": contract.transfer.getData(toAddress, amount, {from: "myAddress"}),
    "chainId": 0x01
  }
}

function sendToken(serializedTx, toAddress, amount, name) {

  web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'), function(err, hash) {
    if (!err){

      let transactionRecord = {
        Name: name,
        Address: toAddress,
        Amount: amount,
        TxHash: hash
      }

      transactionRecords.push(transactionRecord);
      console.log(hash);
      arrayCounter++;
    }
    else{
      console.error(err);
    }
  });
}

function sendTokens (input){

  for(var i = 0; i < input.length; i++) {

    var element = input[i];

    var toAddress = element.Address;
    var amount = element.Amount;
    var name = element.Name;

    var rawTransaction = buildRawTransaction(transactionCount, config.gasPrice, config.gasLimit, toAddress, amount);
    var tx = new Tx(rawTransaction);

    tx.sign(privKey);
    var serializedTx = tx.serialize();

    sendToken(serializedTx, toAddress, amount, name);

    transactionCount++;

  }
}

async function writeToCSV(){

  while(arrayCounter !== input.length){
    await delay(500);
  }

  buildCSV();
}

function buildCSV (){
  // create a csv record
  csvWriter.writeRecords(transactionRecords)
  .then(() => {
    console.log('...Done');
  });
}
