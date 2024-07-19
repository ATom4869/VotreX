import React from "react";
import VoterDashboard from "./components/VoterDashboard";
import { NextPage } from "next";

const dashboard: NextPage = () => {
  return (
    <div>
      <VoterDashboard />
    </div>
  );
};

export default dashboard;
