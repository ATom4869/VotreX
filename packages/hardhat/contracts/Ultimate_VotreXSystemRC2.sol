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
    bytes32 public VotreXOwnerName = keccak256(abi.encodePacked("ATom"));
    uint256 private organizationsCounter;
    uint256 private VotreXUserCounter;
    uint256 private OrganizationPriceFee = 20 ether;
    
    mapping(string  => Organization) public organizationData;
    mapping(address => ElectionAdmins) public admin;
    mapping(address => Voter) public voters;
    mapping(bytes32 => ElectionDetail) public electionInfo;
    mapping(string  => ElectionResult) public electionResults;
    mapping(string  => ElectionStatus) public activeElection;
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
        uint256 onPreparationElectionCounter;
        uint256 activeElectionCounter;
        uint256 archivedElectionCounter;
        uint256 totalMembers;
        bytes32 orgName;
        string orgID;
        bytes32[] electionIDs;
        bytes32[] ElectionName;
        ElectionStatus[] electionStatus;
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

    struct ElectionResult {
        bool isPruned;
        address adminAddress;
        uint startTime; 
        uint endTime;
        uint totalVoter;
        bytes32 electionID;
        bytes32 electionName;
        bytes32 digitalSignature;
        string registeredOrganization;
        string electionWinner;
        string signedBy;
        CandidateDetail[] candidates;
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
        uint256 totalParticipants;
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
            "error:31a"
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
            // error 31a = Incorrect access control
            "error:31a"
        );
        _;
    }

    modifier canCreateOrg() {
        require(
            block.number >= admin[msg.sender].nextOrgCreationBlock,
            // error 32 = error Block await for 2nd Admin Org Registration
            "error:32"
        );
        _;
    }

    modifier onlyVotreXOwner() {
        require(
            msg.sender == VotreXOwnerAddress,
            // error 31b = errror Owner access
            "error:31b"
        );
        _;
    }

    modifier onlyWhenActivated() {
        require(
            VotreXActivated == true,
            // error 33 = error system still disabled
            "error:33"
        );
        _;
    }

    // event Received(address UserAddress, uint256 FLRSent);

    function buyContract(string memory _YourName) public payable {
        require(VotreXActivated == false);
        // error 34 = error wrong ether value being sent
        require(msg.value == 12 ether, "error:34");

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
            VotreXActivated = true;
        } else if (VotreXActivated == true) {
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
            // error 34 = error wrong ether value being sent
            "error:34"
        );

        require(
            organizationsCounter < 32000,
            // error 35 = error limit reached
            "error:35"
        );

        require(
            bytes32(organizationData[_orgID].orgName).length > 0,
            // error 36a = error incorrect null value
            "error:36a"
        );

        require(
            organizationData[_orgID].electionAdminAddresses == address(0),
            // error 36a = error incorrect null value
            "error:36a"
        );

        require(
            UtilityLibrary.onlyAlphanumericCharacters(_orgID),
            // error36b = Only Alpha Numeric character allowed
            "error:36b"
        );

        require(
            bytes(_orgName).length > 0,
            // error 36a = error incorrect null value
            "error:36a"
        );

        require(
            bytes(_orgName).length < 32,
            // error 36c = error character length limit

            "error:36c"
        );

        require(
            bytes(_adminName).length > 1
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
            "Admin is registered"
        );

        Organization storage newOrg = organizationData[_orgID];
        newOrg.orgID = _orgID;
        newOrg.orgName = bytes32(abi.encodePacked(_orgName));
        newOrg.orgType = _orgType;
        newOrg.electionAdminAddresses = msg.sender;
        newOrg.activeElectionCounter = 0;
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
        string memory _orgID,
        bytes32 uniqueVoterID
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
        // string memory uniqueVoterID = generateUniqueVoterID(_orgID);
        bytes16 VoterID16 = bytes16(abi.encodePacked(uniqueVoterID));
        // bytes32 orgIDs = keccak256(abi.encodePacked(_orgID));

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
            "Voter name limit is 24 characters"
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
            !ElectionActiveCheck(_orgID),
            "Election in progress!"
        );

        require(
            bytes16(uniqueVoterID).length > 0
        );

        require(
            bytes(organizationData[_orgID].orgID).length != 0,
            "Organization does not exist"
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
        ++organizationData[_orgID].totalMembers;

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
            bytes(organizationData[_orgID].orgID).length > 0
        );

        require(
            bytes(_userElectionID).length > 1,
            // error 36a = error incorrect null value
            "error 36a"
        
        );

        require(
            bytes(_userElectionID).length < 5,
            "ID should < 5 characters"
        );

        require(
            bytes(_electionName).length > 1
        );

        require(
            bytes(_electionName).length < 25,
            "Election name should < 25"
        );

        require(
            organizationData[_orgID].activeElectionCounter < 10,
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
        organizationData[_orgID].electionIDs.push(generatedElectionID);
        organizationData[_orgID].ElectionName.push(bytes32(abi.encodePacked(_electionName)));
        organizationData[_orgID].electionStatus.push(ElectionStatus.Preparation);
        ++organizationData[_orgID].onPreparationElectionCounter;
    }

    function startElection(string memory _userElectionID) external onlyOrgAdmin(_userElectionID){
        // error 36a = error incorrect null value
        require(bytes(_userElectionID).length > 0, "error:36a");

        bytes32 userElectionID = bytes32(abi.encodePacked(_userElectionID));
        string memory orgIDs = UtilityLibrary.extractOrgId(_userElectionID);

        ElectionDetail storage election = electionInfo[userElectionID];
        require(bytes16(election.electionID).length > 0, "Invalid election ID");
        require(election.status == ElectionStatus.Preparation, "Election is not in preparation");
        require(election.candidateList == election.candidates.length, "Candidate Not full");

        election.startTime = 5 + block.timestamp;
        election.status = ElectionStatus.Started;
        ++organizationData[orgIDs].activeElectionCounter;
        --organizationData[orgIDs].onPreparationElectionCounter;
        uint256 index = findElectionIndex(organizationData[orgIDs].electionIDs, userElectionID);
        require(index < organizationData[orgIDs].electionIDs.length, "Election not found");
        organizationData[orgIDs].electionStatus[index] = ElectionStatus.Started; // or whichever status you're setting
    }

    function findElectionIndex(bytes32[] storage array, bytes32 electionID) internal view returns (uint256) {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == electionID) {
                return i;
            }
        }
        revert("Election ID not found");
    }

    function finishElection(string memory _userElectionID)
        external
        onlyOrgAdmin(_userElectionID)
    {
        bytes32 packedElectionID = bytes32(abi.encodePacked(_userElectionID));
        ElectionDetail storage elections = electionInfo[packedElectionID];
        string memory orgName = string(abi.encodePacked(organizationData[elections.orgID].orgName));
        string memory orgIDs = UtilityLibrary.extractOrgId(_userElectionID);
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
            bytes32(electionInfo[packedElectionID].electionID).length > 0,
            "error:36a"
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

        elections.endTime = 5 + block.timestamp;
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
        newelectionResult.electionID = packedElectionID;
        newelectionResult.electionName = elections.electionName;
        newelectionResult.electionWinner = electionWinner;
        newelectionResult.signedBy = adminName;

        for (uint i = 0; i < elections.candidates.length; i++) {
            CandidateDetail memory candidate = elections.candidates[i];
            newelectionResult.candidates.push(
                CandidateDetail({
                    candidateID: candidate.candidateID,
                    candidateName: candidate.candidateName,
                    candidateVoteCount: candidate.candidateVoteCount
                })
            );
        }

        removeFromActiveElections(orgIDs);

        delete electionInfo[packedElectionID];
        uint256 index = findElectionIndex(organizationData[orgIDs].electionIDs, packedElectionID);
        organizationData[orgIDs].electionStatus[index] = ElectionStatus.Finished;
        ++organizationData[UtilityLibrary.extractOrgId(_userElectionID)].archivedElectionCounter;
        --organizationData[orgIDs].activeElectionCounter;
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

    function getElectionListInOrg(string memory orgID)
        public
        view
        returns (bytes32[] memory, bytes32[] memory, ElectionStatus[] memory)
    {
        Organization storage org = organizationData[orgID];
        return (org.electionIDs, org.ElectionName, org.electionStatus);
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
            // error 36a = error incorrect null value
            "error:36a"
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
        uint8 candidateID,
        uint256 VotesAmount
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

        // ++election.candidates[candidateID].candidateVoteCount;
        election.candidates[candidateID].candidateVoteCount += VotesAmount;
        voter.participatedElectionEvents = UtilityLibrary.appendToStringArray(
            voter.participatedElectionEvents,
            string(abi.encodePacked(election.electionName))
        );
        ++election.totalParticipants;
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

    // function getCandidateDetail(
    //     string memory _userElectionID,
    //     string memory _candidateName
    // )
    //     external
    //     view
    //     returns(
    //         string memory candidateName,
    //         uint8 candidateID,
    //         uint256 voteCount
    //     )
    // {
    //     require(
    //         bytes(_userElectionID).length > 0,
    //         "Election ID can't be empty"
    //     );

    //     bytes32 userElectionID = bytes32(abi.encodePacked(_userElectionID));
    //     ElectionDetail storage election = electionInfo[userElectionID];

    //     for (uint32 i = 0; i < election.candidates.length; ++i) {
    //         if (
    //             keccak256(abi.encodePacked(election.candidates[i].candidateName))
    //             ==
    //             keccak256(abi.encodePacked(_candidateName))
    //         ) {
    //             return (
    //                 election.candidates[i].candidateName,
    //                 election.candidates[i].candidateID,
    //                 election.candidates[i].candidateVoteCount
    //             );
    //         }
    //     }

    //     return ('', 0, 0);

    // }

    function getelectionInfo(string memory _userElectionID)
        external
        view
        returns(
            bytes32 electionID,
            string memory electionName,
            uint256 totalCandidates,
            uint8[] memory candidateIDs, // Added
            string[] memory candidateNames,
            uint256[] memory voteCounts,
            ElectionStatus statusElection
        )
    {
        bytes32 userElectionID = bytes32(abi.encodePacked(_userElectionID));

        ElectionDetail storage election = electionInfo[userElectionID];
        require(
            bytes32(election.electionID).length > 0
        );

        electionID = election.electionID;
        electionName = string(abi.encodePacked(election.electionName));
        totalCandidates = election.candidates.length;
        candidateIDs = new uint8[](totalCandidates); // Initialized
        candidateNames = new string[](totalCandidates);
        voteCounts = new uint256[](totalCandidates);
        statusElection = electionInfo[userElectionID].status;

        for (uint256 i = 0; i < totalCandidates; ++i) {
            candidateIDs[i] = election.candidates[i].candidateID; // Added
            candidateNames[i] = election.candidates[i].candidateName;
            voteCounts[i] = election.candidates[i].candidateVoteCount;
        }

        return (
            electionID,
            electionName,
            totalCandidates,
            candidateIDs,
            candidateNames,
            voteCounts,
            statusElection
        );
    }

    function getCandidateResult(string memory _electionID) 
        public 
        view 
        returns (
            uint8[] memory candidateID,
            string[] memory candidateName,
            uint256[] memory candidateVoteCount
        ) 
    {

        uint totalCandidates = electionResults[_electionID].candidates.length;

        uint8[] memory candidateIDs = new uint8[](totalCandidates);
        string[] memory candidateNames = new string[](totalCandidates);
        uint256[] memory candidateVoteCounts = new uint256[](totalCandidates);

        for (uint i = 0; i < totalCandidates; i++) {
            candidateIDs[i] = electionResults[_electionID].candidates[i].candidateID;
            candidateNames[i] = electionResults[_electionID].candidates[i].candidateName;
            candidateVoteCounts[i] = electionResults[_electionID].candidates[i].candidateVoteCount;
        }

        return (
            candidateIDs,
            candidateNames,
            candidateVoteCounts
        );
    }


    // function getCurrentVoteResult(string memory _userElectionID)
    //     external
    //     view
    //     returns (
    //         CandidateDetail[] memory
    //     )
    // {
    //     bytes32 userElectionID = bytes32(abi.encodePacked(_userElectionID));
    //     ElectionDetail storage election = electionInfo[userElectionID];

    //     require(bytes(_userElectionID).length > 0);

    //     require(election.status == ElectionStatus.Started, "Election is not in progress");

    //     return election.candidates;
    // }

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

    function ElectionActiveCheck(string memory _orgID) private view returns (bool) {

        return activeElection[_orgID] == ElectionStatus.Started;

    }

    function removeFromActiveElections(string memory _orgID) private {
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
    
    // function generateUniqueVoterID(string memory _orgID) public view returns (string memory) {
    //     uint256 CurrentID = organizationData[_orgID].totalMembers;
    //     uint256 nextID = ++CurrentID;

    //     return string(abi.encodePacked(_orgID, "-", UtilityLibrary.uint2str(nextID)));
    // }

    function getOrgIDHash(string memory _orgID) external pure returns (bytes32) {
        bytes32 orgIDHash = keccak256(abi.encodePacked(_orgID));

        return (orgIDHash);
    }
}
