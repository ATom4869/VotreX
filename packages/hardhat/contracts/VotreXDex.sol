// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "./VotreXTxInterface.sol";
import "./SafeMath.sol";

contract VotreXDex {
    using SafeMath for uint256;

    constructor(address _intefaceAddress){
        vxtInterface = VotreXTXInterface(_intefaceAddress);
        ContractOwner = msg.sender;
    }

    VotreXTXInterface public immutable vxtInterface;
    address public immutable ContractOwner;
    uint256 public VXPriceRequested;
    uint256 private FLRPricePoint;

    mapping(address => uint256) public allowances;

    event BuyVXTEvent (address indexed Requester,  uint256 FLRSent, uint256 VXTAmount);

    modifier onlyOwner() {
        require(msg.sender == ContractOwner, "Caller is not a staker");
        _;
    }

    function addVXTPricingFLR(uint256 _flrPrice) public {
        uint256 PricingConversion = _flrPrice * 1 ether;
        FLRPricePoint = PricingConversion;
    }

    function approveDeX(uint256 amount) external onlyOwner {
        require(msg.sender != address(0), "DeX Address not set");
        vxtInterface.approveDeX(amount);
        allowances[address(this)] = amount * 10 ** 18;
    }

    function checkFLR(uint256 _FLRAmount) public pure returns(uint256) {
        uint256 VXT = _FLRAmount * 1 ether;

        return VXT;
    }

    function convertToVXT(uint256 _VXTAmount) public pure returns(uint256) {
        uint256 VXT = _VXTAmount.mul(10**18);

        return VXT;
    }

    function GetVXTtoFLRPrice() public view returns(uint256) {

        return FLRPricePoint;
    }

    function calculateReqPricesFLR(uint256 ETHAmount) public view returns (uint256 FLRAmount, uint256 VXTAmount) {
        uint256 SentFLR = ETHAmount.mul(1 ether);
        uint256 vxtCheckout = SentFLR.div(FLRPricePoint);
        uint256 vxtNominal = vxtCheckout;

        return (SentFLR, vxtNominal);
    }

    receive() external payable {
        // emit Received(msg.sender, msg.value);
    }

    function BuyVXT() external payable {
        uint256 SentFLR = msg.value.mul(1 ether);
        uint256 vxtCheckout = SentFLR.div(FLRPricePoint);

        require(msg.value > FLRPricePoint.div(2), "Not sending at minimum reqirement");
        require(msg.value > 0, "Ether value can't 0");
        
        vxtInterface.VotreXTx(msg.sender, vxtCheckout);
        allowances[msg.sender] = vxtCheckout;

        emit BuyVXTEvent(msg.sender, msg.value, vxtCheckout);
    }

    function withdrawBalance() external onlyOwner{
        require(address(this).balance != 0 ether, "No FLR Left");
        uint256 withdrawalValue = address(this).balance;
        payable(ContractOwner).transfer(withdrawalValue);
    }

    function CheckTokenBalance () external view onlyOwner returns (uint256) {
        uint256 contractBalance = vxtInterface.checkBalance(address(this));
        return contractBalance;
    }
    
    function withdrawToken() external onlyOwner{
        uint256 contractBalance = vxtInterface.checkBalance(address(this));
        require(contractBalance > 0, "No Token left");
        vxtInterface.VotreXTx(payable(msg.sender), contractBalance);
    }


}
