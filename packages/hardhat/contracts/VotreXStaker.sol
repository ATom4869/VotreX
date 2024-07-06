// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "./VotreXToken.sol";
import "./VotreXTxInterface.sol";
import "./SafeMath.sol";

contract VotreXStake {
    using SafeMath for uint256;

    constructor(address _intefaceAddress){
        VXInterface = VotreXTXInterface(_intefaceAddress);
        Owner = msg.sender;
    }

    VotreXTXInterface private VXInterface;

    uint8 private constant STAKE_REWARD_PERCENTAGE = 5;
    uint256 private constant EPOCH_DURATION = 15 minutes;

    address private immutable Owner;
    address private Automation;
    address[] private Stakeraddress;

    uint256 private totalStake;
    uint256 private sharedRewards;
    uint256 private totalPrintToken;
    uint256 private accumulativePrintedToken;
    uint256 private totalInitialRewards;

    mapping(address => StakerStorage) public stakerInfo;
    mapping(address => uint256) public allowances;


    struct StakerStorage{
        address StakerAddress;
        uint256 StakingValue;
        uint256 initialReward;
        uint256 accumulativeReward;
        uint256 totalPrintedToken;
        uint256 PrintValue;
        uint256 startStakingTime;
        uint256 rewardTime;
    }

    event Staked(
        address indexed staker,
        uint256 stakeValue,
        uint256 rewardPercentage,
        uint256 rewardValue,
        uint256 StartTime,
        uint256 NextRewardTime
    );

    event TokenPrinted(
        address indexed Destination,
        uint256 printedValue
    );

    event Unstaked(
        address indexed staker,
        uint256 stakeValueTaken
    );

    modifier onlyStaker() {
        require(msg.sender == stakerInfo[msg.sender].StakerAddress, "Caller is not a staker");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == Owner, "Caller is not Owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == Owner
            ||
            msg.sender == Automation
            ||
            msg.sender == address(this),
            "Caller is not an Authorized"
        );
        _;
    }

    function setNewInterfaceAddress (address _interfaceAddress) external onlyOwner{
        require(
            _interfaceAddress != address(VXInterface),
            "Registered Interface"
        );

        require(
            _interfaceAddress != address(0),
            "Invalid contract address"
        );

        VXInterface = VotreXTXInterface(_interfaceAddress);
    }

    function authorizeAutomation(address _AutomationAddress) public onlyOwner{
        Automation = _AutomationAddress;
    }

    function approveStaking(uint256 amount) external onlyOwner {
        require(msg.sender != address(0), "Invalid Address");
        VXInterface.approveStaking(amount);
        allowances[address(this)] = amount * 10 ** 18;
    }

    function CheckTokenBalance() external view onlyOwner returns (uint256) {
        uint256 cotractBalance = VXInterface.checkBalance(address(this));
        return cotractBalance;
    }
    
    function withdrawTokentoOwner() external onlyOwner {
        uint256 contractBalance = VXInterface.checkBalance(address(this));
        uint256 withdrawalValue = contractBalance - totalStake;
        uint256 withdrawalsLimit = totalStake;
        require(totalPrintToken > 0, "Token is empty");
        require(contractBalance > withdrawalsLimit, "Withdrawal Limit Reached");

        VXInterface.VotreXTx(msg.sender, withdrawalValue);
    }

    function withdrawPrintedTokento(address _destination) external onlyOwner{
        uint256 withdrawalValue = accumulativePrintedToken - totalInitialRewards;
        uint256 contractBalance = VXInterface.checkBalance(address(this));
        uint256 withdrawalsLimit = totalStake;
        require(totalPrintToken > 0, "Token is empty");
        require(contractBalance > withdrawalsLimit, "Withdrawal Limit Reached");

        VXInterface.VotreXTx(_destination, withdrawalValue);
    }

    function stake(uint256 stakeVXTValue) public {
        require(stakeVXTValue > 0, "Stake value must be greater than 0");
        require(stakeVXTValue > 500, "Minimum stake is 500 VXT");
        require(stakeVXTValue < 4000000, "Maximum stake is 4.000.0000 VXT");
        require(stakerInfo[msg.sender].StakingValue == 0, "You already on staked phase");

        uint256 stakeValue = stakeVXTValue * 10**18;
        uint256 startTime = 10 seconds+block.timestamp;
        uint256 nextRewardTime = calculateNextTimeReward(startTime);
        uint256 rewardValue = calculateRewardValue(stakeValue);
        uint256 PrintValue = calculatePrintValue(stakeValue);

        VXInterface.Stake(true, msg.sender, stakeValue);

        stakerInfo[msg.sender] = StakerStorage(
            msg.sender,
            stakeValue,
            rewardValue,
            0,
            0,
            PrintValue,
            startTime,
            nextRewardTime
        );

        totalPrintToken += PrintValue;
        Stakeraddress.push(msg.sender);
        totalStake += stakeValue;
        totalInitialRewards += rewardValue;
        emit Staked(
            msg.sender,
            stakeValue,
            STAKE_REWARD_PERCENTAGE,
            stakerInfo[msg.sender].initialReward,
            startTime,
            nextRewardTime
        );
    }

    function unstake() public onlyStaker {
        uint256 initialStake = stakerInfo[msg.sender].StakingValue;
        require(initialStake > 0, "No stake to unstake");

        VXInterface.Stake(false, msg.sender, initialStake);

        uint256 stakerIndex = findStakerIndex(msg.sender);
        require(stakerIndex < Stakeraddress.length, "Staker not found");

        if (stakerIndex < Stakeraddress.length - 1) {
            Stakeraddress[stakerIndex] = Stakeraddress[Stakeraddress.length - 1];
        }
        Stakeraddress.pop();
        totalStake -= initialStake;
        sharedRewards -= stakerInfo[msg.sender].initialReward;
        totalPrintToken -= stakerInfo[msg.sender].PrintValue;
        accumulativePrintedToken -= stakerInfo[msg.sender].accumulativeReward;
        totalInitialRewards -= stakerInfo[msg.sender].initialReward;

        delete stakerInfo[msg.sender].StakerAddress;
        delete stakerInfo[msg.sender].StakingValue;
        delete stakerInfo[msg.sender].initialReward;
        delete stakerInfo[msg.sender].accumulativeReward;
        delete stakerInfo[msg.sender].totalPrintedToken;
        delete stakerInfo[msg.sender].PrintValue;
        delete stakerInfo[msg.sender].startStakingTime;
        delete stakerInfo[msg.sender].rewardTime;

        emit Unstaked(msg.sender, initialStake);
    }

    function checkTotalStakes() external view returns (uint256) {

        return totalStake;
    }

    function checksharedRewards() external view returns (uint256) {

        return sharedRewards;
    }

    function checkTotalPrintToken() external view returns (uint256) {

        return totalPrintToken;
    }

    function checkTotalInitialRewards() external view returns (uint256) {

        return totalInitialRewards;
    }

    function findStakerIndex(address stakerAddress) internal view returns (uint256) {
        for (uint256 i = 0; i < Stakeraddress.length; i++) {
            if (Stakeraddress[i] == stakerAddress) {
                return i;
            }
        }
        return Stakeraddress.length;
    }

    function distributeRewards() external onlyAuthorized {
        address[] memory stakersToReward = filterStakers();

        require(stakersToReward.length > 0, "No staker to reward");

        for (uint256 i = 0; i < stakersToReward.length; i++) {
            address staker = stakersToReward[i];
            uint256 PrintedToken = stakerInfo[staker].PrintValue;
            uint256 reward = stakerInfo[staker].initialReward;

            printToken(PrintedToken);
            VXInterface.Stake(false, staker, reward);

            stakerInfo[staker].accumulativeReward += stakerInfo[staker].initialReward;
            stakerInfo[staker].rewardTime = 10 seconds + block.timestamp + EPOCH_DURATION;
            sharedRewards += reward;
            accumulativePrintedToken += PrintedToken;
            stakerInfo[staker].totalPrintedToken += PrintedToken;
        }
    }

    function calculateNextTimeReward(uint256 _startTime) internal pure returns (uint256) {
        uint256 NextTime = _startTime + EPOCH_DURATION;
        return NextTime;

    }

    function printToken(uint256 _rewardValue) internal onlyAuthorized{
        require(_rewardValue > 0, "No reward to claim");
        VXInterface.printVXT(address(this), _rewardValue);

        emit TokenPrinted(address(this), _rewardValue);
    }

    function filterStakers() private view returns (address[] memory) {
        uint256 currentTime = block.timestamp;
        uint256 stakerCount = Stakeraddress.length;
        uint256 rewardsCount = 0;

        for (uint256 i = 0; i < stakerCount; ++i) {
            address staker = Stakeraddress[i];
            if (currentTime >= stakerInfo[staker].rewardTime) {
                ++rewardsCount;
            }
        }

        address[] memory stakersToReward = new address[](rewardsCount);

        uint256 index = 0;
        for (uint256 i = 0; i < stakerCount; ++i) {
            address staker = Stakeraddress[i];
            if (currentTime >= stakerInfo[staker].rewardTime) {
                stakersToReward[index] = staker;
                ++index;
            }
        }

        return stakersToReward;
    }

    function calculateRewardValue(uint256 stakeValue) private pure returns (uint256) {

        return calculatePrintValue(stakeValue).mul(STAKE_REWARD_PERCENTAGE).div(100);
    }

    function calculatePrintValue(uint256 stakeValue) private pure returns (uint256) {

        return stakeValue.mul(15).div(100);
    }

    function getStakerRewardTimes() public view returns (address[] memory stakerAddressList, uint256[] memory rewardTimeList) {
        uint256 stakerCount = Stakeraddress.length;
        stakerAddressList = new address[](stakerCount);
        rewardTimeList = new uint256[](stakerCount);

        for (uint256 i = 0; i < stakerCount; i++) {
            address staker = Stakeraddress[i];
            stakerAddressList[i] = staker;
            rewardTimeList[i] = stakerInfo[staker].rewardTime;
        }

        return (stakerAddressList, rewardTimeList);
    }


}
