"use client";

import React from "react";
import VoterDashboard from "./components/VoterDashboard";
import { NextPage } from "next";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const dashboard: NextPage = () => {
  return (
    <div>
      <ToastContainer />
      <VoterDashboard />
    </div>
  );
};

export default dashboard;
