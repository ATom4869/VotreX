"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useWalletClient } from "wagmi";
import { hexToAscii as originalHexToAscii } from "web3-utils";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface Election {
  electionID: string;
  electionName: string;
  electionStatus: string;
}

interface ElectionDetails {
  electionID: string;
  electionName: string;
  totalCandidates: number;
  candidateIDs: bigint[];
  candidateNames: string[];
  voteCounts: number[];
  electionStatus: string;
}

const ElectionManage = () => {
  const { data: walletClient } = useWalletClient();
  const [orgID, setOrgID] = useState<string | null>(null);
  const [data, setData] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedElection, setSelectedElection] = useState<ElectionDetails | null>(null);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [voxTokenValue, setVoxTokenValue] = useState<bigint>(BigInt(0));
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<bigint | null>(null);
  const adminAddress = walletClient?.account.address;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrgID(localStorage.getItem("orgID"));
    }
  }, [walletClient]);

  const { data: VotreXContract } = useScaffoldContract({
    contractName: "VotreXSystem",
    walletClient,
  });

  const { data: ElectionList } = useScaffoldReadContract({
    contractName: "VotreXSystem",
    functionName: "getElectionListInOrg",
    args: [orgID as string],
  });

  const { data: ElectionData } = useScaffoldReadContract({
    contractName: "VotreXSystem",
    functionName: "getelectionInfo",
    args: [orgID as string],
  });

  const { writeContractAsync: doVote } = useScaffoldWriteContract("VotreXSystem");

  const hexToAscii = (hex: string): string => {
    const ascii = originalHexToAscii(hex);
    return ascii.replace(/\0/g, "").trim();
  };

  const getStatusString = (status: number) => {
    switch (status) {
      case 0:
        return "On Preparation";
      case 1:
        return "Scheduled";
      case 2:
        return "Ongoing";
      case 3:
        return "Finished";
      default:
        return "Unknown";
    }
  };

  const fetchData = async () => {
    try {
      if (ElectionList) {
        const electionIDs = ElectionList[0];
        const electionNames = ElectionList[1];
        const electionStatuses = ElectionList[2];

        const elections = electionIDs.map((idHex: string, index: number) => {
          const electionID = hexToAscii(idHex);
          const electionName = hexToAscii(electionNames[index]);
          const electionStatus = getStatusString(electionStatuses[index]);

          return {
            electionID,
            electionName,
            electionStatus,
          };
        });

        setData(elections); // Set the entire list of elections to state
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgID && adminAddress) {
      fetchData();
    }
  }, [orgID, adminAddress]);

  const getButtonText = (status: string) => {
    return status === "On Preparation" ? "Start Election" : "Finish Election";
  };

  const handleButtonClick = async (electionID: string, status: string) => {
    if (!electionID) {
      console.error("Invalid Election ID");
      return;
    }

    try {
      if (status === "On Preparation") {
        // Call the smart contract method to start the election
        await VotreXContract?.write.startElection([electionID]);
      } else if (status === "Ongoing") {
        // Call the smart contract method to finish the election
        await VotreXContract?.write.finishElection([electionID]);
      }

      // Reload the page to refresh data
      window.location.reload();
    } catch (error) {
      console.error("Error interacting with smart contract:", error);
    }
  };

  const handleManageClick = async (electionID: string) => {
    if (selectedElection?.electionID === electionID) {
      setSelectedElection(null);
      return;
    }
    try {
      const electionData = await VotreXContract?.read.getelectionInfo([electionID]);
      if (electionData) {
        const electionDetails: ElectionDetails = {
          electionID: hexToAscii(electionData[0]),
          electionName: electionData[1].replace(/\0/g, "").trim(),
          totalCandidates: Number(electionData[2]),
          candidateIDs: electionData[3].map((id: any) => BigInt(id)),
          candidateNames: [...electionData[4]],
          voteCounts: electionData[5].map((count: any) => Number(count)),
          electionStatus: getStatusString(electionData[6]),
        };
        setSelectedElection(electionDetails);
      }
    } catch (error) {
      console.error("Error fetching election details:", error);
    }
  };

  const handleAddCandidateClick = () => {
    setShowAddCandidate(!showAddCandidate);
  };

  const handleAddCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedElection || !candidateName) return;

    try {
      await VotreXContract?.write.addCandidateDetail([selectedElection.electionID as string, candidateName]);
      // Optionally refresh the election data or show a success message
      setCandidateName("");
      setShowAddCandidate(false);
      toast.success(`Added ${candidateName} as new candidate`);
    } catch (error) {
      console.error("Error adding candidate:", error);
    }
  };

  const handleVoteClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedElection || selectedCandidate === null || !voxTokenValue) return;

    try {
      await doVote(
        {
          functionName: "vote",
          args: [selectedElection.electionID, Number(selectedCandidate), BigInt(voxTokenValue)],
        },
        {
          onBlockConfirmation: txnReceipt => {
            toast.success(`Success Voting: ${txnReceipt.blockHash} - ${txnReceipt.cumulativeGasUsed}`, {
              autoClose: 3000,
              onClose: () => {
                setTimeout(() => {
                  window.location.href = "/votreXSystem/electionAdmin/dashboard";
                }, 300);
              },
            });
          },
        },
      );
      // Optionally refresh the election data or show a success message
      setSelectedCandidate(null);
      setVoxTokenValue(BigInt(0));
    } catch (error) {
      console.error("Error voting for candidate:", error);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <section className="section-3 m-4">
      <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 flex flex-col mt-10 relative p-12">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="h-[3rem] w-[9.5rem] bg-base-300 rounded-[22px] py-[0.65rem] shadow-lg shadow-base-300 flex items-center justify-center">
            <h3 className="my-0 text-md font-bold">Election List</h3>
          </div>
        </div>
        <div className="p-5 divide-y divide-base-300"></div>

        <table className="min-w-full">
          <thead>
            <tr>
              <th className="py-2 px-4 bg-base-200 rounded-tl-xl">Election ID</th>
              <th className="py-2 px-4 bg-base-200">Election Name</th>
              <th className="py-2 px-4 bg-base-200">Status</th>
              <th className="py-2 px-4 bg-base-200 rounded-tr-xl">Control</th>
            </tr>
          </thead>
          <tbody>
            {data.map((election, index) => (
              <tr key={index} onClick={() => handleManageClick(election.electionID)}>
                <td className="py-2 px-4 border-b text-center">{election.electionID}</td>
                <td className="py-2 px-4 border-b text-center">{election.electionName}</td>
                <td className="py-2 px-4 border-b text-center">{election.electionStatus}</td>
                <td className="py-2 px-4 border-b text-center">
                  {election.electionStatus !== "Finished" && (
                    <button
                      className="btn btn-primary btn-xs"
                      onClick={() => handleButtonClick(election.electionID, election.electionStatus)}
                    >
                      {getButtonText(election.electionStatus)}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {selectedElection && (
          <div className="bg-base-300 rounded-lg shadow-lg mt-10 p-6 mx-auto w-3/4">
            <h3 className="text-center text-xl font-bold mb-4">{selectedElection.electionName}</h3>
            <p className="text-center text-xl font-regular mb-4">
              Total Candidates: {selectedElection.totalCandidates}
            </p>
            <h3 className="text-center text-lg font-medium">Candidate List</h3>
            <div className="flex justify-center">
              <ul className="text-left mb-4">
                {selectedElection.candidateNames.map((name, index) => (
                  <li key={index} className="mb-2">
                    <div>
                      <span className="font-bold mr-2">No: {index + 1}</span> {/* Candidate ID */}
                      <span className="mr-4">{name}</span>
                      <span className="text-left">Votes: {selectedElection.voteCounts[index]}</span> {/* Vote Count */}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {selectedElection.electionStatus === "On Preparation" && (
              <div className="text-center">
                <button className="btn btn-secondary text-center mt-3" onClick={handleAddCandidateClick}>
                  {showAddCandidate ? "Hide Add Candidate Form" : "Add Candidate"}
                </button>
                {showAddCandidate && (
                  <form onSubmit={handleAddCandidateSubmit} className="mt-3 justify-center">
                    <input
                      type="text"
                      placeholder="Candidate Name"
                      value={candidateName}
                      onChange={e => setCandidateName(e.target.value)}
                      className="input input-bordered input-sm w-full max-w-xs"
                    />
                    <button type="submit" className="btn btn-primary btn-sm mt-2">
                      Add Candidate
                    </button>
                  </form>
                )}
              </div>
            )}

            {selectedElection.electionStatus === "Ongoing" && (
              <form onSubmit={handleVoteClick} className="mt-3">
                <div>
                  <hr />
                  <label className="block text-center font-medium mb-1">Candidates:</label>
                  {selectedElection.candidateNames.map((name, index) => (
                    <label key={index} className="block mr-3 items-center text-center justify-content">
                      <input
                        type="radio"
                        name="candidate"
                        value={selectedElection.candidateIDs[index].toString()}
                        checked={selectedCandidate === selectedElection.candidateIDs[index]}
                        onChange={() => setSelectedCandidate(selectedElection.candidateIDs[index])}
                        className="radio radio-secondary mt-4"
                      />
                      {name}
                    </label>
                  ))}
                </div>
                <div className="mt-3 text-center">
                  <label className="block font-medium mb-1">Vox Token Value:</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={voxTokenValue.toString()}
                    onChange={e => setVoxTokenValue(BigInt(e.target.value))}
                    className="input input-bordered input-sm w-full max-w-xs"
                  />
                </div>
                <div className="flex justify-center mt-3">
                  <button type="submit" className="btn btn-primary btn-sm">
                    Vote Now
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ElectionManage;
