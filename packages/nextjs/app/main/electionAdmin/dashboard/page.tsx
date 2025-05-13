"use client";

import React, { useEffect, useState } from "react";
import BasicOrgData from "./components/BasicOrgData";
import { NextPage } from "next";
import BackBtn from "../../loginPage/component/BackBtn";
import HomeBtn from "../../loginPage/component/homeButton";
import { useWalletClient } from "wagmi";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const AdminDashboard: NextPage = () => {
  const [isMobile, setIsMobile] = useState(false);

  const { data: walletClient } = useWalletClient();
  const adminAddress = walletClient?.account.address;

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

  return (
    <div className="sm:pl-24">
      <Analytics />
      <SpeedInsights />
      <div className="flex mt-12">
        <BackBtn buttonLabel={"Kembali"} />
        {isMobile && (
          <HomeBtn buttonLabel={"Kembali ke Beranda"} linkDest={"/"} />
        )}
        <br />
      </div>
      <div className="flex-row basic-org-data">
        <BasicOrgData />
      </div>
    </div>
  );
};

export default AdminDashboard;
