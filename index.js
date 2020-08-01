require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const moment = require('moment');


// .env 
const {
  SERVER_PORT,
  RPC_URL,
  PRIV_KEY,
  ADDRESS,
  POLLING_INTERVAL
} = process.env;

// ABIs
const ABIS = require('./abis');
const {
  ERC20_ABI,
  UNISWAP_ABI
} = ABIS;

// App Instance
const app = express();

// Middleware 
app.use(express.json());
app.use(cors());

// Bot Listening 
app.listen(SERVER_PORT, () => console.log(`Bot is starting up on Port ${SERVER_PORT}`));

// Web3 Init
const web3 = new Web3(new HDWalletProvider(PRIV_KEY, RPC_URL));

// Constract Addresses (Ropsten)
const DAI_ADDRESS = '0xad6d458402f60fd3bd25163575031acdce07538d';
const UNISWAP_ADDRESS = '0xc0fc958f7108be4060F33a699a92d3ea49b0B5f0';

// Contract Instances
const daiContract = new web3.eth.Contract(ERC20_ABI, DAI_ADDRESS);
const uniswapV1DaiContract = new web3.eth.Contract(UNISWAP_ABI, UNISWAP_ADDRESS);

// Trade Parameters
const ethTradeAmount = web3.utils.toWei('0.1', 'Ether');
const ethSellPrice = web3.utils.toWei('300', 'Ether')

const tradeEthForDai = async () => {
  const daiAmount = await uniswapV1DaiContract.methods.getEthToTokenInputPrice(ethTradeAmount).call()
  console.log('Trade found, swapping Eth for Dai...');
  const now = moment().unix();
  const DEADLINE = now + 60; // 1 min deadline

  const SETTINGS = {
    gasLimit: 900000,
    gasPrice: web3.utils.toWei('50', 'Gwei'),
    from: ADDRESS,
    value: ethTradeAmount
  }

  try{
    console.log('Trade submitted to the blockchain');
    let result = await uniswapV1DaiContract.methods.ethToTokenSwapInput(daiAmount.toString(), DEADLINE).send(SETTINGS);
    console.log(`Transaction: https://ropsten.etherscan.io/tx/${result.transactionHash}`);
  }
  catch(error) {
    console.log('There was an error swapping: ', error);
  }
}

const checkBalances = async () => {
  let balance;

  balance = await web3.eth.getBalance(ADDRESS);
  balance = web3.utils.fromWei(balance, 'Ether');
  console.log("Eth Balance:", balance);

  balance = await daiContract.methods.balanceOf(ADDRESS).call();
  balance = web3.utils.fromWei(balance, 'Ether');
  console.log('Dai Balance:', balance);
}

let priceMonitor;
let monitoringPrice = false;

const monitorPrice = async () => {
  if(monitoringPrice) {
    return
  }

  console.log('Checking price...');
  monitoringPrice = true;

  try {
    const daiAmount = await uniswapV1DaiContract.methods.getEthToTokenInputPrice(ethTradeAmount).call();
    const price = web3.utils.fromWei(daiAmount.toString(), 'Ether');
    console.log('Eth Price:', price, 'DAI');

    if(price <= ethSellPrice) {
      console.log('Selling Eth...');
      await checkBalances();

      await tradeEthForDai(ethTradeAmount, daiAmount);

      await checkBalances();
    }
  }
  catch (error){
    console.error(error);
    monitoringPrice = false;
    clearInterval(priceMonitor);
    return;
  }

  monitoringPrice = false
}

const pollingInterval = POLLING_INTERVAL || 1000;
priceMonitor = setInterval(async () => {await monitorPrice()}, pollingInterval);