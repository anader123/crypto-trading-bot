pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ArbContract {
  address owner; // creater of the contract
  IERC20 ERC20; // ERC20 token instance

  modifier onlyOwner() {
    if(msg.sender != owner) {
      revert();
    }
    _;
  }

  constructor() public {
    owner = msg.sender;
  }

  function arbOnKyberToUniswap(address _tokenAddress) public onlyOwner returns(bool) {
    ERC20 = IERC20(_tokenAddress);
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