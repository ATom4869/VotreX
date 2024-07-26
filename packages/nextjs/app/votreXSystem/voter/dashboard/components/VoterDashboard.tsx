import React, { useEffect, useState } from "react";
import VoteModal from "./VoteModal";
import { useWalletClient } from "wagmi";
import { hexToAscii as originalHexToAscii } from "web3-utils";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar, Cell, Pie, PieChart } from "recharts";
import "./Dashboard.css"
import { Hex } from "viem";

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
  startTime: bigint;
  endTime: bigint;
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

const VoterDashboard = () => {
  const { data: walletClient } = useWalletClient();
  const [orgID, setOrgID] = useState<string | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedElectionID, setSelectedElectionID] = useState<string>("");
  const [selectedElection, setSelectedElection] = useState<ElectionDetails | null>(null);
  const [electionResult, setElectionResult] = useState<ElectionResult | null>(null);


  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrgID(localStorage.getItem("orgID"));
    }
  }, [walletClient]);

  const COLORS = ['#C738BD', '#00b900', '#ffc658', '#ff7300', '#d0ed57', '#a4de6c', '#8884d8', '#8dd1e1'];

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
            const startTime = resultData[2];
            const endTime = resultData[3];
            const totalVoter = Number(resultData[4]);
            const electionIDHex = resultData?.[5] as Hex;
            const electionNameHex = resultData[6];
            const digitalSignatureHex = resultData[7].toString();
            const registeredOrganization = resultData[8];
            const electionWinner = resultData[9];
            const signedBy = resultData[10];
            const candidateIDs = candidateData[0] as number[];
            const candidateNames = candidateData[1] as string[];
            const candidateVoteCounts = candidateData[2]

            const candidates = candidateIDs.map((id: number, index: number) => ({
              candidateID: BigInt(id),
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
              digitalSignature: digitalSignatureHex,
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

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedElectionID("");
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000); // Convert seconds to milliseconds
    return date.toLocaleString('en-US', {
      weekday: 'long', // "Monday"
      year: 'numeric', // "2024"
      month: 'long', // "July"
      day: 'numeric', // "27"
      hour: 'numeric', // "10"
      minute: 'numeric', // "30"
      second: 'numeric', // "00"
    });
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
              <tr key={index} onClick={() => handleManageClick(election.electionID, election.electionStatus)}>
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
                      <span className="font-bold mr-2">No: {index + 1}</span>
                      <span className="mr-4">{name}</span>
                      <span className="text-left">Votes: {selectedElection.voteCounts[index]}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <ResponsiveContainer width="70%" height={300}>
                <BarChart
                  data={selectedElection.candidateNames.map((name, index) => ({
                    name: name,
                    votes: selectedElection.voteCounts[index],
                  }))}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 10,
                    bottom: 5,
                  }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="votes" fill="#AF47D2" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {electionResult && (
          <div className="bg-base-300 rounded-lg shadow-lg mt-10 p-10 mx-auto w-2/3">
            <h3 className="text-center text-xl font-bold mb-4">
              Election Result: {electionResult.electionName} - {electionResult.electionID}
            </h3>
            <p className="text-center text-lg font-regular mb-4">Total Voters: {electionResult.totalVoter}</p>
            <p className="text-center text-lg font-bold mb-4">Winner:</p>
            <h2 className="text-center text-md font-bold">{electionResult.electionWinner}</h2>
            <br />
            <h3 className="text-center font-bold font-lg">
              Start Time:
            </h3>
            <h3 className="text-center font-regular">
              {formatTimestamp(electionResult.startTime)}
            </h3>
            <h3 className="text-center font-bold font-lg">
              Finished Time:
            </h3>
            <h3 className="text-center">
              {formatTimestamp(electionResult.endTime)}
            </h3>
            <br />
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
            <h3 className="text-center">
              Signed By : {electionResult.signedBy}
            </h3>
            <br />
            <h3 className="text-center">
              Digital Signature : {(electionResult.digitalSignature)}
            </h3>
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="80%" height={400}>
                <PieChart>
                  <Pie
                    data={electionResult.candidates.map(candidate => ({
                      name: candidate.name,
                      value: candidate.voteCount,
                    }))}
                    dataKey="value"
                    outerRadius={150}
                    fill="#8884d8"
                    label
                  >
                    {electionResult.candidates.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    layout="horizontal"
                    align="center"
                    verticalAlign="bottom"
                    wrapperStyle={{ paddingTop: 10 }}
                  />
                </PieChart>
              </ResponsiveContainer>
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
