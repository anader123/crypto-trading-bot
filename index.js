require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const moment = require('moment');

// ABIs
const ABIS = require('./abis');

// .env 
const {
  SERVER_PORT,
  RPC_URL,
  PRIV_KEY,
  ADDRESS
} = process.env;

// ABIs
const {
  DAI_ABI,
  UNISWAP_ABI
} = ABIS;

// App Instance
const app = express();

// Middleware 
app.use(express.json());
app.use(cors());

// Web3 Init
const web3 = new Web3(new HDWalletProvider(PRIV_KEY, RPC_URL));

// Constract Instances (Ropsten)
const DAI_ADDRESS = '0xad6d458402f60fd3bd25163575031acdce07538d';
const UNISWAP_ADDRESS = '0xc0fc958f7108be4060F33a699a92d3ea49b0B5f0';

const daiContract = new web3.eth.Contract(DAI_ABI, DAI_ADDRESS);
const uniswapV1DaiContract = new web3.eth.Contract(UNISWAP_ABI, UNISWAP_ADDRESS);

const tradeEthForDai = async () => {
  const ethAmount = web3.utils.toWei('0.001', 'Ether');
  const daiAmount = await uniswapV1DaiContract.methods.getEthToTokenInputPrice(ethAmount).call()
  console.log('Trade found, swapping Eth for Dai...');
  const now = moment().unix();
  const DEADLINE = now + 600;
  // console.log("Deadline", DEADLINE);

  const SETTINGS = {
    gasLimit: 900000,
    gasPrice: web3.utils.toWei('50', 'Gwei'),
    from: ADDRESS,
    value: ethAmount
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

app.listen(SERVER_PORT, () => console.log(`Bot is starting up on Port ${SERVER_PORT}`));

tradeEthForDai();