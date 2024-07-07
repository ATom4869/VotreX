// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./VotreXToken.sol";

contract VotreXTXInterface {

    constructor(address _tokenAddress) {
        InterfaceMaster = msg.sender;
        interfaceActivated = false;
        vxtToken = VotreXToken(_tokenAddress);
        ContractStorage[msg.sender].tokenContract = _tokenAddress;
    }

    // gas: 646200;

    VotreXToken internal immutable vxtToken;
    bool private interfaceActivated;
    address private VotreXContract;
    address private dexContract;
    address private airdropContract;
    address private stakingContract;
    address private immutable InterfaceMaster;
    uint256 internal immutable MaxAllowances = 15000000 * 10 ** 18;

    mapping(address InterfaceMaster => IContract) public ContractStorage;
    // mapping(address => uint256) public allowances;

    struct IContract{
        address Authorized;
        address tokenContract;
        address stakingContract;
        address dexContract;
        address VotreXContract;
        address airdropContract;
    }

    modifier onlyActivated() {
        require(interfaceActivated == true, "Interface not Active");
        _;
    }

    modifier onlyPaused() {
        require(interfaceActivated == false, "Interface still Active");
        _;
    }

    modifier onlyStaking() {
        require(
            msg.sender == stakingContract,
            "Interface - Caller is not a Stake Contract"
        );
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == InterfaceMaster, "Interface - Caller is not Owner!");
        _;
    }

    modifier onlyDeX() {
        require(msg.sender == dexContract, "Interface - Caller is not DexApps!");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == InterfaceMaster ||
            msg.sender == dexContract ||
            msg.sender == stakingContract ||
            msg.sender == VotreXContract ||
            msg.sender == airdropContract,
            "Interface - Caller is not an Authorized!"
        );
        _;
    }

    event BuyVXTEvent(address Buyer, uint256 VXTTransfered);
    event TransferedVXTEvent(address Receiver, uint256 VXTTransfered);
    event withdrawnToken(address from, address Receiver, uint256 VXTTransfered);
    event VotedEvent(address Voter, uint256 VotedPower);
    event TokenDropped(address Recipient, uint256 DroppedValue);

    function changeSystemState() external onlyOwner{

        if (interfaceActivated == false) {
            interfaceActivated = true;
        } else if (interfaceActivated == true) {
            interfaceActivated = false;
        }

    }

    function isActivatedInterfaceCheck() public view returns (bool isActivatedInterface) {

        return interfaceActivated;
    }

    function getTokenContract() external view onlyOwner returns(address){
        return ContractStorage[msg.sender].tokenContract;
    }

    function setVotreXSys (address _VotreXContract) external onlyOwner onlyPaused{
        require(
            _VotreXContract != ContractStorage[msg.sender].VotreXContract,
            "Interface - Registered VotreX"
        );

        require(
            _VotreXContract != address(0),
            "Interface - Invalid contract address"
        );

        VotreXContract = _VotreXContract;
        ContractStorage[msg.sender].VotreXContract = _VotreXContract;
    }

    function setStakingContract (address _stakingAddress) external onlyOwner onlyPaused{
        require(
            _stakingAddress != ContractStorage[msg.sender].stakingContract,
            "Interface - Registered VotreX Staking"
        );

        require(
            _stakingAddress != address(0),
            "Interface - Invalid contract address"
        );

        stakingContract = _stakingAddress;
        ContractStorage[msg.sender].stakingContract = _stakingAddress;
    }

    function setDeX (address _dexContract) external onlyOwner onlyPaused{
        require(
            _dexContract != ContractStorage[msg.sender].dexContract,
            "Interface - Registered VotreX DeX"
        );

        require(
            _dexContract != address(0),
            "Invalid contract address"
        );

        dexContract = _dexContract;
        ContractStorage[msg.sender].dexContract = _dexContract;
    }

    function setAirdrop (address _AirdropContract) external onlyOwner onlyPaused{
        require(
            _AirdropContract != ContractStorage[msg.sender].airdropContract,
            "Interface - Registered VotreX Airdrop"
        );

        require(
            _AirdropContract != address(0),
            "Invalid contract address"
        );

        airdropContract = _AirdropContract;
        ContractStorage[msg.sender].airdropContract = _AirdropContract;
    }

    function approveTxInterface(uint32 amount) external onlyOwner {
        uint256 TokenConversion = uint256(amount) * 10 ** vxtToken.decimals();

        require(address(this) != address(0), "Interface - Invalid address");
        require(TokenConversion < MaxAllowances, "Can not approve more than limit");

        vxtToken.customApprove(address(vxtToken), address(this), TokenConversion);
    }

    function approveVotreX(uint256 amount) external onlyAuthorized onlyActivated{
        uint256 TokenConversion = amount * 10 ** vxtToken.decimals();

        require(ContractStorage[msg.sender].VotreXContract != address(0), "Interface - VotreX Address not set");
        require(TokenConversion < MaxAllowances, "Can not approve more than limit");

        vxtToken.customApprove(VotreXContract, address(this), TokenConversion);
    }

    function approveAirdrop(uint256 amount) external onlyAuthorized onlyActivated{
        uint256 TokenConversion = amount * 10 ** vxtToken.decimals();

        require(address(this) != address(0), "Interface - Invalid address");
        require(TokenConversion < MaxAllowances, "Can not approve more than limit");

        vxtToken.customApprove(msg.sender, address(this), TokenConversion);
    }

    function approveStaking(uint256 amount) external onlyAuthorized onlyActivated{
        uint256 TokenConversion = amount * 10 ** vxtToken.decimals();

        require(msg.sender != address(0), "Interface - Staking Address not set");
        require(amount < MaxAllowances, "Interface - Can not approve more than limit");

        vxtToken.customApprove(msg.sender, address(this), TokenConversion);
    }

    function approveDeX(uint256 amount) external virtual onlyAuthorized onlyActivated{
        uint256 TokenConversion = amount * 10 ** vxtToken.decimals();

        require(msg.sender != address(0), "Interface - DeX Address not set");
        require(TokenConversion < MaxAllowances, "Interface - Can not approve more than limit");

        vxtToken.customApprove(msg.sender, address(this), TokenConversion);
    }

    function checkApprovalLimit(address _ContractAddress) external view returns (uint256){
        if(_ContractAddress == ContractStorage[msg.sender].VotreXContract){
            return (
                vxtToken.allowance(
                    ContractStorage[msg.sender].VotreXContract, address(this)
                )
            );
        }
        else if(_ContractAddress == ContractStorage[msg.sender].dexContract){
            return (
                vxtToken.allowance(
                    ContractStorage[msg.sender].dexContract, address(this)
                )
            );
        }
        else if(_ContractAddress == ContractStorage[msg.sender].stakingContract){
            return (
                vxtToken.allowance(
                    ContractStorage[msg.sender].stakingContract, address(this)
                )
            );
        }
        else if(_ContractAddress == ContractStorage[msg.sender].airdropContract){
            return (
                vxtToken.allowance(
                    ContractStorage[msg.sender].airdropContract, address(this)
                )
            );
        }
        else {
            return (404);
        }
    }

    function checkBalance(address account) external view virtual onlyActivated returns (uint256) {
        return vxtToken.balanceOf(account);
    }

    function balanceTx(address _Recipient, uint256 _value) external onlyOwner{
        uint256 vxtNominalTransfer = _value * 10 ** vxtToken.decimals();

        if (
            _Recipient == ContractStorage[msg.sender].VotreXContract
        ) {
            if (
                vxtToken.allowance(msg.sender, address(this)) >= MaxAllowances
                &&
                vxtToken.allowance(msg.sender, address(this)) >= vxtNominalTransfer
            )
            {
                vxtToken.transferFrom(address(vxtToken), VotreXContract, vxtNominalTransfer);
            } else {
                vxtToken.customApprove(msg.sender, _Recipient, vxtNominalTransfer);
                vxtToken.customApprove(msg.sender, address(this), vxtNominalTransfer);

                vxtToken.transferFrom(address(vxtToken), VotreXContract, vxtNominalTransfer);
            }
        } else if (
            _Recipient == ContractStorage[msg.sender].dexContract
        ) {
            if (
                vxtToken.allowance(msg.sender, address(this)) >= MaxAllowances
                &&
                vxtToken.allowance(msg.sender, address(this)) >= vxtNominalTransfer
            )
            {
                vxtToken.transferFrom(address(vxtToken),dexContract, vxtNominalTransfer);
            }
            else {
                vxtToken.customApprove(msg.sender, _Recipient, vxtNominalTransfer);
                vxtToken.customApprove(msg.sender, address(this), vxtNominalTransfer);

                vxtToken.transferFrom(address(vxtToken), dexContract, vxtNominalTransfer);
            }
        } else if (_Recipient == InterfaceMaster) {
            require(_value < 4000000, "Interface - Transfer limit Reached");
            require(msg.sender == InterfaceMaster, "Interface - Not Authorized");

            // Case for Interface Master
            if (
                vxtToken.allowance(msg.sender, address(this)) >= vxtNominalTransfer
                &&
                vxtToken.allowance(msg.sender, address(this)) >= MaxAllowances
            ){
                vxtToken.transferFrom(address(vxtToken), address(InterfaceMaster), vxtNominalTransfer);
            } else {
                vxtToken.customApprove(address(vxtToken), address(this), vxtNominalTransfer);
                vxtToken.customApprove(address(vxtToken), InterfaceMaster, vxtNominalTransfer);

                vxtToken.transferFrom(address(vxtToken), msg.sender, vxtNominalTransfer);

                emit TransferedVXTEvent(msg.sender, vxtNominalTransfer);
            }
        }else if (
            _Recipient != InterfaceMaster||
            _Recipient != ContractStorage[msg.sender].dexContract ||
            _Recipient != ContractStorage[msg.sender].VotreXContract
        ){
            revert();
        }
    }

    function TokenWithdraw(uint256 _value)external onlyOwner{
        uint256 vxtNominalTransfer = _value * 10 ** vxtToken.decimals();
        if (
                vxtToken.allowance(VotreXContract, address(this)) >= MaxAllowances
                &&
                vxtToken.allowance(VotreXContract, address(this)) >= vxtNominalTransfer
            )
            {
                vxtToken.transferFrom(VotreXContract, msg.sender, vxtNominalTransfer);
            } else {
                vxtToken.customApprove(VotreXContract, address(this), vxtNominalTransfer);

                vxtToken.transferFrom(VotreXContract,msg.sender, vxtNominalTransfer);
        }
    }

    function VotreXTx(
        address _Recipient,
        uint256 _value
    )
        external
        onlyAuthorized
        onlyActivated
    {
        uint256 vxtNominalTransfer = _value * 10 ** vxtToken.decimals();

        if (msg.sender == VotreXContract) {
            // Case for VotreX
            if (
                vxtToken.allowance(VotreXContract, address(this)) >= vxtNominalTransfer
                &&
                vxtToken.allowance(VotreXContract, address(this)) >= MaxAllowances
            )
            {
                vxtToken.transferFrom(VotreXContract, _Recipient, vxtNominalTransfer);
            } else if (
                vxtToken.allowance(VotreXContract, address(this)) <= vxtNominalTransfer
                &&
                vxtToken.allowance(VotreXContract, address(this)) <= MaxAllowances
            ){
                vxtToken.customApprove(VotreXContract, _Recipient, vxtNominalTransfer);
                vxtToken.customApprove(VotreXContract, address(this), vxtNominalTransfer);
                vxtToken.customApprove(_Recipient, address(this), vxtNominalTransfer);

                vxtToken.transferFrom(VotreXContract, _Recipient, vxtNominalTransfer);

                emit TransferedVXTEvent(VotreXContract, vxtNominalTransfer);
            }
        } else if (msg.sender == dexContract) {
            // Case for DeX
            if (
                vxtToken.allowance(address(dexContract), address(this)) >= _value
                &&
                vxtToken.allowance(address(dexContract), address(this)) >= MaxAllowances
            )
            {
                vxtToken.transferFrom(address(dexContract), _Recipient, _value);
            }
            else {
                vxtToken.customApprove(address(dexContract), _Recipient, _value);
                vxtToken.customApprove(address(dexContract), address(this), _value);

                vxtToken.transferFrom(address(dexContract), _Recipient, _value);

                emit BuyVXTEvent(address(dexContract), _value);
            }
        } else if (msg.sender == stakingContract) {
            // Case for Staking Contract
            if (
                vxtToken.allowance(msg.sender, address(this)) >= _value
                &&
                vxtToken.allowance(msg.sender, address(this)) >= MaxAllowances
            ){
                vxtToken.transferFrom(msg.sender, _Recipient, _value); 
            }
            else {
                vxtToken.customApprove(msg.sender, _Recipient, _value);
                vxtToken.customApprove(msg.sender, address(this), _value);
                vxtToken.customApprove(_Recipient, address(this), _value);

                vxtToken.transferFrom(msg.sender, _Recipient, _value);

                emit withdrawnToken(msg.sender, _Recipient, _value);
            }
        } else if (msg.sender == airdropContract) {
            // Case for Airdrop
            if (
                vxtToken.allowance(msg.sender, address(this)) >= _value
            ){
                vxtToken.transferFrom(msg.sender, _Recipient, _value);
            }
            else {
                vxtToken.customApprove(msg.sender, _Recipient, _value);
                vxtToken.customApprove(msg.sender, address(this), _value);

                vxtToken.transferFrom(msg.sender, _Recipient, _value);

                emit TokenDropped(_Recipient, _value);
            }
        }
    }

    function VoteTx(address _Sender, uint256 _value) external onlyAuthorized onlyActivated{
        require (msg.sender == VotreXContract, "Interface - Not VotreX");

        uint256 vxtNominalTransfer = _value * 10 ** vxtToken.decimals();

        if (
            vxtToken.allowance(msg.sender, address(this)) >= vxtNominalTransfer
            &&
            vxtToken.allowance(msg.sender, address(this)) >= MaxAllowances
        ) {
            vxtToken.transferFrom(_Sender, msg.sender, vxtNominalTransfer);
        } else {
            vxtToken.customApprove(_Sender, address(this), vxtNominalTransfer);

            vxtToken.transferFrom(_Sender, msg.sender, vxtNominalTransfer);

            emit VotedEvent(msg.sender, vxtNominalTransfer);
        }
    }

    function printVXT(address _recipient, uint256 _rewardValue) external onlyAuthorized onlyActivated{
        vxtToken.mint(_recipient, _rewardValue);
    }

    function totalSupplies() external view returns(uint256) {
        return vxtToken.totalSupply();
    }

    function Stake(
        bool isStaking,
        address _Recipient,
        uint256 _value
    )
        external
        onlyAuthorized
        onlyActivated
    {
        if (
            msg.sender == stakingContract
            &&
            isStaking == true
        ) {
            // Case for Staking
            if (
                vxtToken.allowance(msg.sender, address(this)) >= _value
                &&
                vxtToken.allowance(msg.sender, _Recipient) >= _value
                &&
                vxtToken.allowance(msg.sender, address(this)) >= MaxAllowances
                &&
                vxtToken.allowance(msg.sender, _Recipient) >= MaxAllowances
                )
            {
                vxtToken.transferFrom(_Recipient, msg.sender, _value);
            } else {
                // Case 4: Approve and transfer
                vxtToken.customApprove(_Recipient, address(this), _value);
                vxtToken.customApprove(msg.sender, address(this), _value);
                vxtToken.customApprove(_Recipient, msg.sender, _value);

                vxtToken.transferFrom(_Recipient, msg.sender, _value);
            }
        } else if (
            msg.sender == stakingContract
            &&
            isStaking == false
        ) {
            // Case for unStaking & Reward Distribution
            if (
                vxtToken.allowance(msg.sender, address(this)) >= _value
                &&
                vxtToken.allowance(msg.sender, _Recipient) >= _value
                &&
                vxtToken.allowance(msg.sender, address(this)) >= MaxAllowances
                &&
                vxtToken.allowance(msg.sender, _Recipient) >= MaxAllowances
            )
            {
                vxtToken.transferFrom(msg.sender, _Recipient, _value);
            }
            else {
                vxtToken.customApprove(msg.sender, _Recipient, _value);

                vxtToken.transferFrom(msg.sender, _Recipient, _value);
            }
        }
    }
}
