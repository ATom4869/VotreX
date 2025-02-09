"use client";

import React, { useEffect, useState } from "react";
import CreateElectionModal from "./CreateElectionModal";
import "./Dashboard.css";
import { Address } from "viem";
import { useWalletClient } from "wagmi";
import { hexToAscii as originalHexToAscii, toNumber } from "web3-utils";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import "react-toastify/dist/ReactToastify.css";

const BasicOrgData = () => {
  const { data: walletClient } = useWalletClient();
  const [data, setData] = useState<any>({});
  const [orgID, setOrgID] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true); // ✅ Tambahkan state loading
  const [countdown, setCountdown] = useState<number>(3); // Countdown for redirect

  const adminAddress = walletClient?.account.address;

  const { data: orgDataFetch } = useScaffoldReadContract({
    contractName: "TestCompleXA2C",
    functionName: "organizationData",
    args: [orgID as string],
  });

  const { data: VotreXContract } = useScaffoldContract({
    contractName: "TestCompleXA2C",
    walletClient,
  });

  const hexToAscii = (hex: string): string => {
    const ascii = originalHexToAscii(hex);
    return ascii.replace(/\0/g, "").trim();
  };

  // ✅ Check if the stored OrgID matches the user's registered OrgIDs
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
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orgData = orgDataFetch;
        const adminData = VotreXContract?.read.admin([adminAddress as Address]);
        const adminName = hexToAscii((await adminData)?.[6] as string);
        const onPrepElection = orgData?.[2];
        const activeElection = orgData?.[3];
        const archiveElectionData = orgData?.[4];
        const totalElectionData =
          activeElection !== undefined && archiveElectionData !== undefined
            ? BigInt(onPrepElection as bigint) + BigInt(activeElection) + BigInt(archiveElectionData)
            : BigInt(0);
        setData({
          orgName: hexToAscii(orgData?.[6] as string),
          orgID: orgData?.[7],
          totalMember: Number(orgData?.[5]),
          adminName: adminName,
          adminAddress: adminAddress,
          totalElection: toNumber(totalElectionData as bigint),
          onPrepElection: toNumber(orgData?.[2] as bigint),
          activeElection: toNumber(orgData?.[3] as bigint),
          archiveElection: toNumber(orgData?.[4] as bigint),
        });
      } catch (error) { }
    };
    if (isAdmin === true && orgID) {

      fetchData();
    }
  }, [orgDataFetch, orgID, adminAddress, isAdmin]);

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

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCreateElection = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {isCheckingAccess ? (
        <p className="text-center font-medium text-white-600 mt-6">
          Memeriksa hak akses...
        </p>
      ) : isAdmin === true && orgID ? (
        <div className="flex flex-wrap justify-center w-full px-8">
          <section className="section-1 m-3">
            <div className="pt-8 bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 flex flex-col relative p-12">
              <div className="p-6 bg-base-300 rounded-[22px] py-[0.65rem] shadow-lg shadow-base-300 flex items-center justify-center">
                <h3 className="my-0 font-bold text-sm">Data Organisasi</h3>
              </div>
              <div className="p-5 divide-y divide-base-300"></div>
              <p className="title-md">
                Nama Organisasi: <br />
                {data.orgName ? (
                  <>
                    {data.orgName}
                  </>
                ) : (
                  "Memuat Data..."
                )}
              </p>
              <p className="title-md">
                ID Organisasi : <br />
                {data.orgID ? (
                  <>
                    {data.orgID}
                  </>
                ) : (
                  "Memuat Data..."
                )}
              </p>
              <p className="title-md">
                Total Anggota: <br />
                {data.totalMember ? (
                  <>
                    {data.totalMember}
                  </>
                ) : (
                  "Memuat Data..."
                )}
              </p>
            </div>
          </section>

          <section className="section-2 m-3 p-3">
            <div className="pt-8 bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 flex flex-col relative p-12">
              <div className="p-6 bg-base-300 rounded-[22px] py-[0.65rem] shadow-lg shadow-base-300 flex items-center justify-center">
                <h3 className="my-0 font-bold text-sm">Data Admin</h3>
              </div>
              <div className="p-5 divide-y divide-base-300"></div>
              <p className="title-md">
                Nama Admin: <br />
                {data.adminName ? (
                  <>
                    {data.adminName}
                  </>
                ) : (
                  "Memuat Data..."
                )}
              </p>
              <p className="title-md">
                Alamat Dompet Admin: <br />
                {data.adminAddress ? (
                  <>
                    {data.adminAddress.slice(0, 22)} <br />
                    {data.adminAddress.slice(22)}
                  </>
                ) : (
                  "Memuat Data..."
                )}
              </p>
            </div>
          </section>

          <section className="section-3 m-3">
            <div className="pt-8 bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 flex flex-col relative p-12">
              <div className="p-6 bg-base-300 rounded-[22px] py-[0.65rem] shadow-lg shadow-base-300 flex items-center justify-center">
                <h3 className="my-0 font-bold text-sm">Data Jumlah Pemilihan</h3>
              </div>
              <div className="p-5 divide-y divide-base-300"></div>
              <p className="title-md">
                Total Pemilihan: <br />
                {data.totalElection === undefined || data.totalElection === null ? (

                  "Memuat Data..."
                ) : data.totalElection === 0 ? (
                  "0"
                ) : (
                  <>
                    {data.totalElection}
                  </>
                )}
              </p>
              <p className="title-md">
                Pemilihan Dalam Persiapan: <br />
                {data.totalElection === undefined || data.totalElection === null ? (

                  "Memuat Data..."
                ) : data.onPrepElection === 0 ? (
                  "0"
                ) : (
                  <>
                    {data.onPrepElection}
                  </>
                )}

                <br />
              </p>
              <p className="title-md">
                Pemilihan Aktif: <br />
                {data.activeElection === undefined || data.activeElection === null ? (
                  "..."
                ) : data.activeElection === 0 ? (
                  "--Tidak ada yang aktif--"
                ) : (
                  data.activeElection
                )}
                <br />
              </p>
              <p className="title-md">
                Pemilihan Diarsipkan: <br />
                {data.archiveElection === undefined || data.archiveElection === null ? (
                  "..."
                ) : data.archiveElection === 0 ? (
                  "--Tidak ada yang diarsipkan--"
                ) : (
                  data.archiveElection
                )}
                <br />
              </p>
              <button className="btn btn-sm btn-primary" onClick={handleOpenModal}>
                Buat Pemilihan Baru
              </button>
              <br />
              <a className="btn btn-sm btn-primary" href="/dashboard/manageElection">
                Atur Pemilihan
              </a>
            </div>
          </section>
          <CreateElectionModal isOpen={isModalOpen} onClose={handleCloseModal} onCreate={handleCreateElection} />
        </div>
      ) : (
        <p className="text-center text-red-600 font-bold">
          Akses Ditolak. Mengalihkan ke halaman login dalam
          <span className="text-yellow-500">{countdown}</span>
          detik...
        </p>
      )}
    </>
  );
};

export default BasicOrgData;