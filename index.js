require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const ABIS = require('./abis');

// .env 
const {
  SERVER_PORT,
  RPC_URL,
  PRIV_KEY
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
const uniswapContract = new web3.eth.Contract(UNISWAP_ABI, UNISWAP_ADDRESS);

const getBalance = async () => {
  const daiDecimals = await daiContract.methods.decimals().call();
  console.log(daiDecimals);
}

getBalance();

app.listen(SERVER_PORT, () => console.log(`Listening on Port ${SERVER_PORT}`));