import React from "react";
import ElectionManage from "./components/ElectionManage";
import { NextPage } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next"

const electionManager: NextPage = () => {
  return (
    <div className="flex flex-wrap justify-center items-center">
      <Analytics />
      <SpeedInsights />
      <ElectionManage />
    </div>
  );
};

export default electionManager;
