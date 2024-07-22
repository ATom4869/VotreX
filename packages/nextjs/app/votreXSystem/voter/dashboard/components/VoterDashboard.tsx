import React, { useEffect, useState } from "react";
import VoteModal from "./VoteModal";
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

const VoterDashboard = () => {
  const { data: walletClient } = useWalletClient();
  const [orgID, setOrgID] = useState<string | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedElectionID, setSelectedElectionID] = useState<string>("");
  const [selectedElection, setSelectedElection] = useState<ElectionDetails | null>(null);

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

  useEffect(() => {
    const fetchElections = async () => {
      try {
        if (ElectionList) {
          const [electionIDs, electionNames, electionStatuses] = ElectionList;

          const elections = electionIDs.map((idHex: string, index: number) => ({
            electionID: hexToAscii(idHex),
            electionName: hexToAscii(electionNames[index]),
            electionStatus: getStatusString(electionStatuses[index]),
          }));

          setElections(elections);
        }
      } catch (error) {
        console.error("Error fetching elections:", error);
        setError("Error fetching elections");
      } finally {
        setLoading(false);
      }
    };

    if (orgID) {
      fetchElections();
    }
  }, [ElectionList, orgID]);

  const handleVoteClick = (e: React.MouseEvent, electionID: string) => {
    e.stopPropagation();
    setSelectedElectionID(electionID);
    setIsModalOpen(true);
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

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedElectionID("");
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
              <th className="py-2 px-4 bg-base-200 rounded-tr-xl">Action</th>
            </tr>
          </thead>
          <tbody className="cursor-pointer">
            {elections.map((election, index) => (
              <tr key={index} onClick={() => handleManageClick(election.electionID)}>
                <td className="py-2 px-4 border-b text-center">{election.electionID}</td>
                <td className="py-2 px-4 border-b text-center">{election.electionName}</td>
                <td className="py-2 px-4 border-b text-center">{election.electionStatus}</td>
                <td className="py-2 px-4 border-b text-center">
                  {election.electionStatus === "Ongoing" && (
                    <button className="btn btn-sm btn-primary" onClick={e => handleVoteClick(e, election.electionID)}>
                      Vote Now
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
          </div>
        )}
        {/* Modal Component */}
        <VoteModal isOpen={isModalOpen} onClose={closeModal} electionID={selectedElectionID} />
      </div>
    </section>
  );
};

export default VoterDashboard;
