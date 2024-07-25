"use client";

import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Hex } from "viem";
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

interface ElectionResult {
  isPruned: boolean;
  adminAddress: string;
  startTime: number;
  endTime: number;
  totalVoter: number;
  electionID: string;
  electionName: string;
  digitalSignature: string;
  registeredOrganization: string;
  electionWinner: string;
  signedBy: string;
  candidates: {
    candidateID: bigint;
    name: string;
    voteCount: number;
  }[];
}

const ElectionManage = () => {
  const { data: walletClient } = useWalletClient();
  const [orgID, setOrgID] = useState<string | null>(null);
  const [data, setData] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedElection, setSelectedElection] = useState<ElectionDetails | null>(null);
  const [electionResult, setElectionResult] = useState<ElectionResult | null>(null);
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

  const { writeContractAsync: VOXCommand } = useScaffoldWriteContract("VotreXSystem");

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

        setData(elections);
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

  const handleButtonClick = async (e: React.MouseEvent, electionID: string, status: string) => {
    e.stopPropagation();
    try {
      if (status === "On Preparation") {
        try {
          await VOXCommand(
            {
              functionName: "startElection",
              args: [electionID as string],
            },
            {
              onBlockConfirmation: txnReceipt => {
                toast.success(`Starting Election: ${electionID} - Gas Used: ${txnReceipt.cumulativeGasUsed}`, {
                  autoClose: 3000,
                  onClose: () => {
                    window.location.reload();
                  },
                });
              },
            },
          );
        } catch (error) {
          console.error("Error voting for candidate:", error);
        }
      } else if (status === "Ongoing") {
        try {
          await VOXCommand(
            {
              functionName: "finishElection",
              args: [electionID as string],
            },
            {
              onBlockConfirmation: txnReceipt => {
                toast.success(`Finished Election: ${electionID} - ${txnReceipt.cumulativeGasUsed}`, {
                  autoClose: 3000,
                  onClose: () => {
                    window.location.reload();
                  },
                });
              },
            },
          );
        } catch (error) {
          console.error("Error voting for candidate:", error);
        }
      }
    } catch (error) {
      console.error("Error interacting with smart contract:", error);
    }
  };

  const handleManageClick = async (electionID: string, status: string) => {

    if (selectedElection?.electionID === electionID && status === "On Preparation") {
      setSelectedElection(null);
    } else if (selectedElection?.electionID === electionID && status === "Ongoing") {
      setSelectedElection(null);
    } else if (electionResult?.electionID === electionID && status === "Finished") {
      setElectionResult(null);
    } else {
      try {
        if (status === "Finished") {
          const resultData = await VotreXContract?.read.electionResults([electionID]);
          const candidateData = await VotreXContract?.read.getCandidateResult([electionID])
          if (resultData && candidateData) {
            const isPruned = resultData[0];
            const adminAddress = resultData[1];
            const startTime = Number(resultData[2]);
            const endTime = Number(resultData[3]);
            const totalVoter = Number(resultData[4]);
            const electionIDHex = resultData?.[5] as Hex;
            const electionNameHex = resultData[6];
            const digitalSignatureHex = resultData[7];
            const registeredOrganization = resultData[8];
            const electionWinner = resultData[9];
            const signedBy = resultData[10];
            const candidateIDs = candidateData[0] as number[];
            const candidateNames = candidateData[1] as string[];
            const candidateVoteCounts = candidateData[2]

            const candidates = candidateIDs.map((id: number, index: number) => ({
              candidateID: BigInt(id), // Convert to BigInt
              name: candidateNames[index].replace(/\0/g, "").trim(),
              voteCount: Number(candidateVoteCounts[index]),
            }));;


            const electionResult: ElectionResult = {
              isPruned,
              adminAddress,
              startTime,
              endTime,
              totalVoter,
              electionID: hexToAscii(electionIDHex),
              electionName: hexToAscii(electionNameHex),
              digitalSignature: hexToAscii(digitalSignatureHex),
              registeredOrganization: registeredOrganization.replace(/\0/g, "").trim(),
              electionWinner: electionWinner.replace(/\0/g, "").trim(),
              signedBy: signedBy.replace(/\0/g, "").trim(),
              candidates,
            };
            setElectionResult(electionResult);
          }
          setSelectedElection(null);
        } else {
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
          setElectionResult(null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error fetching data");
      }
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
      toast.success(`Added ${candidateName} as new candidate`, {
        autoClose: 3000,
        onClose: () => {
          window.location.reload();
        },
      });
    } catch (error) {
      console.error("Error adding candidate:", error);
    }
  };

  const handleVoteClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedElection || selectedCandidate === null || !voxTokenValue) return;

    try {
      await VOXCommand(
        {
          functionName: "vote",
          args: [selectedElection.electionID, Number(selectedCandidate), BigInt(voxTokenValue)],
        },
        {
          onBlockConfirmation: txnReceipt => {
            toast.success(`Success Voting: ${txnReceipt.blockHash} - Gas Used: ${txnReceipt.cumulativeGasUsed}`, {
              autoClose: 3000,
              onClose: () => {
                window.location.reload();
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
      <ToastContainer />
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
          <tbody className="cursor-pointer">
            {data.map((election, index) => (
              <tr key={index} onClick={() => handleManageClick(election.electionID, election.electionStatus)}>
                <td className="py-2 px-4 border-b text-center">{election.electionID}</td>
                <td className="py-2 px-4 border-b text-center">{election.electionName}</td>
                <td className="py-2 px-4 border-b text-center">{election.electionStatus}</td>
                <td className="py-2 px-4 border-b text-center">
                  {election.electionStatus !== "Finished" && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={e => handleButtonClick(e, election.electionID, election.electionStatus)}
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
          <div className="bg-base-300 rounded-lg shadow-lg mt-10 p-10 mx-auto w-1/2">
            {/* Election Details */}
            <h3 className="text-center text-xl font-bold mb-4">
              {selectedElection.electionName} - {selectedElection.electionID}
            </h3>
            <p className="text-center text-xl font-regular mb-4">
              Total Candidates: {selectedElection.totalCandidates}
            </p>
            <h3 className="text-center text-lg font-medium">Candidate List</h3>
            <div className="flex justify-center">
              <ul className="text-left mb-4">
                {selectedElection.candidateNames.map((name, index) => (
                  <li key={index} className="mb-2">
                    <div>
                      <span className="font-bold mr-2">No: {index + 1}</span>
                      <span className="mr-4">{name}</span>
                      <span className="text-left">Votes: {selectedElection.voteCounts[index]}</span>
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
                  <div className="space-y-2">
                    {selectedElection.candidateNames.map((name, index) => (
                      <label
                        key={index}
                        className="flex items-center space-x-2 justify-center m-3"
                        style={{ lineHeight: "1.5rem" }}
                      >
                        <input
                          type="radio"
                          name="candidate"
                          value={selectedElection.candidateIDs[index].toString()}
                          checked={selectedCandidate === selectedElection.candidateIDs[index]}
                          onChange={() => setSelectedCandidate(selectedElection.candidateIDs[index])}
                          className="radio radio-secondary"
                          style={{ marginTop: "2px" }}
                        />
                        <span className="ml-2">{name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <label className="block font-medium mb-1">Vote Value:</label>
                  <input
                    id="voteCounts"
                    name="voteCounts"
                    type="range"
                    min={1}
                    max="5"
                    value={voxTokenValue.toString()}
                    className="range w-2/3 mx-auto"
                    step="1"
                    onChange={e => setVoxTokenValue(BigInt(e.target.value))}
                  />
                  <div className="flex w-2/3 mx-auto justify-between px-2 text-xs">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                  </div>
                </div>
                <div className="flex justify-center mt-3">
                  <button type="submit" className="btn btn-primary btn-sm">
                    Vote Now
                  </button>
                </div>
              </form>
            )}

            {electionResult && (
              <div className="bg-base-300 rounded-lg shadow-lg mt-10 p-10 mx-auto w-1/2">
                <h3 className="text-center text-xl font-bold mb-4 flex flex-col items-center">
                  <span>Election Result:</span>
                  <hr />
                  <span className="text-lg">{electionResult.electionName} - {electionResult.electionID}</span>
                </h3>
                <p className="text-center text-lg font-regular mb-4">Total Voters: {electionResult.totalVoter}</p>
                <p className="text-center text-lg font-regular mb-4">Winner: {electionResult.electionWinner}</p>
                <h3 className="text-center text-lg font-medium">Candidates</h3>
                <div className="flex justify-center">
                  <ul className="text-left mb-4">
                    {electionResult.candidates.map((candidate, index) => (
                      <li key={index} className="mb-2">
                        <div>
                          <span className="font-bold mr-2">No: {index + 1}</span>
                          <span className="mr-4">{candidate.name}</span>
                          <span className="text-left">Votes: {candidate.voteCount}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {electionResult && (
          <div className="bg-base-300 rounded-lg shadow-lg mt-10 p-10 mx-auto w-1/2">
            <h3 className="text-center text-xl font-bold mb-4">
              Election Result: {electionResult.electionName} - {electionResult.electionID}
            </h3>
            <p className="text-center text-lg font-regular mb-4">Total Voters: {electionResult.totalVoter}</p>
            <p className="text-center text-lg font-regular mb-4">Winner: {electionResult.electionWinner}</p>
            <h3 className="text-center text-lg font-medium">Candidates</h3>
            <div className="flex justify-center">
              <ul className="text-left mb-4">
                {electionResult.candidates.map((candidate, index) => (
                  <li key={index} className="mb-2">
                    <div>
                      <span className="font-bold mr-2">No: {index + 1}</span>
                      <span className="mr-4">{candidate.name}</span>
                      <span className="text-left">Votes: {candidate.voteCount}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ElectionManage;
