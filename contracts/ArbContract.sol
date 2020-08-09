pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface UNI {
    // Address of ERC20 token sold on this exchange
    function tokenAddress() external view returns (address token);
    // Address of Uniswap Factory
    function factoryAddress() external view returns (address factory);
    // Provide Liquidity
    function addLiquidity(uint256 min_liquidity, uint256 max_tokens, uint256 deadline) external payable returns (uint256);
    function removeLiquidity(uint256 amount, uint256 min_eth, uint256 min_tokens, uint256 deadline) external returns (uint256, uint256);
    // Get Prices
    function getEthToTokenInputPrice(uint256 eth_sold) external view returns (uint256 tokens_bought);
    function getEthToTokenOutputPrice(uint256 tokens_bought) external view returns (uint256 eth_sold);
    function getTokenToEthInputPrice(uint256 tokens_sold) external view returns (uint256 eth_bought);
    function getTokenToEthOutputPrice(uint256 eth_bought) external view returns (uint256 tokens_sold);
    // Trade ETH to ERC20
    function ethToTokenSwapInput(uint256 min_tokens, uint256 deadline) external payable returns (uint256  tokens_bought);
    function ethToTokenTransferInput(uint256 min_tokens, uint256 deadline, address recipient) external payable returns (uint256  tokens_bought);
    function ethToTokenSwapOutput(uint256 tokens_bought, uint256 deadline) external payable returns (uint256  eth_sold);
    function ethToTokenTransferOutput(uint256 tokens_bought, uint256 deadline, address recipient) external payable returns (uint256  eth_sold);
    // Trade ERC20 to ETH
    function tokenToEthSwapInput(uint256 tokens_sold, uint256 min_eth, uint256 deadline) external returns (uint256  eth_bought);
    function tokenToEthTransferInput(uint256 tokens_sold, uint256 min_eth, uint256 deadline, address recipient) external returns (uint256  eth_bought);
    function tokenToEthSwapOutput(uint256 eth_bought, uint256 max_tokens, uint256 deadline) external returns (uint256  tokens_sold);
    function tokenToEthTransferOutput(uint256 eth_bought, uint256 max_tokens, uint256 deadline, address recipient) external returns (uint256  tokens_sold);
}

// interface GasToken {
//   function free(uint256 value) public returns (bool success);
//   function freeUpTo(uint256 value) public returns (uint256 freed);
//   function freeFrom(address from, uint256 value) public returns (bool success);
//   function freeFromUpTo(address from, uint256 value) public returns (uint256 freed);
// }

contract ArbContract {
  address owner; // creater of the contract
  IERC20 ERC20; // ERC20 token instance
  UNI UNISWAP_DAI_V1; // Uniswap contract

  modifier onlyOwner() {
    if(msg.sender != owner) {
      revert();
    }
    _;
  }

  // function burnGasAndFree(address gas_token, uint256 free) public {
  //   require(Gastoken(gas_token).free(free));
  // }

  constructor() public {
    owner = msg.sender;
    UNISWAP_DAI_V1 = UNI(0xc0fc958f7108be4060F33a699a92d3ea49b0B5f0);
  }

  function arbOnKyberToUniswap(address _tokenAddress) public onlyOwner returns(bool) {
    IERC20 DAI = IERC20(_tokenAddress);
    // UNISWAP_DAI_V1.getEthToTokenInputPrice(_inputAmount);
    uint256 daiBalance = DAI.balanceOf(address(this));
    DAI.transfer(owner, daiBalance);
  }

  function withdrawTokens(address _recipient, address _tokenAddress, uint256 _amount)
  public
  onlyOwner
  {
    ERC20 = IERC20(_tokenAddress);
    ERC20.transfer(_recipient, _amount);
  }

  function withdrawEther(address payable _recipient, uint256 _amount)
  public
  onlyOwner
  {
    _recipient.transfer(_amount);
  }
}