"use client";

import React, { useEffect, useState } from "react";
import { useWalletClient } from "wagmi";
import { hexToAscii as originalHexToAscii } from "web3-utils";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface Election {
  electionID: string;
  electionName: string;
  electionStatus: string;
}

interface ElectionDetails {
  electionID: string;
  electionName: string;
  totalCandidates: number;
  candidateIDs: number[];
  candidateNames: string[];
  voteCounts: number[];
}

const OnPrepElection = () => {
  const { data: walletClient } = useWalletClient();
  const [orgID, setOrgID] = useState<string | null>(null);
  const [data, setData] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedElection, setSelectedElection] = useState<ElectionDetails | null>(null);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [error, setError] = useState<string | null>(null);
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

        // Convert byte32 arrays to human-readable strings
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
          candidateIDs: electionData[3].map((id: any) => Number(id)), // Convert to number
          candidateNames: [...electionData[4]],
          voteCounts: electionData[5].map((count: any) => Number(count)),
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
    } catch (error) {
      console.error("Error adding candidate:", error);
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
              <tr key={index}>
                <td className="py-2 px-4 border-b text-center">{election.electionID}</td>
                <td className="py-2 px-4 border-b text-center">{election.electionName}</td>
                <td className="py-2 px-4 border-b text-center">{election.electionStatus}</td>
                <td className="py-2 px-4 border-b text-center">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleButtonClick(election.electionID, election.electionStatus)}
                  >
                    {getButtonText(election.electionStatus)}
                  </button>

                  <button className="btn btn-sm btn-secondary" onClick={() => handleManageClick(election.electionID)}>
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Display selected election details */}
        {selectedElection && (
          <div className="mt-6 p-4 bg-base-200 rounded-lg shadow-md">
            <h3 className="text-lg font-bold">Election Details</h3>
            <p>
              <strong>ID:</strong> {selectedElection.electionID}
            </p>
            <p>
              <strong>Name:</strong> {selectedElection.electionName}
            </p>
            <p>
              <strong>Total Candidates:</strong> {selectedElection.totalCandidates}
              <button className="btn btn-sm btn-secondary ml-2" onClick={handleAddCandidateClick}>
                Add Candidate
              </button>
            </p>
            {showAddCandidate && (
              <form onSubmit={handleAddCandidateSubmit} className="mt-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium">Candidate Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={candidateName}
                    onChange={e => setCandidateName(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-sm btn-primary">
                  Submit
                </button>
              </form>
            )}

            <div className="mt-4">
              <h4 className="text-md font-bold">Candidates</h4>
              <ul>
                {selectedElection.candidateNames.map((name, index) => (
                  <li key={index}>
                    {name} (Votes: {selectedElection.voteCounts[index]})
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

export default OnPrepElection;
