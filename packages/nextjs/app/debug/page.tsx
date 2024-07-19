"use client";

import { useEffect, useState } from "react";
import UnAuthorizedPage from "../votreXTokenAdmin/components/UnAuthorizedPage";
import { DebugContracts } from "./_components/DebugContracts";
import type { NextPage } from "next";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useWalletClient } from "wagmi";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

const Debug: NextPage = () => {
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
        if (currentAddress?.toLowerCase() === ADMIN_ADDRESS?.toLowerCase() || currentAddress === VOTER_ADDRESS) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error detecting wallet address:", error);
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
    return (
      <div>
        <UnAuthorizedPage />
        <ToastContainer />
      </div>
    );
  }
  return (
    <>
      <DebugContracts />

      <div className="text-center mt-8 bg-secondary p-10">
        <h1 className="text-4xl my-0">Debug Contracts</h1>
        <p className="text-neutral">
          You can debug & interact with your deployed contracts here.
          <br /> Check{" "}
          <code className="italic bg-base-300 text-base font-bold [word-spacing:-0.5rem] px-1">
            packages / nextjs / app / debug / page.tsx
          </code>{" "}
        </p>
      </div>
    </>
  );
};

export default Debug;
