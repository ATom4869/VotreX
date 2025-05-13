// SPDX-License-Identifier: MIT
// pragma abicoder v2;
pragma solidity ^0.8.24;

import "./UtilityLibrary.sol";

contract TestingElection {

    constructor() {
        // Create a test election ID
        string memory testElectionID = "GKPS-Bp1";
        bytes32 packedElectionID = bytes32(abi.encodePacked(testElectionID));
        
        // Initialize test election
        ElectionDetail storage testElection = electionInfo[packedElectionID];
        testElection.electionID = packedElectionID;
        testElection.electionName = bytes32("Seksi Bapa");
        testElection.status = ElectionStatus.Started;
        testElection.waveNumber = 1;
        testElection.totalParticipants = 10; // Example total participants
        
        // Initialize candidates
        testElection.candidates.push(
            CandidateDetail({
                candidateID: 0,
                candidateName: "Mavuika",
                candidateVoteCount: 1
            })
        );
        
        testElection.candidates.push(
            CandidateDetail({
                candidateID: 1,
                candidateName: "Morax",
                candidateVoteCount: 6
            })
        );
        
        testElection.candidates.push(
            CandidateDetail({
                candidateID: 2,
                candidateName: "Neuvillette",
                candidateVoteCount: 1
            })
        );
        
        testElection.candidates.push(
            CandidateDetail({
                candidateID: 3,
                candidateName: "Nahida",
                candidateVoteCount: 2
            })
        );
    }
	mapping(string => Organization) public organizationData;
	mapping(address => ElectionAdmins) public admin;
	mapping(address => Voter) public voters;
	mapping(bytes32 => address[]) private votersList;
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

    function finishElection(
		string memory _userElectionID,
		bytes32 _dataHash,
		uint256 _threshold
	) external {
		bytes32 packedElectionID = bytes32(abi.encodePacked(_userElectionID));
		string memory orgIDs = UtilityLibrary.extractOrgId(_userElectionID);
		bytes32 electionIdBytes = keccak256(abi.encodePacked(_userElectionID));

		// Cache storage in memory to reduce storage reads
		ElectionDetail storage elections = electionInfo[packedElectionID];

		// Validation checks
		require(
			elections.status == ElectionStatus.Started,
			"Election is not active"
		);
		require(!elections.isFinished, "Election finished");
		require(bytes(_userElectionID).length > 0, "Invalid election ID");
		require(_dataHash.length > 0, "Invalid data hash");

		uint256 candidatesLength = elections.candidates.length;
		require(candidatesLength >= 2, "Not enough candidates");

		// Calculate quorum threshold once
		uint256 quorumThreshold = calculateValidElection(_userElectionID);

		// Memory array to avoid repeated storage reads
		CandidateDetail[] memory candidatesMem = new CandidateDetail[](
			candidatesLength
		);
		for (uint256 i = 0; i < candidatesLength; i++) {
			candidatesMem[i] = elections.candidates[i];
		}

		// Check for immediate quorum - scan once to find winning candidate
		bool quorumReached = false;
		uint256 winningCandidateIndex;
		bool kisquosientMode = false;
		uint256 passedCandidateCount = 0;

		// Combined loop to check all conditions at once
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
			// Quorum reached - handle winning case
			_finalizeElection(
				_userElectionID,
				packedElectionID,
				orgIDs,
				_dataHash,
				winningCandidateIndex
			);
			return;
		} else if (!quorumReached && kisquosientMode == true) {
			// Handle threshold-passing candidates
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
	
	function calculateAge(bytes32 encryptedDate, int256 timeOffset) internal view returns (int256) {
        // Convert bytes32 to uint256 first, then to int256
        int256 birthTimeStamp = int256(uint256(encryptedDate)) - timeOffset;
        int256 currentTime = int256(block.timestamp);
        
        // Calculate age in seconds and convert to years
        int256 ageInSeconds = currentTime - birthTimeStamp;
        int256 ageInYears = ageInSeconds / 31536000; // seconds in a year
        
        return ageInYears;
    }

    function extractOrgId(string memory _userElectionID) internal pure returns (string memory) {
        string[] memory parts = UtilityLibrary.splitString(_userElectionID, "-");
        require(parts.length > 0, "Invalid custom election ID format");

        return parts[0];
    }

	// Internal function to finalize an election
	function _finalizeElection(
		string memory _userElectionID,
		bytes32 packedElectionID,
		string memory orgIDs,
		bytes32 _dataHash,
		uint256 winningCandidateIndex
	) internal {
		ElectionDetail storage elections = electionInfo[packedElectionID];

		// Cache winner name
		string memory electionWinner = elections
			.candidates[winningCandidateIndex]
			.candidateName;
		string memory adminName = getAdminName(msg.sender);

		// Create result record
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

		// Mark election as finished
		elections.isFinished = true;
		elections.status = ElectionStatus.Finished;

		// Store candidates in result
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

		// Update organization data
		uint256 index = findElectionIndex(
			organizationData[orgIDs].electionIDs,
			packedElectionID
		);

		organizationData[orgIDs].electionStatus[index] = ElectionStatus
			.Finished;

		// Use unchecked for simple increment/decrement
		++organizationData[orgIDs].archivedElectionCounter;
		--organizationData[orgIDs].activeElectionCounter;
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

	// Internal function to handle threshold-passing candidates
	function _handleThresholdCandidates(
		string memory _userElectionID,
		bytes32 electionIdBytes,
		uint256 passedCandidateCount,
		uint256 _threshold,
		bytes32 packedElectionID
	) public {
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

			uint256 lowestIndex = _findLowestVoteCandidate(elections.candidates);
			_removeCandidate(elections.candidates, lowestIndex);

			_resetElectionRound(_userElectionID);
			delete votersList[electionIdBytes];
			return;
		} else {
			// Exactly 2 candidates passing threshold
			if (elections.waveNumber < 2) {
				// Early wave (waveNumber 1)
				for (uint256 k = 0; k < elections.candidates.length; ++k) {
					if (elections.candidates[k].candidateVoteCount > _threshold) {
						temporalCandidates[electionIdBytes][
							elections.candidates[k].candidateName
						].candidateName = elections.candidates[k].candidateName;
					}
				}

				uint256 lowestIndex = _findLowestVoteCandidate(
					elections.candidates
				);
				_removeCandidate(elections.candidates, lowestIndex);

				// Reset for next round
				_resetElectionRound(_userElectionID);
			} else {
				// Final wave (waveNumber >= 2)
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

	// Internal function to find the candidate with lowest votes
	function _findLowestVoteCandidate(
		CandidateDetail[] storage candidates
	) internal view returns (uint256) {
		uint256 lowestVotes = type(uint256).max;
		uint256 lowestIndex;
		uint256 candidatesLength = candidates.length;

		for (uint256 k = 0; k < candidatesLength; ++k) {
			uint256 currentVotes = candidates[k].candidateVoteCount;
			if (currentVotes < lowestVotes) {
				lowestVotes = currentVotes;
				lowestIndex = k;
			}
		}

		return lowestIndex;
	}

	// Internal function to find the candidate with highest votes that passes a threshold
	function _findHighestVoteCandidateAboveThreshold(
		CandidateDetail[] storage candidates,
		uint256 threshold
	) internal view returns (uint256) {
		uint256 highestVotes = 0;
		uint256 highestIndex = type(uint256).max; // Invalid index to detect no matches
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
		// Find the candidate that passed the threshold (should be the highest vote candidate)
		uint256 highestIndex = _findHighestVoteCandidateAboveThreshold(
			elections.candidates,
			_threshold
		);
		CandidateDetail storage thresholdCandidate = elections.candidates[
			highestIndex
		];

		// Save candidate to temporal storage
		temporalCandidates[electionIdBytes][
			thresholdCandidate.candidateName
		] = CandidateDetail({
			candidateID: thresholdCandidate.candidateID,
			candidateName: thresholdCandidate.candidateName,
			candidateVoteCount: thresholdCandidate.candidateVoteCount
		});

		// Find and remove lowest candidate
		uint256 lowestIndex = _findLowestVoteCandidate(elections.candidates);
		_removeCandidate(elections.candidates, lowestIndex);

		// Reset votes for next round
		for (uint256 m = 0; m < elections.candidates.length; ++m) {
			elections.candidates[m].candidateVoteCount = 0;
		}

		// Reset voter states
		address[] storage voterStorage = votersList[electionIdBytes];
		for (uint256 n = 0; n < voterStorage.length; ++n) {
			hasVoted[electionIdBytes][voterStorage[n]] = false;
		}
		delete votersList[electionIdBytes];

		++elections.waveNumber;
		elections.isFinished = false;
		emit CandidateStored(
			electionIdBytes,
			thresholdCandidate.candidateName,
			thresholdCandidate.candidateVoteCount
		);
	}

    event CandidateStored(
		bytes32 indexed electionId,
		string candidateName,
		uint256 voteCount
	);

    function getAdminName(
		address adminAddress
	) private view returns (string memory) {
		return string(abi.encodePacked(admin[adminAddress].adminName));
	}

	// Internal function to reset for next election round
	function _resetElectionRound(string memory _userElectionID) internal {
		bytes32 electionIdBytes = keccak256(abi.encodePacked(_userElectionID));
		ElectionDetail storage elections = electionInfo[
			bytes32(abi.encodePacked(_userElectionID))
		];

		// Reset votes for all candidates
		uint256 candidatesLength = elections.candidates.length;
		for (uint256 i = 0; i < candidatesLength; ++i) {
			elections.candidates[i].candidateVoteCount = 0;
		}

		// Reset voter states
		address[] storage voterStorage = votersList[electionIdBytes];
		uint256 votersLength = voterStorage.length;
		for (uint256 j = 0; j < votersLength; ++j) {
			hasVoted[electionIdBytes][voterStorage[j]] = false;
		}
		delete votersList[electionIdBytes];

		// Update election
		++elections.waveNumber;
		elections.isFinished = false;
	}

	// Internal function to remove a candidate at specified index
	function _removeCandidate(
		CandidateDetail[] storage candidates,
		uint256 index
	) internal {
		uint256 lastIndex = candidates.length - 1;
		if (index != lastIndex) {
			candidates[index] = candidates[lastIndex];
		}
		candidates.pop();
	}

	function calculateValidElection(
		string memory _userElectionID
	) private view returns (uint256) {
		bytes32 packedElectionID = bytes32(abi.encodePacked(_userElectionID));
		ElectionDetail storage elections = electionInfo[packedElectionID];
		uint256 MIN_VOTES_PERCENTAGE = 1 + (elections.totalParticipants / 2);

		return MIN_VOTES_PERCENTAGE;
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
			uint8[] memory candidateIDs, // Added
			string[] memory candidateNames,
			uint256[] memory voteCounts,
			uint256 totalParticipants,
			ElectionStatus statusElection,
			bool isHaveCandidateMode
		)
	{
		bytes32 userElectionID = bytes32(abi.encodePacked(_userElectionID));

		ElectionDetail storage election = electionInfo[userElectionID];
		require(bytes32(election.electionID).length > 0);

		electionID = election.electionID;
		electionName = string(abi.encodePacked(election.electionName));
		waveNumber = election.waveNumber;
		totalCandidates = election.candidates.length;
		candidateIDs = new uint8[](totalCandidates); // Initialized
		candidateNames = new string[](totalCandidates);
		voteCounts = new uint256[](totalCandidates);
		totalParticipants = election.totalParticipants;
		statusElection = electionInfo[userElectionID].status;
		isHaveCandidateMode = electionInfo[userElectionID].isHaveCandidateMode;

		for (uint256 i = 0; i < totalCandidates; ++i) {
			candidateIDs[i] = election.candidates[i].candidateID; // Added
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
			isHaveCandidateMode
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
}