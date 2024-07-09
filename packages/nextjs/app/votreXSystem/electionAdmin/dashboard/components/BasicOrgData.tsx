"use client";

import React, { useEffect, useState } from "react";
import { Address } from "viem";
import { useWalletClient } from "wagmi";
import { hexToAscii as originalHexToAscii, toNumber } from "web3-utils";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const BasicOrgData = () => {
  const { data: walletClient } = useWalletClient();
  const [data, setData] = useState<any>({});
  const [orgID, setOrgID] = useState<string | null>(null);
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

  const { data: adminDataFetch } = useScaffoldReadContract({
    contractName: "VotreXSystem",
    functionName: "admin",
    args: [adminAddress],
  });

  const { data: VotreXContract } = useScaffoldContract({
    contractName: "VotreXSystem",
    walletClient,
  });

  const hexToAscii = (hex: string): string => {
    // Use the original hexToAscii function
    const ascii = originalHexToAscii(hex);

    // Remove trailing non-printable characters (such as null bytes)
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
        const totalElectionData = BigInt(activeElection as bigint) + BigInt(archiveElectionData as bigint);

        setData({
          orgName: hexToAscii(orgData?.[5] as string),
          orgID: orgData?.[6],
          totalMember: Number(orgData?.[4]),
          adminName: adminName,
          adminAddress: adminAddress,
          totalElection: totalElectionData,
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

  return (
    <section className="section-1">
      <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 flex flex-col mt-10 relative">
        <div className="h-[5rem] w-[9.5rem] bg-base-300 absolute self-start rounded-[22px] -top-[38px] -left-[px] -z-10 py-[0.65rem] shadow-lg shadow-base-300">
          <div className="flex items-center justify-center space-x-2">
            <h3 className="my-0 text-sm">{data.orgName} Dashboard</h3>
          </div>
        </div>
        <div className="p-5 divide-y divide-base-300"></div>
        <p className="title-md">
          Organization ID: <br />
          {data.orgID}
        </p>
        <p className="title-md">
          Total Members: <br />
          {data.totalMember}
        </p>
        <p className="title-md">
          Admin Name: <br />
          {data.adminName}
        </p>
        <p className="title-md">
          Admin Address: <br />
          {data.adminAddress}
        </p>
        <p className="title-md">
          Total Elections: <br /> {data.totalElection}
        </p>
        <p className="title-md">
          Active Elections: {data.activeElection}
          <br />
          <button className="btn btn-sm btn-primary" onClick={() => console.log("Show Active Elections")}>
            View
          </button>
        </p>
        <p className="title-md">
          Archive Elections: {data.archiveElection}
          <br />
          <button className="btn btn-sm btn-primary" onClick={() => console.log("Show Archive Elections")}>
            View
          </button>
        </p>
      </div>
    </section>
  );
};

export default BasicOrgData;
