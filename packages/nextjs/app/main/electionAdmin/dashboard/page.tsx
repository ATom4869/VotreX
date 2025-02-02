"use client";

import React from "react";
import BasicOrgData from "./components/BasicOrgData";
import { NextPage } from "next";
import BackBtn from "../../loginPage/component/BackBtn";
import HomeBtn from "../../loginPage/component/homeButton";

const dashboard: NextPage = () => {
  return (
    <div className="pl-12 sm:pl-24">
      <div className="flex mt-12">
        <BackBtn buttonLabel={"Kembali"} />
        <HomeBtn buttonLabel={"Kembali ke Beranda"} linkDest={"/"} />
        <br />
      </div>
      <div className="flex-row basic-org-data">
        <BasicOrgData />
      </div>
    </div>
  );
};

export default dashboard;
