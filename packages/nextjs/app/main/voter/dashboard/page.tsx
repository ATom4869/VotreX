"use client";

import React, { useEffect, useState } from "react";
import VoterDashboard from "./components/VoterDashboard";
import { NextPage } from "next";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useWalletClient } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { Address } from "viem";

const dashboard: NextPage = () => {

  const [isRegisteredUser, setIsRegisteredUser] = useState<boolean | null>(null);
  const [isVoter, setIsVoter] = useState<boolean | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true); // ✅ Tambahkan state loading
  const [orgID, setOrgID] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(3); // Countdown for redirect

  const { data: walletClient } = useWalletClient();

  const currentAddress = walletClient?.account.address;
  console.log("currentAddress", currentAddress);

  const { data: orgDataFetch } = useScaffoldReadContract({
    contractName: "TestCompleXA2C",
    functionName: "organizationData",
    args: [orgID as string],
  });

  const { data: userInfoCheck } = useScaffoldReadContract({
    contractName: "TestCompleXA2C",
    functionName: "getUserInfo",
    account: currentAddress,
  });

  // ✅ Check if the stored OrgID matches the user's registered OrgIDs
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedOrgID = localStorage.getItem("orgID");
      setOrgID(storedOrgID);

      const contractAdminAddress = orgDataFetch?.[1] as Address;
      const isRegistered = userInfoCheck?.[0] as boolean;
      if (currentAddress === contractAdminAddress && isRegistered === true) {
        setIsVoter(false);
        setIsRegisteredUser(true);
        return;
      } else if (currentAddress !== contractAdminAddress && isRegistered === true) {
        setIsVoter(true);
        setIsRegisteredUser(true);
        return;
      } else {
        setIsVoter(false);
        setIsRegisteredUser(false);
        return;
      }
    }
  }, [orgDataFetch, userInfoCheck, currentAddress]);

  useEffect(() => {
    // ✅ Increase checking delay to 3 seconds
    const timer = setTimeout(() => {
      setIsCheckingAccess(false);
    }, 3000); // ⏳ Delay changed to 3 seconds

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isVoter === false && isRegisteredUser === false || isVoter === false && isRegisteredUser === true) {
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      const timeout = setTimeout(() => {
        window.location.href = "/login"; // ✅ Redirect to login page
      }, 5000);

      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
  }, [isVoter, isRegisteredUser]);

  return (
    <>
      {isCheckingAccess ? (
        // ✅ 1. Loading screen selama 2 detik sebelum cek akses
        <p className="text-center font-medium text-white-600 mt-6">
          Memeriksa hak akses...
        </p>
      ) : isVoter === true && isRegisteredUser === true && orgID ? (
        <div>
          <ToastContainer />
          <VoterDashboard />
        </div>
      ) : isVoter === false && isRegisteredUser === true ? (
        <div className="flex flex-col items-center justify-center h-screen">
          <h2 className="text-2xl font-bold text-red-600">Akses Ditolak</h2>
          <p className="text-lg text-white-700 mt-2">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          <p className="text-md font-semibold mt-4">
            Mengalihkan ke halaman login dalam <span className="text-yellow-500">{countdown}</span> detik...
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-screen">
          <h2 className="text-2xl font-bold text-red-600">Akses Ditolak</h2>
          <p className="text-lg text-white-700 mt-2">Kamu Belum terdaftar di Instansi ini.</p>
          <p className="text-md font-semibold mt-4">
            Mengalihkan ke halaman login dalam <span className="text-yellow-500">{countdown}</span> detik...
          </p>
        </div>
      )}
    </>
  );
};

export default dashboard;
