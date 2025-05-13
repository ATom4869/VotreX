"use client";

import React, { useEffect, useState } from "react";
import { faPrint } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import html2canvas from "html2canvas-pro";
import jsPDF from 'jspdf';
import { ToastContainer, toast } from "react-toastify";
import { useWalletClient } from "wagmi";
import encoderPacked from "./encoderPacked";
import "react-toastify/dist/ReactToastify.css";
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Address, Hex } from "viem";
import { hexToAscii as originalHexToAscii, soliditySha3 } from "web3-utils";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useSignTypedData } from "wagmi";
import BackBtn from "~~/app/main/loginPage/component/BackBtn";
import HomeBtn from "~~/app/main/loginPage/component/homeButton";
import AddCandidateModal from "../../components/AddCandidateModal";
import { ElectionDetails, ElectionResult, useElectionStore } from "~~/app/main/stores/electionStores";


const ElectionManage = () => {
  const { data: walletClient } = useWalletClient();
  const [orgID, setOrgID] = useState<string | null>(null);
  const [selectedRadioCandidate, setSelectedRadioCandidate] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isAddCandidateModalOpen, setIsAddCandidateModalOpen] = useState(false);
  const [hasVotedCheck, setHasVotedCheck] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [countdown, setCountdown] = useState<number>(3);

  const {
    candidateName,
    setCandidateName,
    electionOverviewData,
    setelectionOverviewData,
    selectedElection,
    setSelectedElection,
    setPassedCandidates,
    electionResult,
    setElectionResult,
  } = useElectionStore();

  const adminAddress = walletClient?.account.address;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrgID(localStorage.getItem("orgID"));
    }
  }, [walletClient]);


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

  const { data: VotreXContract } = useScaffoldContract({
    contractName: "TestCompleXA2C",
    walletClient,
  });

  const { data: orgDataFetch } = useScaffoldReadContract({
    contractName: "TestCompleXA2C",
    functionName: "organizationData",
    args: [orgID as string],
  });

  const { data: ElectionList } = useScaffoldReadContract({
    contractName: "TestCompleXA2C",
    functionName: "getElectionListInOrg",
    args: [orgID as string],
    account: walletClient?.account.address
  });

  const { data: electionDetail } = useScaffoldReadContract({
    contractName: "TestCompleXA2C",
    functionName: "getElectionInfo",
    args: [selectedElection?.electionID],
  });

  const { data: userInfo } = useScaffoldReadContract({
    contractName: "TestCompleXA2C",
    functionName: "getUserInfo",
    account: walletClient?.account.address,
  });

  const { data: votedChecker } = useScaffoldReadContract({
    contractName: "TestCompleXA2C",
    functionName: "isVoterChecked",
    args: [selectedElection?.electionID as string],
    account: walletClient?.account.address
  });

  const { writeContractAsync: VOXCommand } = useScaffoldWriteContract("TestCompleXA2C");
  const { signTypedData } = useSignTypedData();

  const getElectionMode = (mode: boolean) => {
    switch (mode) {
      case true:
        return "Mode Kandidat Diketahui";
      case false:
        return "Mode Kandidat Bebas";
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedOrgID = localStorage.getItem("orgID");
      setOrgID(storedOrgID);

      const contractAdminAddress = orgDataFetch?.[1] as Address;
      if (adminAddress === contractAdminAddress) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    }
  }, [orgDataFetch, adminAddress]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCheckingAccess(false);
    }, 1100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAdmin === false) {
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      const timeout = setTimeout(() => {
        window.location.href = "/login";
      }, 5000);

      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
  }, [isAdmin]);

  useEffect(() => {
    if (orgID) {
      const electionData = ElectionList
      const candidateList = selectedElection?.candidateNames
      const fetchData = () => {
        try {
          const electionIDs = ElectionList?.[0] || [];
          const electionNames = ElectionList?.[1] || [];
          const electionStatuses = ElectionList?.[2] || [];
          const waveNumber = electionDetail?.[2];

          const elections = electionIDs.map((idHex: string, index: number) => {
            const electionID = hexToAscii(idHex);
            const electionName = hexToAscii(electionNames[index]);
            const electionStatus = getStatusString(electionStatuses[index]);

            return {
              electionID,
              electionName,
              electionStatus,
              waveNumber
            };
          });

          setelectionOverviewData(elections);


        } catch (error) {
        }
      };
      fetchData();
    }
  }, [ElectionList, orgID, adminAddress, candidateName, userInfo]);

  const COLORS = ["#C738BD", "#00b900", "#ffc658", "#ff7300", "#d0ed57", "#a4de6c", "#8884d8", "#8dd1e1"];

  const hexToAscii = (hex: string): string => {
    const ascii = originalHexToAscii(hex);
    return ascii.replace(/\0/g, "").trim();
  };

  const getStatusString = (status: number) => {
    switch (status) {
      case 0:
        return "Dalam Persiapan";
      case 1:
        return "Sedang Berjalan";
      case 2:
        return "Babak Final";
      case 3:
        return "Pemilihan Selesai";
      default:
        return "Unknown";
    }
  };

  const getElectionStatus = (status: string) => {
    if (status === "Dalam Persiapan") {
      return "Mulai Pemilihan";
    } else if (status === "Sedang Berjalan" || status === "Babak Final") {
      return "Hentikan Pemilihan";
    } else {
      return "Unknown";
    }
  };

  const handleElectionButtonClick = async (
    e: React.MouseEvent,
    electionID: string,
    status: string,
  ) => {
    e.stopPropagation();
    try {
      if (status === "Dalam Persiapan") {
        try {
          console.log("Starting Election:", electionID);
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
            }
          );
        } catch (error) {
          toast.error(`Error starting election: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else if (status === "Sedang Berjalan" || status === "Babak Final") {
        const orgData = await VotreXContract?.read.organizationData([orgID as string]);
        const adminData = await VotreXContract?.read.admin([adminAddress as Address]);
        const orgName = hexToAscii(orgData?.[6] as Hex);
        const totalVotes = selectedElection?.voteCounts.reduce((sum, count) => sum + count, 0) as number;
        const numCandidates = selectedElection?.candidateNames.length as number;
        const thresholdPass = Math.ceil(totalVotes / numCandidates) as number;

        const candidates = selectedElection?.candidateNames.map((name, index) => ({
          electionID: electionID,
          candidateID: Number(selectedElection.candidateIDs[index]),
          candidateName: name,
          voteCount: selectedElection.voteCounts[index],
        })) || [];

        const passingCandidates = candidates.filter(candidate => candidate.voteCount > thresholdPass);

        if (passingCandidates.length === 0) {
          toast.error("Tidak ada kandidat yang lolos threshold. Pemilu tidak dapat diselesaikan.");
          return;
        }

        setPassedCandidates(passingCandidates);

        const dataHash = soliditySha3({
          type: "string",
          value: orgName + selectedElection?.electionName + orgData?.[7] + adminData?.[6],
        });

        try {
          await VOXCommand(
            {
              functionName: "finishElection",
              args: [electionID as string, dataHash as Hex, BigInt(thresholdPass) as bigint],
            },
            {
              onBlockConfirmation: txnReceipt => {
                checkElectionStatus(electionID, txnReceipt.cumulativeGasUsed);
              },
            }
          );
          if (status === "Babak Final") {

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
                  contents: dataHash as string,
                },
              },
            });
          }
        } catch (error) {
        }
      }
    } catch (error) {
    }
  };

  async function checkElectionStatus(electionId: string, gasUsed: bigint) {
    try {
      const packedElectionID = encoderPacked(electionId) as Hex;
      const electionInfo = await VotreXContract?.read.electionInfo([packedElectionID]);

      if (electionInfo) {
        const status = parseInt(electionInfo?.[0].toString());
        const waveNumber = parseInt(electionInfo?.[10].toString());
        const isFinished = electionInfo?.[2];
        const previousWave = selectedElection?.waveNumber || 0;

        if (isFinished) {
          toast.success(`Pemilihan Berhasil Diselesaikan: ${electionId} - ${gasUsed}`, {
            autoClose: 3000,
            onClose: () => {
              window.location.reload();
            },
          });
        } else if (waveNumber > previousWave) {
          toast.info("Pemilu dilanjutkan ke tahap berikutnya. Kandidat dengan suara di bawah threshold dieliminasi.", {
            autoClose: 3000,
            onClose: () => {
              window.location.reload();
            },
          });
        } else {
          toast.info(`Status pemilu telah diperbarui: ${getStatusString(status)}`, {
            autoClose: 3000,
            onClose: () => {
              window.location.reload();
            },
          });
        }
      }
    } catch (error) {
      console.error("Error checking election status:", error);
      window.location.reload();
    }
  }


  const handleElectionTable = async (electionID: string, status: string) => {

    if (selectedElection?.electionID === electionID && status === "Dalam Persiapan") {
      setSelectedElection(null);
    } else if (selectedElection?.electionID === electionID && status === "Sedang Berjalan") {
      setSelectedElection(null);
    } else if (electionResult?.electionID === electionID && status === "Pemilihan Selesai") {
      setElectionResult(null);
    } else {
      try {
        if (status === "Pemilihan Selesai") {
          const resultData = await VotreXContract?.read.electionResults([electionID]);
          const candidateData = await VotreXContract?.read.getCandidateResult([electionID])
          if (resultData && candidateData) {
            const isPruned = resultData[0];
            const adminAddress = resultData[1];
            const waveNumber = Number(resultData[2]);
            const startTime = resultData[3];
            const endTime = resultData[4];
            const totalVoter = Number(resultData[5]);
            const electionIDHex = resultData?.[6] as Hex;
            const electionNameHex = resultData[7];
            const digitalSignatureHex = resultData[8];
            const registeredOrganization = resultData[9];
            const electionWinner = resultData[10];
            const signedBy = resultData[11];
            const candidateIDs = candidateData[0] as number[];
            const candidateNames = candidateData[1] as string[];
            const candidateVoteCounts = candidateData[2]

            const candidates = candidateIDs.map(
              (id: number, index: number) => ({
                candidateID: BigInt(id),
                name: candidateNames[index].replace(/\0/g, "").trim(),
                voteCount: Number(candidateVoteCounts[index]),
              })
            )

            const electionResult: ElectionResult = {
              isPruned,
              adminAddress,
              waveNumber,
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
            }
            setElectionResult(electionResult);


          }
          setSelectedElection(null);
        } else {
          const electionData = await VotreXContract?.read.getElectionInfo([electionID]);
          if (electionData) {
            const electionDetails: ElectionDetails = {
              electionID: hexToAscii(electionData[0]),
              electionName: electionData[1].replace(/\0/g, "").trim(),
              waveNumber: Number(electionData[2]),
              totalCandidates: Number(electionData[3]),
              candidateIDs: electionData[4].map((id: any) => BigInt(id)),
              candidateNames: [...electionData[5]],
              voteCounts: electionData[6].map((count: any) => Number(count)),
              totalParticipants: Number(electionData[7]),
              electionStatus: getStatusString(electionData[8]),
              electionMode: getElectionMode(electionData[9]),
              candidateLimit: Number(electionData[10]),
            };
            setSelectedElection(electionDetails);
            console.log("Raw electionData[3]:", electionData[3]);
            console.log("Election Details:", {
              totalCandidates: electionDetails.totalCandidates,
              currentCandidates: electionDetails.candidateIDs.length,
              candidateLimit: electionDetails.candidateLimit,
            });

            const hasVotedChecks = await VotreXContract?.read.isVoterChecked([selectedElection?.electionID as string]);
            setHasVotedCheck(hasVotedChecks as boolean)
          }
          setElectionResult(null);
        }
      } catch (error) {
        toast.error("Error fetching data");
      }
    }
  };

  const handleVoteClick = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedElection) {
      toast.error("Pemilihan tidak valid!");
      return;
    }

    const isModeHaveCandidate = selectedElection.electionMode === "Mode Kandidat Diketahui";

    let chosenCandidateID: number | null = null;
    let chosenCandidateName: string | null = null;

    if (isModeHaveCandidate) {
      if (!selectedRadioCandidate) {
        toast.error("Pilih kandidat terlebih dahulu!");
        return;
      }
      chosenCandidateID = parseInt(selectedRadioCandidate, 10);
      chosenCandidateName = "";
    } else {
      if (selectedElection.waveNumber === 1) {
        if (!candidateName.trim()) {
          toast.error("Masukkan nama kandidat!");
          return;
        }
        chosenCandidateID = 0;
        chosenCandidateName = candidateName.trim();
      } else {
        if (!selectedRadioCandidate) {
          toast.error("Pilih kandidat terlebih dahulu!");
          return;
        }
        chosenCandidateID = 0;
        chosenCandidateName = selectedRadioCandidate;
      }
    }

    try {
      await VOXCommand(
        {
          functionName: "vote",
          args: [selectedElection.electionID, chosenCandidateID, chosenCandidateName, isModeHaveCandidate],
        },
        {
          onBlockConfirmation: (txnReceipt) => {
            toast.success(
              `Berhasil memilih: ${chosenCandidateName || "Candidate ID: " + chosenCandidateID}, Gas Used: ${txnReceipt.cumulativeGasUsed}`, {
              autoClose: 3000,
              onClose: () => {
                setCandidateName("");
                setSelectedRadioCandidate(null);
              },
            });
          },
        }
      );
    } catch (error) {

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
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();

      let yOffset = 12;

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      centerText(
        pdf,
        `Hasil Pemilihan: ${electionResult?.electionName ?? ' '} - ${electionResult?.electionID ?? ''}`,
        yOffset,
        14
      );
      yOffset += 12;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      centerText(pdf, `Jumlah Partisipan: ${electionResult?.totalVoter ?? ''}`, yOffset, 12);
      yOffset += 12;

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      centerText(pdf, 'Pilihan Tertinggi:', yOffset, 14);
      yOffset += 12;

      pdf.setFontSize(17);
      pdf.setFont("helvetica", "bold");
      centerText(pdf, `${electionResult?.electionWinner ?? ''}`, yOffset, 17);
      yOffset += 20;

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      centerText(pdf, 'Waktu Mulai Pemilihan:', yOffset, 14);
      yOffset += 12;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      centerText(pdf, formatTimestamp(electionResult?.startTime as bigint), yOffset, 12);
      yOffset += 12;

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      centerText(pdf, 'Waktu Pemilihan Selesai:', yOffset, 14);
      yOffset += 12;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      centerText(pdf, formatTimestamp(electionResult?.endTime as bigint), yOffset, 12);
      yOffset += 18;

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      centerText(pdf, "Perolehan Suara Kandidat:", yOffset, 14);
      yOffset += 12;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");

      const candidatesText = electionResult?.candidates
        .map((candidate, index) => `No: ${index + 1} ${candidate.name} Jumlah Suara: ${candidate.voteCount}`)
        .join("\n");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const lineHeight = 10;
      let candidatesY = yOffset;

      candidatesText?.split('\n').forEach(line => {
        const textWidth = pdf.getStringUnitWidth(line) * 12 / pdf.internal.scaleFactor;
        const x = (pageWidth - textWidth) / 2;
        pdf.text(line, x, candidatesY);
        candidatesY += lineHeight;
      });

      yOffset = candidatesY + 10;

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      centerText(pdf, `Jumlah Gelombang: ${electionResult?.waveNumber ?? ''}`, yOffset, 14);
      yOffset += 14;

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      centerText(pdf, `Ditandatangani oleh:`, yOffset, 14);
      yOffset += 12;

      pdf.setFontSize(15);
      pdf.setFont("helvetica", "bold");
      centerText(pdf, `${electionResult?.signedBy ?? ''}`, yOffset, 15);
      yOffset += 14;

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      centerText(pdf, 'Tanda tangan Digital:', yOffset, 14);
      yOffset += 12;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      centerText(pdf, `${electionResult?.digitalSignature?.toString() ?? ''}`, yOffset, 12);
      yOffset += isMobile ? 13 : 10;

      const imgWidth = isMobile ? 50 : 110;;
      const imgHeight = (canvas.height / 3) * imgWidth / (canvas.width / 2)
      const xOffset = (pdf.internal.pageSize.getWidth() - imgWidth) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
      pdf.save(isMobile ? `${electionID}-election-results-mobile.pdf` : `${electionID}-election-results.pdf`);

      input.style.backgroundColor = originalStyles.backgroundColor;
      input.style.color = originalStyles.color;

      if (button) {
        button.classList.remove('hidden');
      }
    });
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hourCycle: 'h23'
    });
  };

  useEffect(() => {
    if (selectedElection) {
      console.log("Debug Values:", {
        totalCandidates: selectedElection.totalCandidates,
        currentCandidatesLength: selectedElection.candidateIDs.length,
        candidateIDs: selectedElection.candidateIDs
      });
    }
  }, [selectedElection]);


  return (
    <>
      {isCheckingAccess ? (
        <p className=" flex justify-center text-center font-medium text-white-600 mt-6">
          Memuat Data ...
        </p>
      ) : isAdmin === true ? (
        < div className="flex flex-col pt-8 px-12 mx-24 pb-12 mt-12 w-full bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 justify-center mx-auto" >
          <ToastContainer />
          <div className="flex items-center justify-center bg-base-300 rounded-[22px] py-[0.65rem] px-8 shadow-lg shadow-base-300">
            <h3 className="text-md font-bold">Daftar Pemilihan</h3>
          </div>
          <div className="flex mt-12">
            <BackBtn buttonLabel={"Kembali"} />
            {isMobile && (
              <HomeBtn buttonLabel={"Kembali ke Beranda"} linkDest={"/"} />
            )}
            <br />
          </div>
          <div className="p-5 divide-y divide-base-300"></div>
          <div className="overflow-x-auto">
            <table className="table-auto w-full">
              <thead>
                <tr>
                  <th className="py-2 px-4 bg-base-200 text-sm md:text-md rounded-tl-xl">ID Pemilihan</th>
                  <th className="py-2 px-4 bg-base-200 text-sm md:text-md">Nama Pemilihan</th>
                  <th className="py-2 px-4 bg-base-200 text-sm md:text-md">Status</th>
                  <th className="py-2 px-4 bg-base-200 text-sm md:text-md rounded-tr-xl">Atur</th>
                </tr>
              </thead>
              <tbody className="cursor-pointer">
                {electionOverviewData.length === undefined || electionOverviewData.length === null ? (
                  <tr>
                    <td colSpan={4} className="py-3 px-6 border-b text-center">
                      Loading Data...
                    </td>
                  </tr>
                ) : electionOverviewData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-3 px-6 border-b text-center">
                      Tidak ada Pemilihan ditemukan.
                    </td>
                  </tr>
                ) : (
                  electionOverviewData.map((election, index) => (
                    <tr
                      key={index}
                      onClick={() => handleElectionTable(election.electionID, election.electionStatus)}
                      className={selectedElection?.electionID === election.electionID ? "bg-accent" : ""}
                    >
                      <td className="py-2 px-4 border-b text-center text-sm md:text-md">
                        {election.electionID}
                      </td>
                      <td className="py-2 px-4 border-b text-center text-sm md:text-md">
                        {election.electionName}
                      </td>
                      <td className="py-2 px-4 border-b text-center text-sm md:text-md">
                        {election.electionStatus}
                      </td>
                      <td className="py-2 px-4 border-b text-center text-sm md:text-md">
                        {election.electionStatus !== "Pemilihan Selesai" && (
                          <button
                            className={`btn btn-sm ${election.electionStatus === "Sedang Berjalan" ? "btn-error" : "btn-primary"}`}
                            onClick={(e) =>
                              handleElectionButtonClick(e, election.electionID, election.electionStatus)
                            }
                          >
                            {getElectionStatus(election.electionStatus)}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {
            selectedElection && (
              <div className="bg-base-300 rounded-lg shadow-lg mt-10 p-12 mx-auto w-full">
                {/* Detail Pemilihan */}
                <h3 className="text-center text-xl font-bold mb-4">
                  {selectedElection.electionName} - {selectedElection.electionID}
                </h3>
                <p className="text-center text-xl font-regular mb-4">
                  Jumlah Kandidat: {selectedElection.totalCandidates}
                </p>
                <p className="text-center text-xl font-regular mb-4">
                  Jumlah Partisipan: {selectedElection.totalParticipants}
                </p>
                <p className="text-center text-xl font-regular mb-4">Mode: {selectedElection.electionMode}</p>
                <h3 className="text-center text-lg font-medium">Daftar Kandidat: </h3>
                <div className="flex justify-center">
                  <ul className="text-left mb-4">
                    {selectedElection.candidateNames.map((name, index) => (
                      <li key={index} className="mb-2">
                        <div>
                          <span className="font-bold mr-2">No: {index + 1}</span>
                          <span className="mr-4">{name}</span>
                          <span className="text-left">Jumlah Suara: {selectedElection.voteCounts[index]}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                {selectedElection.electionStatus === "Dalam Persiapan" &&
                  selectedElection.electionMode === "Mode Kandidat Diketahui" &&
                  selectedElection.totalCandidates < selectedElection.candidateLimit &&
                  (
                    <div className="flex justify-center items-center">
                      <button
                        onClick={() => setIsAddCandidateModalOpen(true)}
                        className="btn btn-secondary p-21 mt-3"
                      >
                        Tambah Kandidat
                      </button>
                    </div>
                  )}

                {/* Add Candidate Modal */}
                {isAddCandidateModalOpen && (
                  <AddCandidateModal
                    isOpen={isAddCandidateModalOpen}
                    onClose={() => setIsAddCandidateModalOpen(false)}
                    electionID={selectedElection.electionID}
                  />
                )}

                {selectedElection && selectedElection.electionStatus === "Sedang Berjalan" && (
                  <div className="flex flex-col">
                    {/* Detail Pemilihan */}
                    <h3 className="text-center text-xl font-bold mb-4">
                      {selectedElection.electionName} - {selectedElection.electionID}
                    </h3>
                    <p className="text-center text-lg font-bold mb-4">
                      Gelombang ke: {selectedElection?.waveNumber}
                    </p>
                    <p className="text-center text-xl font-regular mb-4">
                      Jumlah Kandidat: {selectedElection.totalCandidates}
                    </p>
                    <p className="text-center text-xl font-regular mb-4">
                      Jumlah Partisipan: {selectedElection.totalParticipants}
                    </p>
                    <hr />

                    {/* Tampilkan Threshold */}
                    <div className="p-4 rounded-lg mt-4">
                      <h4 className="text-lg sm:text-lg font-bold text-center">Threshold Kandidat</h4>
                      <ul className="flex flex-row justify-center text-left mt-4">
                        {selectedElection.candidateNames.map((name, index) => {
                          const totalVotes = selectedElection.voteCounts.reduce((sum, votes) => sum + votes, 0);
                          const threshold = Math.ceil(totalVotes / selectedElection.candidateNames.length);
                          const isAboveThreshold = selectedElection.voteCounts[index] > threshold;

                          return (
                            <li key={index} className="justify-center mr-4 mb-2">
                              <ul className="text-left mb-4">
                                <span className="font-bold mr-2">{name}:</span>
                                <br />
                                <span className="mr-2">Threshold: {threshold.toFixed(2)}</span>
                                <br />
                                <span className={`font-bold ${isAboveThreshold ? "text-green-600" : "text-red-600"}`}>
                                  {isAboveThreshold ? "Lolos" : "Tidak Lolos"}
                                </span>
                              </ul>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* Voting UI */}
                    {votedChecker === undefined ? (
                      <p className="text-center font-medium text-gray-600 mt-6">Memeriksa status suara...</p>
                    ) : votedChecker === false ? (
                      <form onSubmit={handleVoteClick} className="mt-6">
                        {selectedElection.waveNumber === 1 ? (
                          selectedElection.electionMode === "Mode Kandidat Diketahui" ? (
                            <div>
                              <label className="block text-center font-medium mb-2">Pilih Kandidat:</label>
                              <div className="flex flex-col justify-center items-center">
                                {selectedElection.candidateNames.map((name, index) => (
                                  <div className="flex justify-center pr-12">
                                    <label key={index} className="flex text-center items-center mx-auto mb-2">
                                      <input
                                        type="radio"
                                        value={index.toString()}
                                        name="candidate"
                                        checked={selectedRadioCandidate === index.toString()}
                                        onChange={(e) => setSelectedRadioCandidate(e.target.value)}
                                        className="radio radio-accent mr-2"
                                      />
                                      <span className="w-48">{name}</span>
                                    </label>
                                  </div>

                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <br />
                              <label className="text-center font-medium mb-1">Masukkan Nama Kandidat:
                                <input
                                  type="text"
                                  placeholder="Masukkan nama kandidat"
                                  value={candidateName}
                                  onChange={(e) => setCandidateName(e.target.value)}
                                  className="flex justify-center input input-bordered mx-auto w-full"
                                />
                              </label>
                            </div>
                          )
                        ) : (
                          <div>
                            <p className="text-center text-sm">Gunakan Radio Button untuk memilih kandidat yang lolos.</p>
                            <label className="block text-center font-medium mb-2">Pilih Kandidat:</label>
                            <div className="flex flex-col items-start">
                              {selectedElection.candidateNames.map((name, index) => (
                                <label key={index} className="flex items-center mx-auto mb-2">
                                  <input
                                    type="radio"
                                    value={selectedElection.electionMode === "Mode Kandidat Diketahui"
                                      ? index.toString()
                                      : name}
                                    name="candidate"
                                    checked={selectedElection.electionMode === "Mode Kandidat Diketahui"
                                      ? selectedRadioCandidate === index.toString()
                                      : selectedRadioCandidate === name}
                                    onChange={(e) => setSelectedRadioCandidate(e.target.value)}
                                    className="radio radio-accent mr-2"
                                  />
                                  <span className="w-48">{name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-center mt-3">
                          <button type="submit" className="btn btn-primary">Pilih Sekarang</button>
                        </div>

                      </form>
                    ) : (
                      <div>
                        <p className="text-center font-medium text-red-600 mt-6">
                          Anda sudah memberikan suara dalam pemilihan ini.
                        </p>
                        {selectedElection && selectedElection.voteCounts.some((count) => count > 0) && (
                          <div className="flex flex-wrap justify-center items-center">
                            <ResponsiveContainer width={isMobile ? "100%" : "40%"} height={isMobile ? 300 : 400}>
                              <BarChart
                                data={selectedElection.candidateNames.map((name, index) => ({
                                  name: name,
                                  votes: selectedElection.voteCounts[index],
                                }))}
                                margin={{
                                  top: 20,
                                  left: -20,
                                  bottom: 30,
                                }}
                              >
                                <XAxis dataKey="name" interval={0} tick={{ fontSize: isMobile ? 10 : 12 }} />
                                <YAxis />
                                <Tooltip />
                                <Legend verticalAlign={isMobile ? "bottom" : "top"}
                                  wrapperStyle={{
                                    position: "relative",
                                    marginTop: isMobile ? "15px" : "0",
                                    marginLeft: "40px",
                                    marginBottom: isMobile ? "0" : "30px",
                                    textAlign: isMobile ? "center" : "inherit",
                                  }}
                                  align="center"
                                  layout={isMobile ? "vertical" : "horizontal"}
                                />
                                <Bar
                                  dataKey="votes"
                                  radius={5}
                                  fill="#7340FF"
                                  barSize={isMobile ? 25 : 130}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>

                    )}

                  </div>
                )}

              </div>
            )
          }


          {electionResult && (
            <div id="pdf-content" className={isMobile ? "bg-base-300 rounded-lg shadow-lg mt-10 p-10 mx-auto w-full" : "bg-base-300 rounded-lg shadow-lg mt-10 p-10 mx-auto w-2/3"}>
              <h3 className="text-center text-xl font-bold mb-4">
                Hasil Pemilihan: {electionResult.electionName} - {electionResult.electionID}
              </h3>
              <p className="text-center text-lg font-regular mb-4">Jumlah Pemilih: {electionResult.totalVoter}</p>
              <p className="text-center text-lg font-regular mb-4">Pemenang:</p>
              <h2 className="text-center">{electionResult.electionWinner}</h2>
              <br />
              <h3 className="text-center font-bold font-lg">
                Waktu Mulai Pemilihan:
              </h3>
              <h3 className="text-center font-regular">
                {formatTimestamp(electionResult.startTime)}
              </h3>
              <h3 className="text-center font-bold font-lg">
                Waktu Selesai Pemilihan:
              </h3>
              <h3 className="text-center">
                {formatTimestamp(electionResult.endTime)}
              </h3>
              <br />
              <h3 className="text-center text-lg font-medium">-Kandidat-</h3>
              <div className="flex justify-center">
                <ul className="text-left mb-4">
                  {electionResult.candidates.map((candidate, index) => (
                    <li key={index} className="mb-2">
                      <div>
                        <span className="font-bold mr-2">No: {index + 1}</span>
                        <span className="mr-4">{candidate.name}</span>
                        <span className="text-left">Jumlah Suara: {candidate.voteCount}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <h3 className="text-center">
                Jumlah Gelombang : {electionResult.waveNumber}
              </h3>
              <br />
              <h3 className="text-center">
                Ditanda tangani oleh :
                <br />
                {electionResult.signedBy}
              </h3>
              <br />
              <h3 className="text-center font-bold font-lg">Tanda tangan Digital :</h3>
              <h4 className="text-center font-medium overflow-x-auto">{(electionResult.digitalSignature)}</h4>
              <div className="flex flex-col items-center">
                <ResponsiveContainer width={isMobile ? "80%" : "100%"} height={isMobile ? 300 : 400}>
                  <PieChart>
                    <Pie
                      data={electionResult.candidates.map(candidate => ({
                        name: candidate.name,
                        value: candidate.voteCount,
                      }))}
                      dataKey="value"
                      outerRadius={isMobile ? 50 : 150}
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
                      wrapperStyle={{ paddingTop: 10 }} />
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

        </div >
      ) : (
        <div className="flex flex-col items-center justify-center h-screen">
          <h2 className="text-2xl font-bold text-red-600">Akses Ditolak</h2>
          <p className="text-lg text-white-700 mt-2">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          <p className="text-md font-semibold mt-4">
            Mengalihkan ke halaman login dalam <span className="text-yellow-500">{countdown}</span> detik...
          </p>
        </div>
      )}
    </>
  );
};

export default ElectionManage;
