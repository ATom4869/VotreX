import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
  const [candidateName, setCandidateName] = useState("");
  const [selectedRadioCandidate, setSelectedRadioCandidate] = useState<string | null>(null);
  const [waveNumber, setWaveNumber] = useState<number>(0);
  const [isHaveCandidateMode, setIsHaveCandidateMode] = useState<boolean>(); // Store mode
  const [isMobile, setIsMobile] = useState(false);

  const [loading, setLoading] = useState(true);

  const { writeContractAsync: doVote } = useScaffoldWriteContract("TestCompleXA2C");

  const { data: electionData } = useScaffoldReadContract({
    contractName: "TestCompleXA2C",
    functionName: "getElectionInfo",
    args: [electionID],
  });

  const { data: allCandidatesData } = useScaffoldReadContract({
    contractName: "TestCompleXA2C",
    functionName: "getAllCandidates",
    args: [electionID],
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (electionData) {
          const [
            electionID,
            electionName,
            waveNumber,
            totalCandidates,
            candidateIDs,
            candidateNames,
            voteCounts,
            totalParticipants,
            statusElection,
            modeFlag,
          ] = electionData as unknown as [string, string, bigint, number, number[], string[], bigint[], bigint[], string, boolean];

          setWaveNumber(Number(waveNumber));
          setIsHaveCandidateMode(modeFlag); // Store mode
          console.log("Current Wave= " + waveNumber)
          console.log("isHaveCandidateMode =", modeFlag);
          console.log("Election Mode state =", isHaveCandidateMode);

          if (candidateNames.length > 0) {
            const fetchedCandidates = candidateIDs.map((id, index) => ({
              candidateID: id,
              candidateName: candidateNames[index],
            }));
            setCandidates(fetchedCandidates);
          } else {
            setCandidates([]);
          }
        } else {
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
  }, [isOpen, electionID, electionData, waveNumber, isHaveCandidateMode]);


  const handleVote = async () => {
    if (isHaveCandidateMode === null) {
      toast.error("Election mode is not detected!");
      return;
    }

    let chosenCandidateID: number | null = null;
    let chosenCandidateName: string | null = null;

    if (isHaveCandidateMode) {
      // Mode: Predefined Candidates (isHaveCandidateMode === true)
      if (!selectedRadioCandidate) {
        toast.error("Pilih kandidat terlebih dahulu!");
        return;
      }
      chosenCandidateID = parseInt(selectedRadioCandidate, 10);
      chosenCandidateName = "";
    } else {
      // Mode: Write-in Candidates (isHaveCandidateMode === false)
      if (waveNumber === 1) {
        // Wave 1: User inputs candidate name
        if (!candidateName.trim()) {
          toast.error("Masukkan nama kandidat!");
          return;
        }
        chosenCandidateID = 0; // Always 0 for new candidates
        chosenCandidateName = candidateName.trim();
      } else {
        // Wave 2+: User selects from existing candidates
        if (!selectedRadioCandidate) {
          toast.error("Pilih kandidat terlebih dahulu!");
          return;
        }
        chosenCandidateID = 0; // Still use ID = 0 for write-in voting
        chosenCandidateName = selectedRadioCandidate;
      }
    }

    setLoading(true);
    try {
      await doVote(
        {
          functionName: "vote",
          args: [electionID, chosenCandidateID, chosenCandidateName, isHaveCandidateMode],
        },
        {
          onBlockConfirmation: txnReceipt => {
            const gasUsedData = txnReceipt.cumulativeGasUsed
            const gasPriceData = txnReceipt.effectiveGasPrice
            const gasCostWei = gasUsedData * gasPriceData
            // Convert from Wei to ETH
            const gasCostETH = Number(gasCostWei) / 1e18;

            // Format to 6 decimal places for better readability
            const formattedGasCost = gasCostETH.toFixed(6);
            toast.success(`Berhasil memilih: ${chosenCandidateName || "Candidate ID: " + chosenCandidateID}, Gas Used: ${formattedGasCost} ETH`, {
              autoClose: 1500,
              onClose: () => {
                setCandidateName("");
                setSelectedRadioCandidate(null);
                onClose();
              },
            });
          },
        }
      );
    } catch (error: any) {
      // toast.error(`Gagal memilih: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-35 flex items-center justify-center z-50">
      <div className={isMobile ? "bg-base-100 p-6 rounded-lg shadow-lg w-2/3" : "bg-base-100 p-6 rounded-lg shadow-lg"}>
        <h2 className="text-xl font-bold mb-4">
          Gelombang ke: {waveNumber}, Vote untuk Election ID: {electionID}
        </h2>

        <form
          onSubmit={e => {
            e.preventDefault();
            handleVote();
          }}
        >
          {/* Conditional Rendering for Voting Mode */}
          {
            isHaveCandidateMode === true ? (
              // This will be true when isHaveCandidateMode is true
              waveNumber === 1 ? (
                // Wave 1: Show radio buttons for all candidates
                <div>
                  <label className="flex justify-center mb-2 font-medium items-center justify-content text-center">
                    Pilih Salah Satu Kandidat:
                  </label>
                  {candidates.map((candidate, index) => (
                    <label key={index} className="flex flex-start justify-center items-center mb-2 px-24">
                      <input
                        type="radio"
                        value={candidate.candidateID.toString()}
                        name="candidate"
                        checked={selectedRadioCandidate === candidate.candidateID.toString()}
                        onChange={e => setSelectedRadioCandidate(e.target.value)}
                        className="radio radio-info mt-2 mr-2"
                      />
                      <span className="flex justify-start">{candidate.candidateName}</span>
                    </label>
                  ))}
                </div>
              ) : (
                // Wave 2 and beyond: Show radio buttons again
                <div className="flex flex-col">
                  <label className="text-center font-medium mb-2">Pilih Salah Satu Kandidat:</label>
                  {candidates.length > 0 ? (
                    candidates.map((candidate, index) => (
                      <label key={index} className="flex items-center mb-2 mx-auto">
                        <input
                          type="radio"
                          value={candidate.candidateName}
                          name="candidate"
                          checked={selectedRadioCandidate === candidate.candidateName}
                          onChange={e => setSelectedRadioCandidate(e.target.value)}
                          className="radio radio-info mr-4"
                        />
                        <span>{candidate.candidateName}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-center text-sm">Belum ada kandidat.</p>
                  )}
                </div>
              )
            ) : (
              // This will be true when isHaveCandidateMode is false
              waveNumber === 1 ? (
                // Wave 1: Show input form for adding candidate name
                <div className="flex flex-col justify-center">
                  <label className="block text-center font-medium mb-1">Masukkan Nama Kandidat:</label>
                  <input
                    type="text"
                    placeholder="Masukkan nama kandidat"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className={isMobile ? "input input-bordered input-md mx-auto mb-4 w-full" : "input input-bordered input-md mx-auto mb-4 w-1/2"}
                  />
                </div>
              ) : (
                // Wave 2 and beyond: Show radio buttons for candidates
                <div className="flex flex-col">
                  <label className="text-center font-medium mb-2">Pilih Salah Satu Kandidat:</label>
                  {candidates.length > 0 ? (
                    candidates.map((candidate, index) => (
                      <label key={index} className="flex items-center mb-2 mx-auto">
                        <input
                          type="radio"
                          value={candidate.candidateName}
                          name="candidate"
                          checked={selectedRadioCandidate === candidate.candidateName}
                          onChange={e => setSelectedRadioCandidate(e.target.value)}
                          className="radio radio-info mr-4"
                        />
                        <span>{candidate.candidateName}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-center text-sm">Belum ada kandidat.</p>
                  )}
                </div>
              )
            )
          }

          {/* Buttons */}
          <div className={isMobile ? "flex justify-center" : "flex justify-end"}>
            <br />
            <button type="button" onClick={onClose} className="btn btn-secondary mr-2" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Loading..." : "Vote"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default VoteModal;
