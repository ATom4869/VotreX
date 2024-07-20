"use client";

import React, { useEffect, useState } from "react";
import CreateElectionModal from "./CreateElectionModal";
import "./Dashboard.css";
import { Address } from "viem";
import { useWalletClient } from "wagmi";
import { hexToAscii as originalHexToAscii, toNumber } from "web3-utils";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const BasicOrgData = () => {
  const { data: walletClient } = useWalletClient();
  const [data, setData] = useState<any>({});
  const [orgID, setOrgID] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const adminAddress = walletClient?.account.address;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrgID(localStorage.getItem("orgID"));
    }
  }, [walletClient]);

  const { data: orgDataFetch } = useScaffoldReadContract({
    contractName: "VotreXSystem",
    functionName: "organizationData",
    args: [orgID as string],
  });

  const { data: VotreXContract } = useScaffoldContract({
    contractName: "VotreXSystem",
    walletClient,
  });

  const hexToAscii = (hex: string): string => {
    const ascii = originalHexToAscii(hex);

    return ascii.replace(/\0/g, "").trim();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orgData = orgDataFetch;
        const adminData = VotreXContract?.read.admin([adminAddress as Address]);
        const adminName = hexToAscii((await adminData)?.[6] as string);
        const activeElection = orgData?.[2];
        const archiveElectionData = orgData?.[3];
        const totalElectionData =
          activeElection !== undefined && archiveElectionData !== undefined
            ? BigInt(activeElection) + BigInt(archiveElectionData)
            : BigInt(0);
        setData({
          orgName: hexToAscii(orgData?.[5] as string),
          orgID: orgData?.[6],
          totalMember: Number(orgData?.[4]),
          adminName: adminName,
          adminAddress: adminAddress,
          totalElection: totalElectionData.toString(),
          activeElection: Number(orgData?.[2]),
          archiveElection: toNumber(orgData?.[3] as bigint),
        });
        console.log(("Admin Name is: " + data.adminName) as string);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (orgID && adminAddress) {
      fetchData();
    }
  }, [orgDataFetch, orgID, adminAddress]);

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
    <div className="flex justify-center">
      <section className="section-1 m-3">
        <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 flex flex-col mt-10 relative p-12">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="h-[3rem] w-[9.5rem] bg-base-300 rounded-[22px] py-[0.65rem] shadow-lg shadow-base-300 flex items-center justify-center">
              <h3 className="my-0 font-bold text-sm">Organization Data</h3>
            </div>
          </div>
          <div className="p-5 divide-y divide-base-300"></div>
          <p className="title-md">
            Organization Name: <br />
            {data.orgName}
          </p>
          <p className="title-md">
            Organization ID: <br />
            {data.orgID}
          </p>
          <p className="title-md">
            Total Members: <br />
            {data.totalMember}
          </p>
        </div>
      </section>

      <section className="section-2 m-3">
        <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 flex flex-col mt-10 relative p-12">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="h-[3rem] w-[9.5rem] bg-base-300 rounded-[22px] py-[0.65rem] shadow-lg shadow-base-300 flex items-center justify-center">
              <h3 className="my-0 font-bold text-sm">Admin Data</h3>
            </div>
          </div>
          <div className="p-5 divide-y divide-base-300"></div>
          <p className="title-md">
            Admin Name: <br />
            {data.adminName}
          </p>
          <p className="title-md">
            Admin Address: <br />
            {data.adminAddress}
          </p>
        </div>
      </section>

      <section className="section-3 m-3">
        <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 flex flex-col mt-10 relative p-12">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="h-[3rem] w-[9.5rem] bg-base-300 rounded-[22px] py-[0.65rem] shadow-lg shadow-base-300 flex items-center justify-center">
              <h3 className="my-0 font-bold text-sm">Basic Election Data</h3>
            </div>
          </div>
          <div className="p-5 divide-y divide-base-300"></div>
          <p className="title-md">
            Total Elections: <br /> {data.totalElection}
          </p>
          <p className="title-md">
            On Prep Elections: {data.activeElection}
            <br />
          </p>
          <p className="title-md">
            Active Elections: {data.activeElection}
            <br />
          </p>
          <p className="title-md">
            Archive Elections: {data.archiveElection}
            <br />
          </p>
          <button className="btn btn-sm btn-primary" onClick={handleOpenModal}>
            Create Election
          </button>
          <br />
          <a className="btn btn-sm btn-primary" href="./dashboard/electionManager">
            Manage Election
          </a>
        </div>
      </section>
      <CreateElectionModal isOpen={isModalOpen} onClose={handleCloseModal} onCreate={handleCreateElection} />
    </div>
  );
};

export default BasicOrgData;
