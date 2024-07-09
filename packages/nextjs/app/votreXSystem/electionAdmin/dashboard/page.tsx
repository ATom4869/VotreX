"use client";

import React from "react";
import BasicOrgData from "./components/BasicOrgData";
import { NextPage } from "next";

const dashboard: NextPage = () => {
  return (
    <div className="Basic-Data-ORG">
      <BasicOrgData />
    </div>
  );
};

export default dashboard;
