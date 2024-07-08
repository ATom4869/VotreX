// components/BasicOrgData.tsx
import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import { Address } from "blo";
import { stringify } from "querystring";
import { Hex, hexToString } from "viem";
import { useWalletClient } from "wagmi";
import { encodePacked, soliditySha3, toNumber } from "web3-utils";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const BasicOrgData = () => {
  const { data: walletClient } = useWalletClient();
  const [data, setData] = useState<any>({});
  const AdminAddr = walletClient?.account.address;
  const orgID = localStorage.getItem("orgID");
  const orgIDPacked = encodePacked(orgID as string);
  const orgIDBytes32 = soliditySha3({ type: "string", value: orgIDPacked });

  const { data: orgDataFetch } = useScaffoldReadContract({
    contractName: "VotreXSystem",
    functionName: "organizationData",
    args: [orgID as string],
  });

  const { data: adminDataFetch } = useScaffoldReadContract({
    contractName: "VotreXSystem",
    functionName: "admin",
    args: [AdminAddr],
  });

  const { data: activeElectionData } = useScaffoldReadContract({
    contractName: "VotreXSystem",
    functionName: "getActiveElectionData",
    args: [orgIDBytes32 as Hex],
  });

  const { data: archiveElectionData } = useScaffoldReadContract({
    contractName: "VotreXSystem",
    functionName: "getArchivedElectionData",
    args: [orgIDBytes32 as Hex],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orgData = orgDataFetch;
        const activeElection = orgData?.[2];
        const archiveElectionData = orgData?.[3];
        const totalElectionData = BigInt(activeElection as bigint) + BigInt(archiveElectionData as bigint);

        setData({
          orgName: orgData?.[5],
          orgID: orgID,
          totalMember: Number(orgData?.[4]),
          adminName: adminDataFetch?.[6],
          adminAddress: AdminAddr,
          totalElection: totalElectionData,
          activeElection: Number(orgData?.[2]),
          archiveElection: toNumber(orgData?.[3] as bigint),
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [orgDataFetch]);

  return (
    <div className="basic-org-data">
      <h3>Organization Name: {data.orgName}</h3>
      <p>Organization ID: {data.orgID}</p>
      <p>Total Members: {data.totalMember}</p>
      <p>Admin Name: {data.adminName}</p>
      <p>
        Admin Address: <br />
        {data.adminAddress}
      </p>
      <p>Total Elections: {data.totalElection}</p>
      <p>
        Active Elections: {data.activeElection}
        <br />
        <button onClick={() => console.log("Show Active Elections")}>View</button>
      </p>
      <p>
        Archive Elections: {data.archiveElection}
        <br />
        <button onClick={() => console.log("Show Archive Elections")}>View</button>
      </p>
    </div>
  );
};

export default BasicOrgData;
function stringtoBytes(arg0: string, arg1: { size: number }) {
  throw new Error("Function not implemented.");
}
