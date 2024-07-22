"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ButtonB from "./loginPage/component/ButtonB";
import type { NextPage } from "next";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useWalletClient } from "wagmi";
import ButtonA from "~~/components/ButtonA";
import MaintenancePage from "~~/components/MaintenancePage";

const VotreXSysDashboard: NextPage = () => {
  const { data: walletClient } = useWalletClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS;
  const VOTER_ADDRESS = process.env.NEXT_PUBLIC_VOTER_ADDRESS;

  useEffect(() => {
    const checkAdminAddress = async () => {
      setIsLoading(true);
      try {
        const currentAddress = await walletClient?.account.address;
        if (currentAddress?.toLowerCase() === ADMIN_ADDRESS?.toLowerCase() || VOTER_ADDRESS?.toLowerCase()) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        toast.error("Error detecting wallet address", {
          autoClose: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAddress();
  }, [walletClient]);

  if (isLoading) {
    return (
      <div className="loading-container" style={{ textAlign: "center", marginTop: "50px" }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!isAdmin) {
    <ToastContainer />;
    return <MaintenancePage />;
  }

  return (
    <div className="container container-sm justify-center">
      <h1>VotreXSysDashboard</h1>
      <br />
      <ButtonB linkDest="votreXSystem/loginPage" buttonLabel="Login" />
      <br className="divider divider-secondary" />
      <div className="button-component row">
        <Link href="votreXSystem/voter/registerPage" className="link">
          <ButtonA buttonLabel="Register as Voter" />
        </Link>
        <br />
        <Link href="votreXSystem/electionAdmin/registerPage" className="link">
          <ButtonA buttonLabel="Register as Admin" />
        </Link>
      </div>
    </div>
  );
};

export default VotreXSysDashboard;
