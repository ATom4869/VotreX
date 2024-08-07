"use client";

import React from "react";
import BasicOrgData from "./components/BasicOrgData";
import { NextPage } from "next";

const dashboard: NextPage = () => {
  return (
    <div className="flex-row basic-org-data">
      <BasicOrgData />
    </div>
  );
};

export default dashboard;
