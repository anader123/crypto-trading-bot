require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const moment = require('moment');
const arbContractABI = require('./build/contracts/ArbContract.json');


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
  UNISWAP_EXCHANGE_ABI,
  KYBER_RATE_ABI,
  UNISWAP_FACTORY_ABI
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

// Constract Addresses (Mainnet)
const UNISWAP_FACTORY_ADDRESS = '0xc0a47dfe034b400b47bdad5fecda2621de6c4d95'
const KYBER_RATE_ADDRESS = '0x96b610046d63638d970e6243151311d8827d69a5'

// Contract Instances
const kyberRateContract = new web3.eth.Contract(KYBER_RATE_ABI, KYBER_RATE_ADDRESS)
const uniswapV1FactoryContract = new web3.eth.Contract(UNISWAP_FACTORY_ABI, UNISWAP_FACTORY_ADDRESS)

// Trade Parameters
const ethTradeAmount = web3.utils.toWei('0.1', 'Ether');
const ethSellPrice = web3.utils.toWei('300', 'Ether')

// Ropsten
const tradeEthForDai = async () => {
  const uniswapV1DaiContract = new web3.eth.Contract(UNISWAP_EXCHANGE_ABI, '0xc0fc958f7108be4060F33a699a92d3ea49b0B5f0')
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


const checkPair = async (args) => {
  const { 
    inputTokenSymbol, 
    inputTokenAddress, 
    outputTokenSymbol, 
    outputTokenAddress, 
    inputAmount 
  } = args;
  
  const exchangeAddress = await uniswapV1FactoryContract.methods.getExchange(outputTokenAddress).call()
  const exchangeContract = new web3.eth.Contract(UNISWAP_EXCHANGE_ABI, exchangeAddress);

  const uniswapResult = await exchangeContract.methods.getEthToTokenInputPrice(inputAmount).call();
  let kyberResult = await kyberRateContract.methods.getExpectedRate(inputTokenAddress, outputTokenAddress, inputAmount, true).call();

  console.table([{
    'Input Token': inputTokenSymbol,
    'Output Token': outputTokenSymbol,
    'Input Amount': web3.utils.fromWei(inputAmount, 'Ether'),
    'Uniswap Return': web3.utils.fromWei(uniswapResult, 'Ether'),
    'Kyber Expected Rate': web3.utils.fromWei(kyberResult.expectedRate, 'Ether'),
    'Kyber Min Return': web3.utils.fromWei(kyberResult.slippageRate, 'Ether'),
    'Time': moment().format()
  }])
}

let priceMonitor;
let monitoringPrice = false;

const monitorPrice = async () => {
  if(monitoringPrice) {
    return
  }

  monitoringPrice = true;

  try{
    await checkPair({
      inputTokenSymbol: 'ETH',
      inputTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      outputTokenSymbol: 'DAI',
      outputTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
      inputAmount: web3.utils.toWei('1', 'ETHER')
    })
  }

  catch(error) {
    console.error(error);
    monitoringPrice = false;
    clearInterval(priceMonitor);
    return
  }

  monitoringPrice = false;
}

const pollingInterval = POLLING_INTERVAL || 1000;
// priceMonitor = setInterval(async () => {await monitorPrice()}, pollingInterval);

const callContract = async () => {
  try{
    const ropstenDaiAddress = '0xad6d458402f60fd3bd25163575031acdce07538d';
    const daiContract = new web3.eth.Contract(ERC20_ABI, ropstenDaiAddress);
    const daiBalance1 = await daiContract.methods.balanceOf('0x76a8B390A2463D82fcE1c28334f91D454F555470').call();
    const arbContract = new web3.eth.Contract(arbContractABI.abi, '0xac7b26de7c04858684766d2c0390ceeee1a2220a');
    const result = await arbContract.methods.arbOnKyberToUniswap(ropstenDaiAddress).send({
      from: '0x76a8B390A2463D82fcE1c28334f91D454F555470',
      gasLimit: web3.utils.toHex(150000),      // posted at compound.finance/developers#gas-costs
      gasPrice: web3.utils.toHex(20000000000)
    });
    console.log(result.transactionHash);
    const daiBalance2 = await daiContract.methods.balanceOf('0x76a8B390A2463D82fcE1c28334f91D454F555470').call();
    console.log(daiBalance1, daiBalance2);
  }
  catch (error) {
    console.log(error);
  }
}

callContract();