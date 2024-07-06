// SPDX-License-Identifier: MIT
// pragma abicoder v2;
pragma solidity ^0.8.24;

import "./UtilityLibrary.sol";
import "./VotreXTxInterface.sol";

contract VotreXSystem{

    using UtilityLibrary for *;

    constructor(address _TXInterfaceAddress){
        VotreXOwnerAddress = msg.sender;
        VotreXActivated = false;
        TxInterface = VotreXTXInterface(_TXInterfaceAddress);
    }

    VotreXTXInterface internal immutable TxInterface;
    bool private VotreXActivated;
    address private previousVotreXOwnerAddress;
    address private VotreXOwnerAddress;
    bytes32 public VotreXOwnerName = keccak256(abi.encode("ATom"));
    uint256 private organizationsCounter;
    uint256 private VotreXUserCounter;
    uint256 private OrganizationPriceFee = 20 ether;
    
    mapping(string  => Organization) public organizationData;
    mapping(address => ElectionAdmins) public admin;
    mapping(address => Voter) public voters;
    mapping(bytes32 => ElectionDetail) public electionInfo;
    mapping(string  => ElectionResult) public electionResults;
    mapping(bytes32 => ActiveElectionList) private activeElection;
    mapping(bytes32 => bool) private electionExistanceChecks;
    mapping(bytes16 => bool) private votersIDExists;
    mapping(address => bool) private registeredAdmin;

    enum ElectionStatus {
        Preparation,
        Scheduled,
        Started,
        Finished
    }

    enum OrganizationType {
        Organization,
        Corporate
    }

    struct Organization {
        OrganizationType orgType;
        address electionAdminAddresses;
        uint256 electionEventCounter;
        uint256 totalMembers;
        bytes32 orgName;
        string orgID;
    }

    struct ElectionAdmins {
        bool isRegistered;
        uint8 adminOrgCount;
        bytes10 AdminVoterIDOrg1;
        bytes10 AdminVoterIDOrg2;
        address electionAdminAddress;
        uint256 nextOrgCreationBlock;
        bytes32 adminName;
        string RegisteredOrgID1;
        string RegisteredOrgID2;
    }

    struct ActiveElectionList{
        bytes32 orgID;
        bytes32 activeElectionID;
    }

    struct ElectionResult {
        bool isPruned;
        address adminAddress;
        uint startTime; 
        uint endTime;
        uint totalVoter;
        bytes32 electionName;
        bytes32 digitalSignature;
        string registeredOrganization;
        string electionWinner;
        string signedBy;
    }
    
    struct Voter{
        bool isRegistered;
        address VoterAddress;
        bytes16 VoterIDOrg1;
        bytes16 VoterIDOrg2;
        string VoterName;
        string RegisteredOrgID1;
        string RegisteredOrgID2;
        string[] participatedElectionEvents;
    }

    struct ElectionDetail{
        ElectionStatus status;
        uint8 candidateList;
        bool isFinished;
        bytes32 electionID;
        bytes32 electionName;
        uint startTime;
        uint endTime;
        string orgID;
        CandidateDetail[] candidates;
    }

    struct CandidateDetail{
        uint8 candidateID;
        uint256 candidateVoteCount;
        string candidateName;
    }

    modifier onlyOrgAdmin(string memory _IDParameters) {
        bool isAdminRegisteredForOrg = false;
        if (
            keccak256(abi.encodePacked(admin[msg.sender].RegisteredOrgID1))
            ==
            keccak256(abi.encodePacked(_IDParameters))
            ||
            keccak256(abi.encodePacked(admin[msg.sender].RegisteredOrgID2))
            ==
            keccak256(abi.encodePacked(_IDParameters))
        ) {
            isAdminRegisteredForOrg = true;
        } else if (
            bytes32(abi.encodePacked(admin[msg.sender].RegisteredOrgID1))
            !=
            bytes32(abi.encodePacked(_IDParameters))
            ||
            bytes32(abi.encodePacked(admin[msg.sender].RegisteredOrgID2))
            !=
            bytes32(abi.encodePacked(_IDParameters))
        ) {
            string memory orgID = UtilityLibrary.extractOrgId(_IDParameters);
            isAdminRegisteredForOrg = true;

        }

        require(
            isAdminRegisteredForOrg,
            "Admin not in this organization"
        );
        _;
    }

    modifier onlyAuthorizedMember(string memory _userElectionID) {
        string memory orgID = UtilityLibrary.extractOrgId(_userElectionID);

        bool isAdminRegisteredForOrg = (
            keccak256(abi.encodePacked(admin[msg.sender].RegisteredOrgID1))
            ==
            keccak256(abi.encodePacked(orgID))
        )||(
            keccak256(abi.encodePacked(admin[msg.sender].RegisteredOrgID2))
            ==
            keccak256(abi.encodePacked(orgID))
        );

        bool isVoterRegisteredForOrg = (
            keccak256(abi.encodePacked(voters[msg.sender].RegisteredOrgID1))
            ==
            keccak256(abi.encodePacked(orgID))
        )||(
            keccak256(abi.encodePacked(voters[msg.sender].RegisteredOrgID2))
            ==
            keccak256(abi.encodePacked(orgID))
        );

        require(
            isAdminRegisteredForOrg || isVoterRegisteredForOrg,
            "You are not an authorized member"
        );
        _;
    }

    modifier canCreateOrg() {
        require(
            block.number >= admin[msg.sender].nextOrgCreationBlock,
            "Wait for the next block to create a new org"
        );
        _;
    }

    modifier onlyVotreXOwner() {
        require(
            msg.sender == VotreXOwnerAddress,
            "Not the contract owner"
        );
        _;
    }

    modifier onlyWhenActivated() {
        require(
            VotreXActivated == true,
            "System is not activated"
        );
        _;
    }

    // event Received(address UserAddress, uint256 FLRSent);

    function buyContract(string memory _YourName) public payable {
        require(VotreXActivated == false);
        require(msg.value == 12 ether, "Please send 12 Ether");

        previousVotreXOwnerAddress = VotreXOwnerAddress;
        VotreXOwnerAddress = address(0);
        VotreXOwnerName = keccak256(abi.encodePacked(_YourName));

        payable(previousVotreXOwnerAddress).transfer(msg.value);

        previousVotreXOwnerAddress = address(0);
        VotreXOwnerAddress = msg.sender;
    }

    function CheckTokenBalance () external view onlyVotreXOwner returns (uint256) {
        return TxInterface.checkBalance(address(this));
    }

    function CheckTokenETHBalance () external view onlyVotreXOwner returns (uint256) {
        return (address(this).balance);
    }

    function changeSystemState() external onlyVotreXOwner{
        if (VotreXActivated == false) {
            require(VotreXActivated == false, "Activated!");
            VotreXActivated = true;
        } else if (VotreXActivated == true) {
            require(VotreXActivated == true, "Paused!");
            VotreXActivated = false;
        }
    }

    function setOrgPriceFee(uint256 _PriceinEther) external onlyVotreXOwner {
        OrganizationPriceFee = _PriceinEther * 1 ether;
    }

    receive() external payable {
        // emit Received(msg.sender, msg.value);
    }

    function registerOrganization(
        string memory _orgName,
        string memory _orgID,
        string memory _adminName,
        OrganizationType _orgType
    )
        external
        payable
        canCreateOrg
        onlyWhenActivated
    {
        uint8 VXTAmount = 5;
        ElectionAdmins storage AdminInfo = admin[msg.sender];

        require(
            msg.value == OrganizationPriceFee,
            "Please send correct amount"
        );

        require(
            organizationsCounter < 32000,
            "Maximum Organization reached"
        );

        require(
            bytes32(organizationData[_orgID].orgName).length > 0,
            "Organization name is registered"
        );

        require(
            organizationData[_orgID].electionAdminAddresses == address(0),
            "Organization ID is registered"
        );

        require(
            UtilityLibrary.onlyAlphanumericCharacters(_orgID),
            "Org ID should be alphanumeric"
        );

        require(
            bytes(_orgName).length > 0,
            "Please fill Organization Name"
        );

        require(
            bytes(_orgName).length < 32,
            "Org name can't exceed 32"
        );

        require(
            bytes(_adminName).length > 1,
            "Admin name can't be empty"
        );

        require(
            bytes(_orgID).length == 3 || bytes(_orgID).length == 4,
            "Org ID should 3 or 4 characters"
        );

        require(
            !UtilityLibrary.containsWhitespaceCheck(_orgID),
            "spaces in Org ID not allowed"
        );

        require(
            keccak256(abi.encodePacked(admin[msg.sender].RegisteredOrgID1))
            !=
            keccak256(abi.encodePacked(_orgID))
            &&
            keccak256(abi.encodePacked(admin[msg.sender].RegisteredOrgID2))
            !=
            keccak256(abi.encodePacked(_orgID)),
            "Admin is registered in organization"
        );

        Organization storage newOrg = organizationData[_orgID];
        newOrg.orgID = _orgID;
        newOrg.orgName = bytes32(abi.encodePacked(_orgName));
        newOrg.orgType = _orgType;
        newOrg.electionAdminAddresses = msg.sender;
        newOrg.electionEventCounter = 0;
        newOrg.totalMembers = 1;

        bytes10 UniqueAdminvoterID = bytes10(abi.encodePacked(_orgID, "-", "Admin"));

        if (bytes(admin[msg.sender].RegisteredOrgID1).length == 0) {
            admin[msg.sender].RegisteredOrgID1 = _orgID;
            admin[msg.sender].AdminVoterIDOrg1 = UniqueAdminvoterID;
        } else if (bytes(admin[msg.sender].RegisteredOrgID2).length == 0) {
            admin[msg.sender].RegisteredOrgID2 = _orgID;
            admin[msg.sender].AdminVoterIDOrg2 = UniqueAdminvoterID;
        }

        AdminInfo.electionAdminAddress = msg.sender;
        AdminInfo.adminName = bytes32(abi.encodePacked(_adminName));
        AdminInfo.isRegistered = true;
        ++AdminInfo.adminOrgCount;

        registeredAdmin[msg.sender] = true;
        votersIDExists[UniqueAdminvoterID] = true;

        AdminInfo.nextOrgCreationBlock = 50 + block.number;

        ++organizationsCounter;
        ++VotreXUserCounter;

        TxInterface.VotreXTx(msg.sender, VXTAmount);
    }

    

    function registerVoter(
        string memory _voterName,
        string memory _orgID
    )
        external
        payable
        onlyWhenActivated
    {
        require(
            msg.value == (OrganizationPriceFee/2)
        );

        Voter storage voter = voters[msg.sender];
        uint8 VXTAmount = 5;
        string memory uniqueVoterID = generateUniqueVoterID(_orgID);
        bytes16 VoterID16 = bytes16(abi.encodePacked(uniqueVoterID));
        bytes32 orgIDs = keccak256(abi.encodePacked(_orgID));

        require(
            organizationData[_orgID].totalMembers < 5000,
            "Maximum member limit reached"
        );

        require(
            bytes(_voterName).length > 1,
            "Please fill Voter Name"
        );

        require(
            bytes(_voterName).length < 24,
            "Voter name over than 24 characters"
        );

        require(
            keccak256(abi.encodePacked(voters[msg.sender].RegisteredOrgID1))
            !=
            keccak256(abi.encodePacked(_orgID))
            &&
            keccak256(abi.encodePacked(voters[msg.sender].RegisteredOrgID2))
            !=
            keccak256(abi.encodePacked(_orgID))
            &&
            !registeredAdmin[msg.sender],
            "Voter is registered in Org"
        );

        require(
            !ElectionActiveCheck(orgIDs),
            "Election in progress!"
        );

        require(
            bytes(uniqueVoterID).length > 0,
            "Failed to generate unique Voter ID"
        );

        if (bytes(voter.RegisteredOrgID1).length == 0) {
            voter.RegisteredOrgID1 = _orgID;
            voter.VoterIDOrg1 = VoterID16;
        } else if (bytes(voter.RegisteredOrgID2).length == 0) {
            voter.RegisteredOrgID2 = _orgID;
            voter.VoterIDOrg2 = VoterID16;
        }

        voter.VoterAddress = msg.sender;
        voter.VoterName = _voterName;
        voter.participatedElectionEvents = new string[](0);
        voter.isRegistered = true;
        votersIDExists[VoterID16] = true;
        ++VotreXUserCounter;

        TxInterface.VotreXTx(msg.sender, VXTAmount);
    }

    function createElection(
        string memory _orgID,
        string memory _userElectionID,
        string memory _electionName,
        uint8 _candidateCount
    )
        external
        onlyWhenActivated
        onlyOrgAdmin(_orgID)
    {
        require(
            bytes(organizationData[_orgID].orgID).length > 0,
            "Org ID not found"
        );

        require(
            bytes(_userElectionID).length > 1,
            "ID can't be empty"
        
        );

        require(
            bytes(_userElectionID).length < 5,
            "ID should < 5 characters"
        );

        require(
            bytes(_electionName).length > 1,
            "Please fill name"
        );

        require(
            bytes(_electionName).length < 25,
            "Election name should < 25"
        );

        require(
            organizationData[_orgID].electionEventCounter < 10,
            "Maximum events reached"
        );

        require(_candidateCount > 1, "Minimum 2 candidates!");

        bytes32 generatedElectionID = bytes32(abi.encodePacked(_orgID, "-", _userElectionID));
        ElectionDetail storage newElection = electionInfo[generatedElectionID];

        require(
            !electionExistanceChecks[generatedElectionID],
            "Election ID exists"
        );

        newElection.orgID = _orgID;
        newElection.electionID = generatedElectionID;
        newElection.electionName = bytes32(abi.encodePacked(_electionName));
        newElection.candidateList = _candidateCount;
        newElection.status = ElectionStatus.Preparation;
        electionExistanceChecks[generatedElectionID] = true;
        ++organizationData[_orgID].electionEventCounter;
    }

    function startElection(string memory _userElectionID) external onlyOrgAdmin(_userElectionID){
        require(bytes(_userElectionID).length > 0, "Election ID can't be empty");

        bytes32 userElectionID = bytes32(abi.encodePacked(_userElectionID));
        bytes32 orgIDs = keccak256(abi.encodePacked(UtilityLibrary.extractOrgId(_userElectionID)));

        ElectionDetail storage election = electionInfo[userElectionID];
        require(bytes16(election.electionID).length > 0, "Election ID does not exist");
        require(election.status == ElectionStatus.Preparation, "Election is not in preparation");
        require(election.candidateList == election.candidates.length, "Candidate Not full");

        election.startTime = 5 + block.timestamp;
        election.status = ElectionStatus.Started;
        activeElection[orgIDs].orgID = orgIDs;
        activeElection[orgIDs].activeElectionID = userElectionID;
    }

    function finishElection(string memory _userElectionID)
        external
        onlyOrgAdmin(_userElectionID)
    {
        bytes32 userElectionID = bytes32(abi.encodePacked(_userElectionID));
        ElectionDetail storage elections = electionInfo[userElectionID];
        string memory orgName = string(abi.encodePacked(organizationData[elections.orgID].orgName));
        bytes32 orgIDs = keccak256(abi.encodePacked(UtilityLibrary.extractOrgId(_userElectionID)));
        string memory adminName = getAdminName(msg.sender);
        string memory electionName = string(abi.encodePacked(elections.electionName));
        string memory electionWinner = determineWinner(_userElectionID);
        uint256 totalVoter = calculateTotalVoter(_userElectionID);
        bytes32 dataHash = bytes32(keccak256(abi.encodePacked(orgName, electionName, adminName)));

        require(
            bytes(_userElectionID).length > 0,
            "Invalid election ID"
        );

        require(
            bytes(_userElectionID).length > 0,
            "Election ID can't be empty"
        );

        require(
            bytes32(electionInfo[userElectionID].electionID).length > 0,
            "Election ID does not exist"
        );

        require(!elections.isFinished, "Election finished");

        require(
            elections.status == ElectionStatus.Started,
            "Election is not started"
        );

        require(
            totalVoter >= calculateValidElection(_userElectionID),
            "need 50% total member to finish"
        );

        elections.endTime = 5+block.timestamp;
        elections.status = ElectionStatus.Finished;
        elections.isFinished = true;

        ElectionResult storage newelectionResult = electionResults[_userElectionID];
        newelectionResult.isPruned = true;
        newelectionResult.totalVoter = totalVoter;
        newelectionResult.adminAddress = msg.sender;
        newelectionResult.startTime = elections.startTime;
        newelectionResult.endTime = elections.endTime;
        newelectionResult.digitalSignature = dataHash;
        newelectionResult.registeredOrganization = elections.orgID;
        newelectionResult.electionName = elections.electionName;
        newelectionResult.electionWinner = electionWinner;
        newelectionResult.signedBy = adminName;
        removeFromActiveElections(orgIDs);

        delete electionInfo[userElectionID];
    }

    function calculateValidElection(string memory _userElectionID)
        private
        view
        returns (uint256)
    {
        string memory orgID = UtilityLibrary.extractOrgId(_userElectionID);
        Organization storage OrgData = organizationData[orgID];
        uint256 MIN_VOTES_PERCENTAGE = 1 + (OrgData.totalMembers / 2);

        return MIN_VOTES_PERCENTAGE;
    }

    function getOwnerAddress() external view returns (address) {
        return VotreXOwnerAddress;
    }

    function getOwnerName() external view returns (bytes32) {
        return VotreXOwnerName;
    }

    // function getTotalOrg()external view returns (uint256) {
    //     return organizationsCounter;
    // }

    function getTotalUser() external view returns (uint256) {
        return VotreXUserCounter;
    }

    function getAdminName(address adminAddress) private view returns (string memory) {
        return string(abi.encodePacked(admin[adminAddress].adminName));
    }

    function addCandidateDetail(
        string memory _userElectionID,
        string memory _candidateName
    )
        external
        onlyOrgAdmin(_userElectionID)
    {
        bytes32 userElectionID = bytes32(abi.encodePacked(_userElectionID));
        ElectionDetail storage election = electionInfo[userElectionID];

        require(bytes(_userElectionID).length > 0);

        require(
            bytes32(electionInfo[userElectionID].electionID).length > 0,
            "Election ID does not exist"
        );

        require(
            election.candidates.length < election.candidateList,
            "Candidate limit reached"
        );

        require(bytes(_candidateName).length > 0);

        require(
            bytes(_candidateName).length <= 24,
            "name limits 24 characters"
        );

        require(
            UtilityLibrary.onlyAlphanumericCharacters(_candidateName),
            "Candidate name can only contain alphabetical"
        );

        uint8 candidateID = uint8(election.candidates.length);

        election.candidates.push(
            CandidateDetail({
                candidateID: candidateID,
                candidateName: _candidateName,
                candidateVoteCount: 0
            })
        );
    }

    function vote(
        string memory _userElectionID,
        uint8 candidateID, uint256 VotesAmount
    )
        external
        onlyWhenActivated
        onlyAuthorizedMember(_userElectionID)
    {
        bytes32 userElectionID = bytes32(abi.encodePacked(_userElectionID));
        ElectionDetail storage election = electionInfo[userElectionID];
        Voter storage voter = voters[msg.sender];
        bytes32 electionName = election.electionName;
        require(VotesAmount <= 5);
        require(bytes(_userElectionID).length > 0, "Election ID can't be empty");
        require(candidateID < election.candidates.length, "Invalid candidate ID");
        require(election.status == ElectionStatus.Started, "Election is not in progress");
        require(!hasParticipatedInElection(msg.sender, electionName), "You already voted in this election");

        ++election.candidates[candidateID].candidateVoteCount;
        election.candidates[candidateID].candidateVoteCount += VotesAmount;
        voter.participatedElectionEvents = UtilityLibrary.appendToStringArray(
            voter.participatedElectionEvents,
            string(abi.encodePacked(election.electionName))
        );
        TxInterface.VoteTx(msg.sender, VotesAmount);
    }


    function withdrawFees() external onlyVotreXOwner{
        require(address(this).balance > 0, "No FLR Balance in Contract");
        payable(VotreXOwnerAddress).transfer(address(this).balance);
    }

    function isVotreXActivated() external onlyVotreXOwner view returns (bool) {
        return VotreXActivated;
    }

    function getRegistrationFee() external view returns (uint256){
        return OrganizationPriceFee;
    }

    // function getTotalOrganization() external virtual view returns (uint256) {
    //     return organizationsCounter;
    // }

    function getCandidateDetail(
        string memory _userElectionID,
        string memory _candidateName
    )
        external
        view
        returns(
            bool success,
            string memory candidateName,
            uint8 candidateID,
            uint256 voteCount
        )
    {
        require(
            bytes(_userElectionID).length > 0,
            "Election ID can't be empty"
        );

        bytes32 userElectionID = bytes32(abi.encodePacked(_userElectionID));
        ElectionDetail storage election = electionInfo[userElectionID];

        for (uint32 i = 0; i < election.candidates.length; ++i) {
            if (
                keccak256(abi.encodePacked(election.candidates[i].candidateName))
                ==
                keccak256(abi.encodePacked(_candidateName))
            ) {
                return (
                    true,
                    election.candidates[i].candidateName,
                    election.candidates[i].candidateID,
                    election.candidates[i].candidateVoteCount
                );
            }
        }

        return (false,'', 0, 0);

    }

    function getelectionInfo(string memory _userElectionID)
        external
        view
        returns(
            bytes32 electionID,
            string memory electionName,
            uint256 totalCandidates,
            string[] memory candidateNames,
            uint[] memory voteCounts
        )
    {
        bytes32 userElectionID = bytes32(abi.encodePacked(_userElectionID));

        ElectionDetail storage election = electionInfo[userElectionID];
        require(
            bytes32(election.electionID).length > 0,
            "Election ID does not exist"
        );

        electionID = election.electionID;
        electionName = string(abi.encodePacked (election.electionName));
        totalCandidates = election.candidates.length;
        candidateNames = new string[](totalCandidates);
        voteCounts = new uint[](totalCandidates);

        for (uint256 i = 0; i < totalCandidates; ++i) {
            candidateNames[i] = election.candidates[i].candidateName;
            voteCounts[i] = election.candidates[i].candidateVoteCount;
        }

        return (
            electionID,
            electionName,
            totalCandidates,
            candidateNames, voteCounts
        );
    }

    function getCurrentVoteResult(string memory _userElectionID)
        external
        view
        returns (
            CandidateDetail[] memory
        )
    {
        bytes32 userElectionID = bytes32(abi.encodePacked(_userElectionID));
        ElectionDetail storage election = electionInfo[userElectionID];

        require(bytes(_userElectionID).length > 0, "Election ID can't be empty");

        require(election.status == ElectionStatus.Started, "Election is not in progress");

        return election.candidates;
    }

    function getUserInfo() external view returns (
        bool isRegistered,
        bool isAdmin,
        address userAddress,
        string memory userName,
        string[] memory registeredOrgList,
        string[] memory voterIDList,
        string[] memory participatedElectionEvents
    ) {
        userAddress = msg.sender;

        if (admin[userAddress].isRegistered) {
            ElectionAdmins storage adminInfo = admin[userAddress];
            
            string[] memory VoterRegisteredOrgList = new string[](2);
            VoterRegisteredOrgList[0] = adminInfo.RegisteredOrgID1;
            VoterRegisteredOrgList[1] = adminInfo.RegisteredOrgID2;

            string[] memory VoterIDList = new string[](2);
            VoterIDList[0] = string(abi.encodePacked(adminInfo.AdminVoterIDOrg1));
            VoterIDList[1] = string(abi.encodePacked(adminInfo.AdminVoterIDOrg2));

            return (
                true,
                true,
                userAddress,
                string(abi.encodePacked(adminInfo.adminName)),
                VoterRegisteredOrgList,
                VoterIDList,
                new string[](0)
            );

        } else if (voters[userAddress].isRegistered) {
            Voter storage voter = voters[userAddress];

            string[] memory RegisteredOrgIDList = new string[](2);
            RegisteredOrgIDList[0] = voter.RegisteredOrgID1;
            RegisteredOrgIDList[1] = voter.RegisteredOrgID2;

            string[] memory RegisteredVoterIDList = new string[](2);
            RegisteredVoterIDList[0] = string(abi.encodePacked(voter.VoterIDOrg1));
            RegisteredVoterIDList[1] = string(abi.encodePacked(voter.VoterIDOrg2));
            return (
                true,
                false,
                userAddress,
                voter.VoterName,
                RegisteredOrgIDList,
                RegisteredVoterIDList,
                voter.participatedElectionEvents
            );
        } else {
            return (
                false,
                false,
                userAddress,
                "",
                new string[](0),
                new string[](0),
                new string[](0)
            );
        }
    }

    function ElectionActiveCheck(bytes32 _orgID) private view returns (bool) {

        return activeElection[_orgID].activeElectionID != 0;

    }

    function removeFromActiveElections(bytes32 _orgID) private {
        delete activeElection[_orgID];
    }

    function hasParticipatedInElection(
        address voterAddress,
        bytes32 electionName
    )
        private
        view
        returns (bool)
    {
        Voter storage voter = voters[voterAddress];
        for (uint i = 0; i < voter.participatedElectionEvents.length; ++i) {
            if (
                keccak256(abi.encodePacked(voter.participatedElectionEvents[i]))
                ==
                keccak256(abi.encodePacked(electionName))
            ) {
                return true; 
            }
        }

        return false; 
    }

    function calculateTotalVoter(string memory _userElectionID) private view returns (uint256) {
        bytes8 userElectionID = bytes8(abi.encodePacked(_userElectionID));
        ElectionDetail storage election = electionInfo[userElectionID];
        uint256 totalVoter = 0;

        for (uint8 i = 0; i < election.candidates.length; ++i) {
            totalVoter += election.candidates[i].candidateVoteCount;
        }

        return totalVoter;
    }

    function determineWinner(string memory _userElectionID) private view returns (string memory) {
        bytes32 userElectionID = bytes32(abi.encodePacked(_userElectionID));
        ElectionDetail storage election = electionInfo[userElectionID];
        string memory winner = "";
        uint256 maxVotes = 0;
        for (uint8 i = 0; i < election.candidates.length; ++i) {
            if (election.candidates[i].candidateVoteCount > maxVotes) {
                maxVotes = election.candidates[i].candidateVoteCount;
                winner = election.candidates[i].candidateName;
            }
        }

        return winner;
    }
    
    function generateUniqueVoterID(string memory _orgID) public view returns (string memory) {
        uint256 CurrentID = organizationData[_orgID].totalMembers;
        uint256 nextID = ++CurrentID;

        return string(abi.encodePacked(_orgID, "-", UtilityLibrary.uint2str(nextID)));
    }

    function getOrgIDHash(string memory _orgID) external pure returns (bytes32) {
        bytes32 orgIDHash = keccak256(abi.encodePacked(_orgID));

        return (orgIDHash);
    }
}
