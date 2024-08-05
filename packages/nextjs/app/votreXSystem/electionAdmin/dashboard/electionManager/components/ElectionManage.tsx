"use client";

import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BarChart, Bar, ResponsiveContainer, Pie, PieChart, Tooltip, Legend, XAxis, YAxis, Cell } from "recharts";
import { Address, Hex } from "viem";
import { useWalletClient } from "wagmi";
import { hexToAscii as originalHexToAscii, soliditySha3 } from "web3-utils";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import jsPDF from 'jspdf';
import html2canvas from "html2canvas-pro";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPrint } from "@fortawesome/free-solid-svg-icons";
import { useSignTypedData } from "wagmi";


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
  totalParticipants: number;
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

const ElectionManage = () => {
  const { data: walletClient } = useWalletClient();
  const [orgID, setOrgID] = useState<string | null>(null);
  const [data, setData] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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
  const { signTypedData } = useSignTypedData();

  useEffect(() => {
    const checkAdminAddress = async () => {
      if (!walletClient || !VotreXContract) return;
      try {
        const currentAddress = walletClient.account.address;
        const userInfo = await VotreXContract.read.getUserInfo();
        const contractAdminAddress = userInfo?.[2];

        if (currentAddress !== contractAdminAddress) {
          window.location.href = "/votreXSystem/loginPage";
        } else {
          setIsAdmin(true);
        }
      } catch (err) {
        setError("Error during address check.");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAddress();
  }, [walletClient, VotreXContract]);

  useEffect(() => {
    if (orgID && isAdmin) {
      fetchData();
    }
  }, [isAdmin, orgID, adminAddress]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Error: {error}</p>
      </div>
    );
  }

  const COLORS = ['#C738BD', '#00b900', '#ffc658', '#ff7300', '#d0ed57', '#a4de6c', '#8884d8', '#8dd1e1'];

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
        const orgData = await VotreXContract?.read.organizationData([orgID as string]);
        const adminData = await VotreXContract?.read.admin([adminAddress as Address])
        const orgName = hexToAscii(orgData?.[6] as Hex);
        const dataHash = soliditySha3(
          { type: "string", value: orgName as string + selectedElection?.electionName + orgData?.[6] + adminData?.[6] }
        )

        try {
          await VOXCommand(
            {
              functionName: "finishElection",
              args: [electionID as string, dataHash as Hex],
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
          signTypedData({
            types: {
              Organization: [{ name: "orgData", type: "ElectionData" }],
              ElectionData: [
                { name: "orgName", type: "string" },
                { name: "electionName", type: "string" },
                { name: "adminName", type: "string" },
                { name: "adminAddress", type: "address" },
                { name: "contents", type: "string" },
              ],
            },
            primaryType: "Organization",
            message: {
              orgData: {
                orgName: orgName,
                electionName: electionResult?.electionName as string,
                adminName: electionResult?.signedBy as string,
                adminAddress: walletClient?.account.address as Address,
                contents: soliditySha3(
                  { type: "string", value: orgName as string + selectedElection?.electionName + orgData?.[6] + adminData?.[6] }
                ) as string,
              },
            },
          });
        } catch (error) {
          toast.error(`Error voting for candidate: ${error}`);
        }

      }
    } catch (error) {
      toast.error(`Error interacting with smart contract: ${error}`);
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
            const startTime = resultData[2];
            const endTime = resultData[3];
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
              digitalSignature: digitalSignatureHex.toString(),
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
              totalParticipants: Number(electionData[6]),
              electionStatus: getStatusString(electionData[7]),
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
          handleManageClick(selectedElection.electionID, "On Preparation");
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
      setSelectedCandidate(null);
      setVoxTokenValue(BigInt(0));
    } catch (error) {
      console.error("Error voting for candidate:", error);
    }
  };

  const centerText = (pdf: jsPDF, text: string, y: number, fontSize: number, fontStyle: 'normal' | 'bold' = 'normal') => {
    pdf.setFontSize(fontSize);
    pdf.setFont("helvetica", fontStyle);

    const textWidth = pdf.getStringUnitWidth(text) * fontSize / pdf.internal.scaleFactor;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const x = (pageWidth - textWidth) / 2;
    pdf.text(text, x, y);
  };

  const saveAsPDF = () => {
    const input = document.getElementById('pdf-content') as HTMLElement | null;
    const pieChart = document.querySelector('#pdf-content .recharts-responsive-container') as HTMLElement | null;
    const button = document.getElementById('save-pdf-button') as HTMLElement | null;
    const electionID = electionResult?.electionID;

    if (!input || !pieChart) return;

    if (button) {
      button.classList.add('hidden');
    }

    const originalStyles = {
      backgroundColor: input.style.backgroundColor,
      color: input.style.color,
    };

    input.style.backgroundColor = 'white';
    input.style.color = 'black';

    html2canvas(pieChart).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();

      let yOffset: number = 12;

      pdf.setFontSize(14);
      yOffset += 10;
      centerText(pdf, `Election Result: ${electionResult?.electionName ?? ''} - ${electionResult?.electionID ?? ''}`, yOffset, 14, 'bold');
      yOffset += 10;

      pdf.setFontSize(12);
      centerText(pdf, `Total Voters: ${electionResult?.totalVoter ?? ''}`, yOffset, 12);
      yOffset += 16;

      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      centerText(pdf, 'Winner:', yOffset, 13);
      yOffset += 8;

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bolditalic");
      centerText(pdf, `${electionResult?.electionWinner ?? ''}`, yOffset, 16);
      yOffset += 20;

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      centerText(pdf, 'Start Time:', yOffset, 14);
      yOffset += 8;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      centerText(pdf, formatTimestamp(electionResult?.startTime as bigint), yOffset, 12);
      yOffset += 16;

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      centerText(pdf, 'Finished Time:', yOffset, 14);
      yOffset += 8;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      centerText(pdf, formatTimestamp(electionResult?.endTime as bigint), yOffset, 12);
      yOffset += 16;

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      centerText(pdf, 'Candidates:', yOffset, 14);
      yOffset += 8;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");

      const candidatesText = electionResult?.candidates.map((candidate, index) =>
        `No: ${index + 1} ${candidate.name} Votes: ${candidate.voteCount}`
      ).join('\n');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const lineHeight = 12;
      let candidatesY = yOffset;

      candidatesText?.split('\n').forEach(line => {
        const textWidth = pdf.getStringUnitWidth(line) * 12 / pdf.internal.scaleFactor;
        const x = (pageWidth - textWidth) / 2 - 2;
        pdf.text(line, x, candidatesY);
        candidatesY += lineHeight;
      });

      yOffset = candidatesY + 10;

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      centerText(pdf, `Signed By: ${electionResult?.signedBy ?? ''}`, yOffset, 14);
      yOffset += 16;

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      centerText(pdf, 'Digital Signature:', yOffset, 14);
      yOffset += 8;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      centerText(pdf, `${electionResult?.digitalSignature?.toString() ?? ''}`, yOffset, 12);
      yOffset += 10;

      const imgWidth = 100;
      const imgHeight = canvas.height * imgWidth / canvas.width; // Maintain aspect ratio
      const xOffset = (pdf.internal.pageSize.getWidth() - imgWidth) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);

      pdf.save(`${electionID}-election-results.pdf`);

      // Restore original styles
      input.style.backgroundColor = originalStyles.backgroundColor;
      input.style.color = originalStyles.color;

      if (button) {
        button.classList.remove('hidden');
      }
    });
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

  // const handleAddSignature = async () => {
  //   try {
  //     const orgData = await VotreXContract?.read.organizationData([orgID as string]);
  //     const orgName = hexToAscii(orgData?.[6] as Hex);
  //     const adminData = await VotreXContract?.read.admin([adminAddress as Address])
  //     const computedSig = soliditySha3(
  //       { type: "string", value: orgName as string + selectedElection?.electionName + orgData?.[6] + adminData?.[6] }
  //     )
  //     setComputedSignature(computedSig as HexString);
  //   } catch (error) {
  //     console.error("Error computing signature:", error);
  //   }
  // };

  if (isAdmin) {
    return (
      <section className="section-3 m-4">
        <ToastContainer />
        <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 flex flex-col mt-10 relative p-12">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="h-[2.4rem] w-[8.5rem] bg-base-300 rounded-[22px] py-[0.65rem] shadow-lg shadow-base-300 flex items-center justify-center">
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
              <p className="text-center text-xl font-regular mb-4">
                Total Participants: {selectedElection.totalParticipants}
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
                        className="input input-bordered input-sm w-full mr-2 max-w-xs"
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
                          <span className="">{name}</span>
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
                  {selectedElection && selectedElection.voteCounts.some((count) => count > 0) && (
                    <ResponsiveContainer width="80%" height={300} className={"mx-auto"}>
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
                        <Legend className="mx-auto" />
                        <Bar
                          dataKey="votes"
                          radius={5}
                          fill="#AF47D2"
                          className="flex mx-auto justify-center"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </form>
              )}
            </div>
          )}

          {electionResult && (
            <div id="pdf-content" className="bg-base-300 rounded-lg shadow-lg mt-10 p-10 mx-auto w-2/3">
              <h3 className="text-center text-xl font-bold mb-4">
                Election Result: {electionResult.electionName} - {electionResult.electionID}
              </h3>
              {/* <button onClick={handleAddSignature} className="btn btn-secondary mt-3 justify-center">
              <h2>Add Signature</h2>
            </button> */}
              <p className="text-center text-lg font-regular mb-4">Total Voters: {electionResult.totalVoter}</p>
              <p className="text-center text-lg font-regular mb-4">Winner:</p>
              <h2 className="text-center">{electionResult.electionWinner}</h2>
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
              <h3 className="text-center font-bold font-lg">Digital Signature :</h3>
              <h4 className="text-center font-medium">{(electionResult.digitalSignature)}</h4>
              {/* {computedSignature && (
              <div className="mt-4">
                <h3 className="text-center font-bold font-lg">Computed Signature:</h3>
                <h4 className="text-center font-medium">{computedSignature}</h4>
              </div>
            )} */}
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

              <div className="flex justify-center mt-4">
                <button id="save-pdf-button" onClick={saveAsPDF} className="bg-green-500 text-white px-4 py-2 rounded">
                  <FontAwesomeIcon icon={faPrint} size="sm" />
                </button>
              </div>
            </div>
          )}

        </div>
      </section >
    );
  };
};

export default ElectionManage;
