import React from "react";
import ElectionManage from "./components/ElectionManage";
import { NextPage } from "next";

const electionManager: NextPage = () => {
  return (
    <div>
      <ElectionManage />
    </div>
  );
};

export default electionManager;
