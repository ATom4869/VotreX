import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface Candidate {
  candidateName: string;
  candidateID: number;
}

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  electionID: string;
}

const VoteModal: React.FC<VoteModalProps> = ({ isOpen, onClose, electionID }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [votesAmount, setVotesAmount] = useState<bigint>(BigInt(0));
  const [loading, setLoading] = useState(true);

  const { writeContractAsync: doVote } = useScaffoldWriteContract("VotreXSystem");

  const { data: electionData } = useScaffoldReadContract({
    contractName: "VotreXSystem",
    functionName: "getelectionInfo",
    args: [electionID],
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (electionData) {
          // Properly handle the updated tuple data
          const [electionID, electionName, totalCandidates, candidateIDs, candidateNames, voteCounts] =
            electionData as unknown as [string, string, number, number[], string[], bigint[]];

          if (candidateNames.length > 0) {
            // Map candidates with IDs
            const fetchedCandidates = candidateIDs.map((id, index) => ({
              candidateID: id,
              candidateName: candidateNames[index],
            }));
            setCandidates(fetchedCandidates);
          } else {
            // No candidates found - handle gracefully without setting an error
            setCandidates([]);
          }
        } else {
          // Handle absence of election data gracefully
          setCandidates([]);
        }
      } catch (error) {
        console.error("Error fetching election data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, electionID, electionData]);

  const handleVote = async () => {
    if (selectedCandidate === null || votesAmount <= BigInt(0)) {
      toast.error("Please select a candidate and enter a valid number of votes.");
      return;
    }

    try {
      await doVote(
        {
          functionName: "vote",
          args: [electionID, selectedCandidate, votesAmount],
        },
        {
          onBlockConfirmation: txnReceipt => {
            toast.success(`Success Voting: ${txnReceipt.blockHash} - ${txnReceipt.cumulativeGasUsed}`, {
              autoClose: 3000,
              onClose: () => {
                setTimeout(() => {
                  window.location.href = "/votreXSystem";
                }, 300);
              },
            });
          },
        },
      );
    } catch (error) {
      toast.error("Failed to cast vote.");
      console.error("Vote error:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-35 flex items-center justify-center z-50">
      <div className="bg-base-100 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Vote for Election ID: {electionID}</h2>
        {loading && <p>Loading candidates...</p>}
        <div>
          {candidates.length === 0 ? (
            <p>No candidates available for this election.</p>
          ) : (
            candidates.map(candidate => (
              <div key={candidate.candidateID} className="flex items-center mb-2">
                <input
                  type="radio"
                  id={`candidate-${candidate.candidateID}`}
                  name="candidate"
                  className="radio radio-secondary"
                  value={candidate.candidateID}
                  onChange={() => setSelectedCandidate(candidate.candidateID)}
                />
                <label htmlFor={`candidate-${candidate.candidateID}`} className="ml-2">
                  {candidate.candidateName}
                </label>
              </div>
            ))
          )}
        </div>
        <div className="mt-4">
          <label htmlFor="votes" className="block text-sm font-medium">
            Number of Votes
          </label>
          <input
            type="number"
            id="votes"
            value={votesAmount.toString()}
            onChange={e => setVotesAmount(BigInt(e.target.value))}
            className="input input-secondary input-bordered input-sm w-full max-w-xs"
            min="1"
            max="5"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="btn btn-secondary mr-2">
            Cancel
          </button>
          <button onClick={handleVote} className="btn btn-primary">
            Vote
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoteModal;
