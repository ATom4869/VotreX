// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./UtilityLibrary.sol";

contract VotreXSysA2 {
	using UtilityLibrary for *;

	constructor(uint256 _timeOffset) {
		VotreXOwnerAddress = msg.sender;
		VotreXActivated = true;
		Time_Offset = _timeOffset;
	}

	uint256 private organizationsCounter;
	bool private VotreXActivated;
	address private VotreXOwnerAddress;
	bytes32 public VotreXOwnerName =
		keccak256(abi.encodePacked("Arson Tomanta"));
	uint256 private VotreXUserCounter;
	uint256 private immutable Time_Offset;

	mapping(string => Organization) public organizationData;
	mapping(address => ElectionAdmins) public admin;
	mapping(address => Voter) public voters;
	mapping(bytes32 => address[]) private voterAddrList;
	mapping(bytes32 => string[]) private voterNameList;
	mapping(string => bytes32) private voterBirthDateByName;
	mapping(bytes32 => mapping(address => bool)) public hasVoted;
	mapping(bytes32 => mapping(string => CandidateDetail))
		public temporalCandidates;
	mapping(bytes32 => ElectionDetail) public electionInfo;
	mapping(string => ElectionResult) public electionResults;
	mapping(bytes32 => bool) private electionExistanceChecks;
	mapping(bytes16 => bool) private votersIDExists;
	mapping(address => bool) private registeredAdmin;

	enum ElectionStatus {
		Preparation,
		Started,
		HeadToHeadWave,
		Finished,
		Failed
	}

	enum OrganizationType {
		Organization,
		Churches,
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
		bytes32 userBirthDate;
		string RegisteredOrgID1;
		string RegisteredOrgID2;
	}

	struct ElectionResult {
		bool isPruned;
		address adminAddress;
		uint256 waveNumber;
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

	struct Voter {
		bool isRegistered;
		address VoterAddress;
		bytes16 VoterIDOrg1;
		bytes16 VoterIDOrg2;
		string VoterName;
		string RegisteredOrgID1;
		string RegisteredOrgID2;
		bytes32 userBirthDate;
	}

	struct ElectionDetail {
		ElectionStatus status;
		uint8 candidateList;
		bool isFinished;
		bool isHaveCandidateMode;
		bytes32 electionID;
		bytes32 electionName;
		uint startTime;
		uint endTime;
		string orgID;
		uint256 totalParticipants;
		uint256 waveNumber;
		CandidateDetail[] candidates;
		bool isTiedVoting;
	}

	struct CandidateDetail {
		uint8 candidateID;
		uint256 candidateVoteCount;
		string candidateName;
	}

	modifier onlyOrgAdmin(string memory _IDParameters) {
		bool isAdminRegisteredForOrg = false;
		if (
			keccak256(abi.encodePacked(admin[msg.sender].RegisteredOrgID1)) ==
			keccak256(abi.encodePacked(_IDParameters)) ||
			keccak256(abi.encodePacked(admin[msg.sender].RegisteredOrgID2)) ==
			keccak256(abi.encodePacked(_IDParameters))
		) {
			isAdminRegisteredForOrg = true;
		} else if (
			bytes32(abi.encodePacked(admin[msg.sender].RegisteredOrgID1)) !=
			bytes32(abi.encodePacked(_IDParameters)) ||
			bytes32(abi.encodePacked(admin[msg.sender].RegisteredOrgID2)) !=
			bytes32(abi.encodePacked(_IDParameters))
		) {
			string memory orgID = UtilityLibrary.extractOrgId(_IDParameters);
			isAdminRegisteredForOrg = true;
		}

		require(isAdminRegisteredForOrg, "error:31a");
		_;
	}

	modifier onlyAuthorizedMember(string memory _userElectionID) {
		string memory orgID = UtilityLibrary.extractOrgId(_userElectionID);

		bool isAdminRegisteredForOrg = (keccak256(
			abi.encodePacked(admin[msg.sender].RegisteredOrgID1)
		) == keccak256(abi.encodePacked(orgID))) ||
			(keccak256(abi.encodePacked(admin[msg.sender].RegisteredOrgID2)) ==
				keccak256(abi.encodePacked(orgID)));

		bool isVoterRegisteredForOrg = (keccak256(
			abi.encodePacked(voters[msg.sender].RegisteredOrgID1)
		) == keccak256(abi.encodePacked(orgID))) ||
			(keccak256(abi.encodePacked(voters[msg.sender].RegisteredOrgID2)) ==
				keccak256(abi.encodePacked(orgID)));

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

	function changeSystemState() external onlyVotreXOwner {
		if (VotreXActivated == false) {
			VotreXActivated = true;
		} else {
			VotreXActivated = false;
		}
	}

	function registerOrganization(
		string memory _orgName,
		string memory _orgID,
		string memory _adminName,
		bytes32 _userBirthDate,
		OrganizationType _orgType
	) external canCreateOrg onlyWhenActivated {
		ElectionAdmins storage AdminInfo = admin[msg.sender];
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

		require(bytes(_adminName).length > 1);

		require(
			bytes(_orgID).length == 3 ||
				bytes(_orgID).length == 4 ||
				bytes(_orgID).length == 5,
			"Org ID should 3 - 5 characters"
		);

		require(
			keccak256(abi.encodePacked(admin[msg.sender].RegisteredOrgID1)) !=
				keccak256(abi.encodePacked(_orgID)) &&
				keccak256(
					abi.encodePacked(admin[msg.sender].RegisteredOrgID2)
				) !=
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

		bytes10 UniqueAdminvoterID = bytes10(
			abi.encodePacked(_orgID, "-", "Admin")
		);

		if (bytes(admin[msg.sender].RegisteredOrgID1).length == 0) {
			admin[msg.sender].RegisteredOrgID1 = _orgID;
			admin[msg.sender].AdminVoterIDOrg1 = UniqueAdminvoterID;
		} else if (bytes(admin[msg.sender].RegisteredOrgID2).length == 0) {
			admin[msg.sender].RegisteredOrgID2 = _orgID;
			admin[msg.sender].AdminVoterIDOrg2 = UniqueAdminvoterID;
		}

		AdminInfo.electionAdminAddress = msg.sender;
		AdminInfo.adminName = bytes32(abi.encodePacked(_adminName));
		AdminInfo.userBirthDate = _userBirthDate;
		voterBirthDateByName[_adminName] = _userBirthDate;
		AdminInfo.isRegistered = true;

		++AdminInfo.adminOrgCount;

		registeredAdmin[msg.sender] = true;
		votersIDExists[UniqueAdminvoterID] = true;

		AdminInfo.nextOrgCreationBlock = 50 + block.number;

		++organizationsCounter;
		++VotreXUserCounter;
	}

	function registerVoter(
		string memory _voterName,
		string memory _orgID,
		bytes32 _userBirthDate,
		bytes32 uniqueVoterID
	) external payable onlyWhenActivated {
		Voter storage voter = voters[msg.sender];
		bytes16 VoterID16 = bytes16(abi.encodePacked(uniqueVoterID));
		bytes32 _orgID32 = bytes32(abi.encodePacked(_orgID));

		require(
			organizationData[_orgID].totalMembers < 5000,
			"Maximum member limit reached"
		);

		require(bytes(_voterName).length > 1, "Please fill Voter Name");

		require(
			bytes(_voterName).length < 24,
			"Voter name limit is 24 characters"
		);

		require(
			keccak256(abi.encodePacked(voters[msg.sender].RegisteredOrgID1)) !=
				keccak256(abi.encodePacked(_orgID)) &&
				keccak256(
					abi.encodePacked(voters[msg.sender].RegisteredOrgID2)
				) !=
				keccak256(abi.encodePacked(_orgID)) &&
				!registeredAdmin[msg.sender],
			"Voter is registered in Org"
		);

		require(ElectionActiveCheck(_orgID) < 1, "Election in progress!");

		require(bytes16(uniqueVoterID).length > 0);

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
		voter.isRegistered = true;
		voter.userBirthDate = _userBirthDate;
		voterNameList[_orgID32].push(_voterName);
		voterBirthDateByName[_voterName] = _userBirthDate;
		votersIDExists[VoterID16] = true;
		++VotreXUserCounter;
		++organizationData[_orgID].totalMembers;
	}

	function createElection(
		string memory _orgID,
		string memory _userElectionID,
		string memory _electionName,
		uint8 _candidateCount,
		bool _isHaveCandidateMode
	) external onlyWhenActivated onlyOrgAdmin(_orgID) {
		require(bytes(organizationData[_orgID].orgID).length > 0);

		require(
			bytes(_userElectionID).length > 1,
			// error 36a = error incorrect null value
			"error 36a"
		);

		require(bytes(_userElectionID).length < 5, "ID should < 5 characters");

		require(bytes(_electionName).length > 1);

		require(bytes(_electionName).length < 25, "Election name should < 25");

		require(
			organizationData[_orgID].activeElectionCounter < 10,
			"Maximum events reached"
		);

		bytes32 generatedElectionID = bytes32(
			abi.encodePacked(_orgID, "-", _userElectionID)
		);

		require(
			!electionExistanceChecks[generatedElectionID],
			"Election ID exists"
		);

		ElectionDetail storage newElection = electionInfo[generatedElectionID];
		newElection.orgID = _orgID;
		newElection.electionID = generatedElectionID;
		newElection.electionName = bytes32(abi.encodePacked(_electionName));
		newElection.status = ElectionStatus.Preparation;
		electionExistanceChecks[generatedElectionID] = true;

		if (_isHaveCandidateMode == true) {
			require(_candidateCount > 1, "Minimum 2 candidates!");

			newElection.candidateList = _candidateCount;
		} else {
			newElection.candidateList = 0;
		}

		newElection.isHaveCandidateMode = _isHaveCandidateMode;
		electionExistanceChecks[generatedElectionID] = true;
		organizationData[_orgID].electionIDs.push(generatedElectionID);
		organizationData[_orgID].ElectionName.push(
			bytes32(abi.encodePacked(_electionName))
		);
		organizationData[_orgID].electionStatus.push(
			ElectionStatus.Preparation
		);
		++organizationData[_orgID].onPreparationElectionCounter;
	}

	function startElection(
		string memory _userElectionID
	) external onlyOrgAdmin(_userElectionID) {
		// error 36a = error incorrect null value
		require(bytes(_userElectionID).length > 0, "error:36a");

		bytes32 userElectionID = bytes32(abi.encodePacked(_userElectionID));
		string memory orgIDs = UtilityLibrary.extractOrgId(_userElectionID);

		ElectionDetail storage election = electionInfo[userElectionID];
		require(bytes16(election.electionID).length > 0, "Invalid election ID");
		require(
			election.status == ElectionStatus.Preparation,
			"Election is not in preparation"
		);

		if (election.isHaveCandidateMode == true) {
			require(
				election.candidateList == election.candidates.length,
				"Candidate Not full"
			);
		}
		election.startTime = 5 + block.timestamp;
		election.status = ElectionStatus.Started;
		++election.waveNumber;
		++organizationData[orgIDs].activeElectionCounter;
		--organizationData[orgIDs].onPreparationElectionCounter;
		uint256 index = findElectionIndex(
			organizationData[orgIDs].electionIDs,
			userElectionID
		);
		require(
			index < organizationData[orgIDs].electionIDs.length,
			"Election not found"
		);
		organizationData[orgIDs].electionStatus[index] = ElectionStatus.Started;
	}

	function findElectionIndex(
		bytes32[] storage array,
		bytes32 electionID
	) internal view returns (uint256) {
		for (uint256 i = 0; i < array.length; i++) {
			if (array[i] == electionID) {
				return i;
			}
		}
		revert("Election ID not found");
	}

	event CandidateStored(
		bytes32 indexed electionId,
		string candidateName,
		uint256 voteCount
	);

	function finishElection(
		string memory _userElectionID,
		bytes32 _dataHash,
		uint256 _threshold
	) external {
		string memory orgIDs = UtilityLibrary.extractOrgId(_userElectionID);
		bytes32 packedElectionID = bytes32(abi.encodePacked(_userElectionID));
		ElectionDetail storage election = electionInfo[packedElectionID];
		string memory electionName = string(
			abi.encodePacked(election.electionName)
		);
		bytes32 electionIdBytes = keccak256(
			abi.encodePacked(_userElectionID, "-", electionName)
		);

		ElectionDetail storage elections = electionInfo[packedElectionID];

		require(
			elections.status == ElectionStatus.Started,
			"Election is not active"
		);
		require(!elections.isFinished, "Election finished");
		require(bytes(_userElectionID).length > 0, "Invalid election ID");
		require(_dataHash.length > 0, "Invalid data hash");

		uint256 candidatesLength = elections.candidates.length;
		require(candidatesLength >= 2, "Not enough candidates");

		uint256 quorumThreshold = calculateValidElection(_userElectionID);

		CandidateDetail[] memory candidatesMem = new CandidateDetail[](
			candidatesLength
		);
		for (uint256 i = 0; i < candidatesLength; i++) {
			candidatesMem[i] = elections.candidates[i];
		}

		bool quorumReached = false;
		uint256 winningCandidateIndex;
		bool kisquosientMode = false;
		uint256 passedCandidateCount = 0;

		for (uint256 i = 0; i < candidatesLength; ++i) {
			uint256 voteCount = candidatesMem[i].candidateVoteCount;

			if (voteCount > quorumThreshold) {
				quorumReached = true;
				winningCandidateIndex = i;
				break;
			} else {
				if (voteCount > _threshold) {
					kisquosientMode = true;
					++passedCandidateCount;
				}
			}
		}

		if (quorumReached) {
			_finalizeElection(
				_userElectionID,
				packedElectionID,
				orgIDs,
				_dataHash,
				winningCandidateIndex
			);
			return;
		} else if (!quorumReached && kisquosientMode == true) {
			_handleThresholdCandidates(
				_userElectionID,
				electionIdBytes,
				passedCandidateCount,
				_threshold,
				packedElectionID
			);
			return;
		}
		revert("No candidates passed threshold");
	}

	function _finalizeElection(
		string memory _userElectionID,
		bytes32 packedElectionID,
		string memory orgIDs,
		bytes32 _dataHash,
		uint256 winningCandidateIndex
	) internal {
		ElectionDetail storage elections = electionInfo[packedElectionID];

		string memory electionWinner = elections
			.candidates[winningCandidateIndex]
			.candidateName;
		string memory adminName = getAdminName(msg.sender);

		ElectionResult storage newElectionResult = electionResults[
			_userElectionID
		];
		newElectionResult.isPruned = true;
		newElectionResult.totalVoter = elections.totalParticipants;
		newElectionResult.adminAddress = msg.sender;
		newElectionResult.startTime = elections.startTime;
		newElectionResult.endTime = elections.endTime;
		newElectionResult.digitalSignature = _dataHash;
		newElectionResult.registeredOrganization = elections.orgID;
		newElectionResult.electionID = packedElectionID;
		newElectionResult.waveNumber = elections.waveNumber;
		newElectionResult.electionName = elections.electionName;
		newElectionResult.electionWinner = electionWinner;
		newElectionResult.signedBy = adminName;

		elections.isFinished = true;
		elections.status = ElectionStatus.Finished;

		uint256 candidatesLength = elections.candidates.length;
		for (uint256 i = 0; i < candidatesLength; ++i) {
			CandidateDetail storage candidate = elections.candidates[i];
			newElectionResult.candidates.push(
				CandidateDetail({
					candidateID: candidate.candidateID,
					candidateName: candidate.candidateName,
					candidateVoteCount: candidate.candidateVoteCount
				})
			);
		}

		uint256 index = findElectionIndex(
			organizationData[orgIDs].electionIDs,
			packedElectionID
		);

		organizationData[orgIDs].electionStatus[index] = ElectionStatus
			.Finished;

		++organizationData[orgIDs].archivedElectionCounter;
		--organizationData[orgIDs].activeElectionCounter;
	}

	function _handleThresholdCandidates(
		string memory _userElectionID,
		bytes32 electionIdBytes,
		uint256 passedCandidateCount,
		uint256 _threshold,
		bytes32 packedElectionID
	) internal {
		ElectionDetail storage elections = electionInfo[packedElectionID];

		if (passedCandidateCount < 2) {
			// Single candidate passing threshold
			_handleSinglePassedCandidate(
				electionIdBytes,
				elections,
				_threshold
			);
			return;
		} else if (passedCandidateCount > 2) {
			// Multiple candidates passing threshold

			uint256[] memory lowestIndices = _findLowestVoteCandidate(
				elections.candidates
			);
			_removeCandidate(elections.candidates, lowestIndices);

			_resetElectionRound(_userElectionID);
			delete voterAddrList[electionIdBytes];
			return;
		} else {
			// Exactly 2 candidates passing threshold
			if (elections.waveNumber <= 2) {
				// Early wave (waveNumber 1)
				for (uint256 k = 0; k < elections.candidates.length; ++k) {
					if (
						elections.candidates[k].candidateVoteCount > _threshold
					) {
						temporalCandidates[electionIdBytes][
							elections.candidates[k].candidateName
						].candidateName = elections.candidates[k].candidateName;
					}
				}

				uint256[] memory lowestIndices = _findLowestVoteCandidate(
					elections.candidates
				);
				_removeCandidate(elections.candidates, lowestIndices);

				// Reset for next round
				_resetElectionRound(_userElectionID);
			} else {
				// Final wave (waveNumber = 2)
				uint256 winnerIndex;
				if (
					elections.candidates[0].candidateVoteCount >
					elections.candidates[1].candidateVoteCount
				) {
					winnerIndex = 0;
				} else if (
					elections.candidates[1].candidateVoteCount >
					elections.candidates[0].candidateVoteCount
				) {
					winnerIndex = 1;
				} else {
					elections.isTiedVoting = true;
				}
				// Finalize election
				_finalizeElection(
					_userElectionID,
					electionIdBytes,
					elections.orgID,
					bytes32(0),
					winnerIndex
				);
			}
			return;
		}
	}

	function _findLowestVoteCandidate(
		CandidateDetail[] storage candidates
	) internal view returns (uint256[] memory) {
		require(candidates.length > 0, "No candidates to evaluate");

		uint256 lowestVotes = type(uint256).max;
		for (uint256 i = 0; i < candidates.length; ++i) {
			if (candidates[i].candidateVoteCount < lowestVotes) {
				lowestVotes = candidates[i].candidateVoteCount;
			}
		}

		uint256 lowestCount = 0;
		for (uint256 i = 0; i < candidates.length; ++i) {
			if (candidates[i].candidateVoteCount == lowestVotes) {
				lowestCount++;
			}
		}

		uint256[] memory lowestIndices = new uint256[](lowestCount);
		uint256 arrayIndex = 0;

		for (uint256 i = 0; i < candidates.length; ++i) {
			if (candidates[i].candidateVoteCount == lowestVotes) {
				lowestIndices[arrayIndex] = i;
				arrayIndex++;
			}
		}

		return lowestIndices;
	}

	function _findHighestVoteCandidateAboveThreshold(
		CandidateDetail[] storage candidates,
		uint256 threshold
	) internal view returns (uint256) {
		uint256 highestVotes = 0;
		uint256 highestIndex = type(uint256).max;
		uint256 candidatesLength = candidates.length;

		for (uint256 k = 0; k < candidatesLength; ++k) {
			uint256 currentVotes = candidates[k].candidateVoteCount;
			if (currentVotes > threshold && currentVotes > highestVotes) {
				highestVotes = currentVotes;
				highestIndex = k;
			}
		}

		require(
			highestIndex != type(uint256).max,
			"No candidate above threshold"
		);
		return highestIndex;
	}

	function _handleSinglePassedCandidate(
		bytes32 electionIdBytes,
		ElectionDetail storage elections,
		uint256 _threshold
	) internal {
		uint256 highestIndex = _findHighestVoteCandidateAboveThreshold(
			elections.candidates,
			_threshold
		);
		CandidateDetail storage thresholdCandidate = elections.candidates[
			highestIndex
		];

		temporalCandidates[electionIdBytes][
			thresholdCandidate.candidateName
		] = CandidateDetail({
			candidateID: thresholdCandidate.candidateID,
			candidateName: thresholdCandidate.candidateName,
			candidateVoteCount: thresholdCandidate.candidateVoteCount
		});

		uint256[] memory lowestIndices = _findLowestVoteCandidate(
			elections.candidates
		);
		_removeCandidate(elections.candidates, lowestIndices);

		for (uint256 m = 0; m < elections.candidates.length; ++m) {
			elections.candidates[m].candidateVoteCount = 0;
		}

		address[] storage voterStorage = voterAddrList[electionIdBytes];
		for (uint256 n = 0; n < voterStorage.length; ++n) {
			hasVoted[electionIdBytes][voterStorage[n]] = false;
		}
		delete voterAddrList[electionIdBytes];

		elections.totalParticipants = 0;
		++elections.waveNumber;
		elections.isFinished = false;
		emit CandidateStored(
			electionIdBytes,
			thresholdCandidate.candidateName,
			thresholdCandidate.candidateVoteCount
		);
	}

	function _resetElectionRound(string memory _userElectionID) internal {
		bytes32 packedElectionID = bytes32(abi.encodePacked(_userElectionID));
		ElectionDetail storage elections = electionInfo[packedElectionID];
		string memory electionName = string(
			abi.encodePacked(elections.electionName)
		);
		bytes32 electionIdBytes = keccak256(
			abi.encodePacked(_userElectionID, "-", electionName)
		);

		uint256 candidatesLength = elections.candidates.length;
		for (uint256 i = 0; i < candidatesLength; ++i) {
			elections.candidates[i].candidateVoteCount = 0;
		}

		address[] storage voterStorage = voterAddrList[electionIdBytes];
		uint256 votersLength = voterStorage.length;
		for (uint256 j = 0; j < votersLength; ++j) {
			hasVoted[electionIdBytes][voterStorage[j]] = false;
		}
		delete voterAddrList[electionIdBytes];

		elections.totalParticipants = 0;
		++elections.waveNumber;
		elections.isFinished = false;
	}

	function _removeCandidate(
		CandidateDetail[] storage candidates,
		uint256[] memory indices
	) internal {
		require(indices.length > 0, "No candidates to remove");

		for (uint256 i = 0; i < indices.length; i++) {
			for (uint256 j = i + 1; j < indices.length; j++) {
				if (indices[i] < indices[j]) {
					uint256 temp = indices[i];
					indices[i] = indices[j];
					indices[j] = temp;
				}
			}
		}

		for (uint256 i = 0; i < indices.length; i++) {
			uint256 indexToRemove = indices[i];
			uint256 lastIndex = candidates.length - 1;

			if (indexToRemove != lastIndex) {
				candidates[indexToRemove] = candidates[lastIndex];
			}
			candidates.pop();
		}
	}

	function calculateValidElection(
		string memory _userElectionID
	) private view returns (uint256) {
		bytes32 packedElectionID = bytes32(abi.encodePacked(_userElectionID));
		ElectionDetail storage elections = electionInfo[packedElectionID];
		uint256 MIN_VOTES_PERCENTAGE = 1 + (elections.totalParticipants / 2);

		return MIN_VOTES_PERCENTAGE;
	}

	function getOwnerAddress() external view returns (address) {
		return VotreXOwnerAddress;
	}

	function getOwnerName() external view returns (bytes32) {
		return VotreXOwnerName;
	}

	function getTotalUser() external view returns (uint256) {
		return VotreXUserCounter;
	}

	function getElectionListInOrg(
		string memory orgID
	)
		external
		view
		returns (bytes32[] memory, bytes32[] memory, ElectionStatus[] memory)
	{
		Organization storage org = organizationData[orgID];
		return (org.electionIDs, org.ElectionName, org.electionStatus);
	}

	function getAdminName(
		address adminAddress
	) private view returns (string memory) {
		return string(abi.encodePacked(admin[adminAddress].adminName));
	}

	function addCandidateDetail(
		string memory _userElectionID,
		string memory _candidateName
	) external onlyOrgAdmin(_userElectionID) {
		bytes32 userElectionID = bytes32(abi.encodePacked(_userElectionID));
		ElectionDetail storage election = electionInfo[userElectionID];
		string memory orgID = UtilityLibrary.extractOrgId(_userElectionID);
		bytes32 orgIDBytes = bytes32(abi.encodePacked(orgID));

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
			UtilityLibrary.allowWhiteSpace(_candidateName),
			"Candidate name can only contain alphabetical"
		);

		bool isValidVoterName = false;

		for (uint i = 0; i < voterNameList[orgIDBytes].length; i++) {
			if (
				keccak256(abi.encodePacked(voterNameList[orgIDBytes][i])) ==
				keccak256(abi.encodePacked(_candidateName))
			) {
				isValidVoterName = true;
				break;
			}
		}

		require(isValidVoterName, "This Candidate is not registered");

		bytes32 encryptedBirthDate = voterBirthDateByName[_candidateName];
		bool isOver60Years = UtilityLibrary.isOver60Years(
			encryptedBirthDate,
			int256(Time_Offset)
		);

		require(
			!isOver60Years,
			"Candidate must be under 60 years old and born"
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
		string memory _candidateName,
		bool isModeHaveCandidate
	) external onlyWhenActivated onlyAuthorizedMember(_userElectionID) {
		bytes32 userElectionID = bytes32(abi.encodePacked(_userElectionID));
		ElectionDetail storage election = electionInfo[userElectionID];
		bytes32 electionName = election.electionName;
		bytes32 electionIdBytes = keccak256(
			abi.encodePacked(_userElectionID, "-", electionName)
		);
		string memory orgID = UtilityLibrary.extractOrgId(_userElectionID);
		bytes32 orgIDBytes = bytes32(abi.encodePacked(orgID));
		string memory formattedName = UtilityLibrary.capitalizeFirstLetter(
			_candidateName
		);

		bool isValidVoterName = false;

		if (
			isModeHaveCandidate == true ||
			election.status == ElectionStatus.HeadToHeadWave
		) {
			require(
				bytes(_userElectionID).length > 0,
				"Election ID can't be empty"
			);
			require(
				candidateID < election.candidates.length,
				"Invalid candidate ID"
			);
			require(
				election.status == ElectionStatus.Started,
				"Election is not in progress"
			);
			require(
				!hasVoted[electionIdBytes][msg.sender],
				"Anda sudah memilih!"
			);

			++election.candidates[candidateID].candidateVoteCount;
			++election.totalParticipants;

			hasVoted[electionIdBytes][msg.sender] = true;
			voterAddrList[electionIdBytes].push(msg.sender);
		} else {
			require(bytes(_candidateName).length > 0, "Silahkan masukkan nama");
			require(
				!hasVoted[electionIdBytes][msg.sender],
				"Anda sudah memilih!"
			);
			require(
				election.status == ElectionStatus.Started,
				"Election is not in progress"
			);
			require(
				UtilityLibrary.allowWhiteSpace(_candidateName),
				"Please enter alphabetical Candidate name"
			);

			uint8 candidateIDs = uint8(election.candidates.length);
			bool candidateExists = false;

			for (uint i = 0; i < voterNameList[orgIDBytes].length; i++) {
				if (
					keccak256(abi.encodePacked(voterNameList[orgIDBytes][i])) ==
					keccak256(abi.encodePacked(_candidateName))
				) {
					isValidVoterName = true;
					break;
				}
			}

			require(isValidVoterName, "This Candidate is not registered");

			bytes32 encryptedBirthDate = voterBirthDateByName[_candidateName];

			bool isOver60Years = UtilityLibrary.isOver60Years(
				encryptedBirthDate,
				int256(Time_Offset)
			);

			require(
				!isOver60Years,
				"Candidate must be under 60 years old and born"
			);

			for (uint256 i = 0; i < election.candidates.length; i++) {
				if (
					keccak256(
						abi.encodePacked(election.candidates[i].candidateName)
					) == keccak256(abi.encodePacked(formattedName))
				) {
					election.candidates[i].candidateVoteCount += 1;
					candidateExists = true;
					break;
				}
			}

			if (!candidateExists) {
				CandidateDetail memory newCandidate = CandidateDetail({
					candidateID: candidateIDs,
					candidateName: _candidateName,
					candidateVoteCount: 1
				});
				election.candidates.push(newCandidate);
			}
			hasVoted[electionIdBytes][msg.sender] = true;
			voterAddrList[electionIdBytes].push(msg.sender);
			++election.totalParticipants;
		}
	}

	function getAllCandidates(
		string memory _userElectionID
	) public view returns (CandidateDetail[] memory) {
		bytes32 userElectionID = bytes32(abi.encodePacked(_userElectionID));
		ElectionDetail storage election = electionInfo[userElectionID];

		require(
			election.candidates.length > 0,
			"No candidates found in this election!"
		);

		return election.candidates;
	}

	function isVotreXActivated() external view returns (bool) {
		return VotreXActivated;
	}

	function getTotalOrganization() external view virtual returns (uint256) {
		return organizationsCounter;
	}

	function getElectionInfo(
		string memory _userElectionID
	)
		external
		view
		returns (
			bytes32 electionID,
			string memory electionName,
			uint256 waveNumber,
			uint256 totalCandidates,
			uint8[] memory candidateIDs,
			string[] memory candidateNames,
			uint256[] memory voteCounts,
			uint256 totalParticipants,
			ElectionStatus statusElection,
			bool isHaveCandidateMode,
			uint8 candidateLimit
		)
	{
		bytes32 userElectionID = bytes32(abi.encodePacked(_userElectionID));

		ElectionDetail storage election = electionInfo[userElectionID];
		require(bytes32(election.electionID).length > 0);

		electionID = election.electionID;
		electionName = string(abi.encodePacked(election.electionName));
		waveNumber = election.waveNumber;
		totalCandidates = election.candidates.length;
		candidateLimit = election.candidateList;
		candidateIDs = new uint8[](totalCandidates);
		candidateNames = new string[](totalCandidates);
		voteCounts = new uint256[](totalCandidates);
		totalParticipants = election.totalParticipants;
		statusElection = electionInfo[userElectionID].status;
		isHaveCandidateMode = electionInfo[userElectionID].isHaveCandidateMode;

		for (uint256 i = 0; i < totalCandidates; ++i) {
			candidateIDs[i] = election.candidates[i].candidateID;
			candidateNames[i] = election.candidates[i].candidateName;
			voteCounts[i] = election.candidates[i].candidateVoteCount;
		}

		return (
			electionID,
			electionName,
			waveNumber,
			totalCandidates,
			candidateIDs,
			candidateNames,
			voteCounts,
			totalParticipants,
			statusElection,
			isHaveCandidateMode,
			candidateLimit
		);
	}

	function getCandidateResult(
		string memory _electionID
	)
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
			candidateIDs[i] = electionResults[_electionID]
				.candidates[i]
				.candidateID;
			candidateNames[i] = electionResults[_electionID]
				.candidates[i]
				.candidateName;
			candidateVoteCounts[i] = electionResults[_electionID]
				.candidates[i]
				.candidateVoteCount;
		}

		return (candidateIDs, candidateNames, candidateVoteCounts);
	}

	function getUserInfo()
		external
		view
		returns (
			bool isRegistered,
			bool isAdmin,
			address userAddress,
			string memory userName,
			string[] memory registeredOrgList,
			string[] memory voterIDList
		)
	{
		userAddress = msg.sender;

		bool isAdminRole = admin[userAddress].isRegistered;
		bool isVoterRole = voters[userAddress].isRegistered;

		string[] memory RegisteredOrgIDList = new string[](2);
		string[] memory RegisteredVoterIDList = new string[](2);
		string memory combinedName = "";

		if (isAdminRole) {
			ElectionAdmins storage adminInfo = admin[userAddress];

			RegisteredOrgIDList[0] = adminInfo.RegisteredOrgID1;
			RegisteredOrgIDList[1] = adminInfo.RegisteredOrgID2;

			RegisteredVoterIDList[0] = string(
				abi.encodePacked(adminInfo.AdminVoterIDOrg1)
			);
			RegisteredVoterIDList[1] = string(
				abi.encodePacked(adminInfo.AdminVoterIDOrg2)
			);

			combinedName = string(abi.encodePacked(adminInfo.adminName));
		}

		if (isVoterRole) {
			Voter storage voter = voters[userAddress];

			if (!isAdminRole) {
				RegisteredOrgIDList[0] = voter.RegisteredOrgID1;
				RegisteredOrgIDList[1] = voter.RegisteredOrgID2;

				RegisteredVoterIDList[0] = string(
					abi.encodePacked(voter.VoterIDOrg1)
				);
				RegisteredVoterIDList[1] = string(
					abi.encodePacked(voter.VoterIDOrg2)
				);

				combinedName = voter.VoterName;
			} else {
				if (bytes(RegisteredOrgIDList[1]).length == 0) {
					RegisteredOrgIDList[1] = voter.RegisteredOrgID1;
				}

				if (bytes(RegisteredVoterIDList[1]).length == 0) {
					RegisteredVoterIDList[1] = string(
						abi.encodePacked(voter.VoterIDOrg1)
					);
				}
			}
		}

		return (
			isAdminRole || isVoterRole,
			isAdminRole,
			userAddress,
			combinedName,
			RegisteredOrgIDList,
			RegisteredVoterIDList
		);
	}

	function ElectionActiveCheck(
		string memory _orgID
	) private view returns (uint256) {
		return organizationData[_orgID].activeElectionCounter;
	}

	function determineWinner(
		string memory _userElectionID
	) private view returns (string memory) {
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

	function isVoterChecked(
		string memory _userElectionID
	) external view returns (bool) {
		bytes32 userElectionID = bytes32(abi.encodePacked(_userElectionID));
		bytes32 electionName = electionInfo[userElectionID].electionName;
		bytes32 electionIdBytes = keccak256(
			abi.encodePacked(_userElectionID, "-", electionName)
		);
		return hasVoted[electionIdBytes][msg.sender];
	}

	function getOrgIDHash(
		string memory _orgID
	) external pure returns (bytes32) {
		bytes32 orgIDHash = keccak256(abi.encodePacked(_orgID));

		return (orgIDHash);
	}
}
