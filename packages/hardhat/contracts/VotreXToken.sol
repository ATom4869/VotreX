//SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract VotreXToken is ERC20, ERC20Burnable, ERC20Pausable,ERC20Permit  {
    constructor(uint256 _initialMintedToken, uint256 _MaxSupplies)
        ERC20("VotreXToken", "VOX")
        ERC20Permit("VotreXToken")
    {
        Owner = msg.sender;
        MAXSupply = _MaxSupplies * 10 ** decimals();
        _mint(address(this),  _initialMintedToken * 10 ** decimals());
        activeSystem = true;
        currentMintAmount = (_MaxSupplies - _initialMintedToken) * 10 ** decimals();
    }

    address private Owner;
    bool private activeSystem;
    uint256 public immutable MAXSupply;
    uint256 private currentMintAmount;

    mapping (address Owner => IContract) public ContractStorage;

    struct IContract{
        address Authorized;
        address stakingContract;
        address dexContract;
        address VotreXContract;
        address interfaceContract;
    }

    modifier onlyInterface() {
        require(
            msg.sender == ContractStorage[Owner].interfaceContract, "Caller is not an interface"
        );
        _;
    }

    modifier onlyExecutor(){
        require(msg.sender == ContractStorage[Owner].Authorized);
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == ContractStorage[Owner].interfaceContract ||
            msg.sender == Owner, "Token - Caller is not an Authorized"
        );
        _;
    }

    modifier onlyOwner() {
        require(
            msg.sender == Owner, "Token - Caller is not an Authorized"
        );
        _;
    }

    modifier onlyPaused() {
        require(
            activeSystem == false, "System still active"
        );
        _;
    }

    function customApprove(address owner, address spender, uint256 amount) external onlyInterface {
        _approve(owner, spender, amount);
    }

    function pause() public onlyOwner {
        require(activeSystem == true, "System is Paused");
        _pause();
        activeSystem = false;
    }

    function Activate() public onlyOwner {
        require(activeSystem == false, "System is Activated");
        _unpause();
        activeSystem = true;
    }

    function setAutomationExecutor(address _executorAddress) external onlyOwner onlyPaused {
        require(
            _executorAddress != address(0),
            "Invalid contract address"
        );
        require(
            _executorAddress != ContractStorage[msg.sender].Authorized,
            "Already Registered Executor"
        );
        ContractStorage[msg.sender].Authorized = _executorAddress;
    }

    function setStakingContract(address _stakingContractAddress) external onlyOwner onlyPaused {
        require(
            _stakingContractAddress != address(0),
            "Invalid contract address"
        );
        require(
            _stakingContractAddress != ContractStorage[msg.sender].stakingContract,
            "Already Registered Staking"
        );
        ContractStorage[msg.sender].stakingContract = _stakingContractAddress;
    }

    function setDexContract(address _DEXContractAddress) external onlyOwner onlyPaused {
        require(
            _DEXContractAddress != address(0),
            "Invalid contract address"
        );
        require(
            _DEXContractAddress != ContractStorage[msg.sender].dexContract,
            "Already Registered DEX"
        );
        ContractStorage[msg.sender].dexContract = _DEXContractAddress;
    }

    function setInterface(address _InterfaceContractAddress) external onlyOwner onlyPaused {
        require(
            _InterfaceContractAddress != address(0),
            "Invalid contract address"
        );
        require(
            _InterfaceContractAddress != ContractStorage[msg.sender].interfaceContract,
            "Already Registered Interface"
        );
        ContractStorage[msg.sender].interfaceContract = _InterfaceContractAddress;
    }

    function setVotreXContract(address _VotreXContractAddress) external onlyOwner onlyPaused {
        require(
            _VotreXContractAddress != address(0),
            "Invalid contract address"
        );
        require(
            _VotreXContractAddress != ContractStorage[msg.sender].VotreXContract,
            "Already Registered VotreX"
        );
        ContractStorage[msg.sender].VotreXContract = _VotreXContractAddress;
    }

    function checkBlockTime() public view returns(uint256) {
        return block.timestamp;
    }

    function calculateHalving() public view returns (uint256) {
        uint256 nextMint = currentMintAmount / 2;

        return nextMint;
    }

    function autoMinting() public onlyExecutor{
        require(totalSupply() < MAXSupply, "Max Supply Reached");

        if (currentMintAmount == 0) {
            uint256 finalMintingValue = MAXSupply - totalSupply() ;
            _mint(address(this), finalMintingValue);
        } else {
            uint256 mintingValue = calculateHalving();
            _mint(address(this), mintingValue);
            currentMintAmount = mintingValue;

        }
    }

    function mint(address to, uint256 amount) public onlyAuthorized {
        if (msg.sender == ContractStorage[Owner].interfaceContract) {
            require(totalSupply() < MAXSupply);
            _mint(to, amount);
        } else if (msg.sender == Owner) {
            uint256 mintingValue = amount * 10**decimals();
            require(totalSupply() < MAXSupply);
            require(amount < 4000000);
            _mint(to, mintingValue);
            currentMintAmount =  currentMintAmount / 2;
        }
    }

    function burn(uint256 value) public onlyOwner override {
        uint256 burnedValue = value * 10**decimals();
        _burn(address(this), burnedValue);
    }

    function getCurrentMintAmount() external view returns(uint256){
        return currentMintAmount;
    }

    function getOwnerAddress() external view onlyOwner returns(address) {
        return(Owner);
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }

}