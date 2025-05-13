import React, { useEffect, useState } from "react";
import VoteModal from "./VoteModal";
import { useWalletClient } from "wagmi";
import { hexToAscii as originalHexToAscii } from "web3-utils";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar, Cell, Pie, PieChart } from "recharts";
import "./Dashboard.css"
import { Address, Hex } from "viem";
import { decryptBirthDate } from "~~/components/BirthDateHandler";
import { ElectionDetails, ElectionResult, useElectionStore } from "~~/app/main/stores/electionStores";

const VoterDashboard = () => {
  const { data: walletClient } = useWalletClient();
  const [orgID, setOrgID] = useState<string | null>(null);
  const [voterData, setVoterData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedElectionID, setSelectedElectionID] = useState<string>("");
  const [isMobile, setIsMobile] = useState(false);
  const {
    electionOverviewData,
    setelectionOverviewData,
    selectedElection,
    setSelectedElection,
    electionResult,
    setElectionResult,
  } = useElectionStore();


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

  const COLORS = ['#C738BD', '#00b900', '#ffc658', '#ff7300', '#d0ed57', '#a4de6c', '#8884d8', '#8dd1e1'];
  const voterAddress = walletClient?.account.address;

  const { data: VotreXContract } = useScaffoldContract({
    contractName: "TestCompleXA2C",
    walletClient,
  });

  const { data: ElectionList } = useScaffoldReadContract({
    contractName: "TestCompleXA2C",
    functionName: "getElectionListInOrg",
    args: [orgID as string],
  });

  const { data: electionDetail } = useScaffoldReadContract({
    contractName: "TestCompleXA2C",
    functionName: "getElectionInfo",
    args: [selectedElection?.electionID],
  });

  const { data: voterDataFetch } = useScaffoldReadContract({
    contractName: "TestCompleXA2C",
    functionName: "voters",
    args: [voterAddress as Address],
  });

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

  const getElectionMode = (mode: boolean) => {
    switch (mode) {
      case true:
        return "Mode Kandidat Diketahui";
      case false:
        return "Mode Kandidat Bebas";
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const votersData = voterDataFetch;
        const voterName = votersData?.[4] as string;

        const voterRegisteredOrg1 = votersData?.[5] as string;
        const voterRegisteredOrg2 = votersData?.[6] as string;
        const voterBirthDate = votersData?.[7] as string;
        console.log(voterRegisteredOrg1, voterRegisteredOrg2, voterBirthDate);
        const birthDate = decryptBirthDate(voterBirthDate);

        const ageInMilliseconds = Date.now() - birthDate.getTime();
        const ageInMonths = Math.floor(ageInMilliseconds / (30.44 * 24 * 60 * 60 * 1000));
        const age = ageInMonths < 12
          ? `${ageInMonths} bulan`
          : `${Math.floor(ageInMonths / 12)} tahun`;

        setVoterData({
          orgID1: voterRegisteredOrg1,
          orgID2: voterRegisteredOrg2,
          voterName: voterName,
          voterBirthDate: birthDate,
          voterAge: age,
          voterAddress: voterAddress,
        });
      } catch (error) { }
    };
    if (orgID) {

      fetchData();
    }
  }, [orgID, voterDataFetch, voterAddress]);

  useEffect(() => {
    const fetchElections = async () => {
      try {
        if (ElectionList) {
          const [electionIDs, electionNames, electionStatuses] = ElectionList;

          const waveNumberData = electionDetail ? Number(electionDetail?.[2]) : 0;

          const elections = electionIDs.map((idHex: string, index: number) => ({
            electionID: hexToAscii(idHex),
            electionName: hexToAscii(electionNames[index]),
            electionStatus: getStatusString(electionStatuses[index]),
            waveNumber: waveNumberData as number,
          }));

          setelectionOverviewData(elections);
        }
      } catch (error) {
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
            const waveNumber = Number(resultData[2])
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

            const candidates = candidateIDs.map((id: number, index: number) => ({
              candidateID: BigInt(id),
              name: candidateNames[index].replace(/\0/g, "").trim(),
              voteCount: Number(candidateVoteCounts[index]),
            }));;


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
            };
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
          }
          setElectionResult(null);
        }
      } catch (error) {
        setError("Error fetching data");
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedElectionID("");
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
    });
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="items-center justify-center w-full">
      <section className={isMobile ? "section-1 m-3" : "section-1 flex flex-1"}>
        <div className="flex flex-col pt-8 relative bg-base-100 rounded-3xl shadow-md shadow-primary border border-base-300 p-12 w-full">
          <div className="p-6 bg-base-300 rounded-[22px] py-[0.65rem] shadow-lg shadow-base-300 flex items-center justify-center">
            <h3 className="my-0 font-bold text-sm">Data Pemilih</h3>
          </div>
          <div className="p-5 divide-y divide-base-300"></div>
          <p className="title-md">
            Nama Pemilih: <br />
            {voterData.voterName ? (
              <>
                {voterData.voterName}
              </>
            ) : (
              "Memuat Data..."
            )}
          </p>
          <p className="title-md">
            Alamat Dompet Admin: <br />
            {voterData.voterAddress ? (
              <>
                {voterData.voterAddress.slice(0, 22)} <br />
                {voterData.voterAddress.slice(22)}
              </>
            ) : (
              "Memuat Data..."
            )}
          </p>
          <p className="title-md">
            Tanggal Lahir Pemilih: <br />
            {voterData.voterBirthDate ? (
              <>
                {voterData.voterBirthDate.toLocaleDateString('id-ID')}
              </>
            ) : (
              "Memuat Data..."
            )}
          </p>
          <p className="title-md">
            Umur Admin: <br />
            {voterData.voterAge ? (
              <>
                {voterData.voterAge}
              </>
            ) : (
              "Memuat Data..."
            )}
          </p>
        </div>
      </section>
      <section className="section-3 m-4">
        <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 flex flex-col mt-10 relative p-12">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="h-[3rem] w-[9.5rem] bg-base-300 rounded-[22px] py-[0.65rem] shadow-lg shadow-base-300 flex items-center justify-center">
              <h3 className="my-0 text-md font-bold">Daftar Pemilihan</h3>
            </div>
          </div>
          <div className="p-5 divide-y divide-base-300"></div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4 bg-base-200 rounded-tl-xl">ID Pemilihan</th>
                  <th className="py-2 px-4 bg-base-200">Nama Pemilihan</th>
                  <th className="py-2 px-4 bg-base-200">Status</th>
                  <th className="py-2 px-4 bg-base-200 rounded-tr-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="cursor-pointer">
                {electionOverviewData.map((election, index) => (
                  <tr
                    key={index}
                    onClick={() => handleManageClick(election.electionID, election.electionStatus)}
                    className={selectedElection?.electionID === election.electionID ? "bg-accent" : ""}
                  >
                    <td className="py-2 px-4 border-b text-center">{election.electionID}</td>
                    <td className="py-2 px-4 border-b border-l text-center">{election.electionName}</td>
                    <td className="py-2 px-4 border-b border-l text-center">{election.electionStatus}</td>
                    <td className="py-2 px-4 border-b border-l  text-center">
                      {election.electionStatus === "Sedang Berjalan" && (
                        <button className="btn btn-sm btn-primary" onClick={e => handleVoteClick(e, election.electionID)}>
                          Pilih Sekarang
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedElection && (
            <div className="flex flex-col bg-base-300 rounded-lg shadow-lg mt-10 p-4 mx-auto w-full overflow-x-auto">
              <h3 className="text-center text-xl font-bold mb-4">{selectedElection.electionName} - {selectedElection.electionID}</h3>
              <p className="text-center text-xl font-regular mb-4">
                Jumlah Kandidat: {selectedElection.totalCandidates}
              </p>
              <p className="text-center text-xl font-regular mb-4">
                Jumlah Partisipan: {selectedElection.totalParticipants}
              </p>
              <p className="text-center text-xl font-regular mb-4">Mode: {selectedElection.electionMode}</p>
              <p className="text-center text-xl font-regular mb-4">
                Gelombang: {selectedElection.waveNumber}
              </p>
              <h3 className="text-center text-lg font-medium">Daftar Kandidat</h3>
              <br />
              <div className="flex justify-center flex-wrap w-full">
                <ul className="text-left mb-4">
                  {selectedElection.candidateNames.map((name, index) => (
                    <li key={index} className="mb-2">
                      <div>
                        <span className="font-bold mr-2">No: {index + 1}</span> <br />
                        <span className="mr-4">{name}</span> <br />
                        <span className="text-left">Jumlah Suara: {selectedElection.voteCounts[index]}</span>
                      </div>
                      <br />
                    </li>
                  ))}
                </ul>
                {selectedElection.electionStatus === "Dalam Persiapan" && (
                  <div>
                    <span className="text-center justify-center items-center ">
                      --Pemilihan belum dimulai--
                    </span>
                  </div>
                )}

                {selectedElection.electionStatus === "Sedang Berjalan" && (
                  <>
                    {selectedElection && selectedElection.voteCounts.some((count) => count > 1) && (
                      <div className="flex w-full sm:w-2/3 justify-center">
                        <ResponsiveContainer
                          width={isMobile ? "100%" : "80%"}
                          height={isMobile ? 200 : 300}
                          className={"justify-center"}
                        >
                          <BarChart
                            data={selectedElection.candidateNames.map((name, index) => ({
                              name: name,
                              votes: selectedElection.voteCounts[index],
                            }))}
                            margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                          >
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 12 }}
                              angle={-30}
                              textAnchor="end"
                              interval={0}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend
                              layout="vertical"
                              align="right"
                              verticalAlign="middle"
                              wrapperStyle={{ fontSize: "12px" }}
                            />
                            <Bar dataKey="votes" fill="#7340FF" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {electionResult && (
            <div className="bg-base-300 rounded-lg shadow-lg mt-10 p-10 mx-auto w-2/3">
              <h3 className="text-center text-xl font-bold mb-4">
                Hasil Pemilihan: {electionResult.electionName} - {electionResult.electionID}
              </h3>
              <p className="text-center text-lg font-regular mb-4">Jumlah Partisipan: {electionResult.totalVoter}</p>
              <p className="text-center text-lg font-bold mb-4">Pemenang:</p>
              <h2 className="text-center text-md font-bold">{electionResult.electionWinner}</h2>
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
                Tertanda tangan oleh : {electionResult.signedBy}
              </h3>
              <br />
              <h3 className="text-center">
                Tanda tangan Digital : {(electionResult.digitalSignature)}
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
    </div>
  );
};

export default VoterDashboard;
