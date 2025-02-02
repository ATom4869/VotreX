import React from "react";
import ElectionManage from "./components/ElectionManage";
import { NextPage } from "next";
import BackBtn from "~~/app/main/loginPage/component/BackBtn";
import HomeBtn from "~~/app/main/loginPage/component/homeButton";

const electionManager: NextPage = () => {
  return (
    <div className="flex flex-wrap justify-center items-center">
      <ElectionManage />
    </div>
  );
};

export default electionManager;
