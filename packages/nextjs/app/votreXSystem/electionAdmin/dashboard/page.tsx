"use client";

import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useWalletClient } from "wagmi";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";

const AdminDashboard: NextPage = () => {
  const [totalMember, setTotalMember] = useState<bigint | null>(null);
  const { data: walletClient } = useWalletClient();

  const { data: VotreXContract } = useScaffoldContract({
    contractName: "VotreXSystem",
  });

  useEffect(() => {
    const fetchTotalMember = async () => {
      try {
        const orgID = localStorage.getItem("orgID");
        const orgData = await VotreXContract?.read.organizationData([orgID as string]);
        const totalMemberData = orgData?.[3];

        setTotalMember(totalMemberData as bigint);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error fetching data. Please try again.", {
          autoClose: 3000,
        });
      }
    };
    fetchTotalMember();
  }, [walletClient, VotreXContract]);

  return (
    <div>
      <ToastContainer />
      <div>
        <h1>Election Admin Dashboard</h1>
        <h3>Total Member</h3>
        <p>{totalMember?.toString()}</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
