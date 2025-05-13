import React from "react";
import LoginForm from "./component/LoginForm";
import { NextPage } from "next";
import HomeBtn from "./component/homeButton";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"

const loginPage: NextPage = () => {
  return (
    <section>
      <Analytics />
      <SpeedInsights />
      <div className="mb-3 flex items-center flex-col flex-grow pt-8">
        <div className="flex mt-4">
          <HomeBtn buttonLabel={"Kembali ke Beranda"} linkDest={"/"} />
        </div>
        <br />
        <div className="container-lg">
          <LoginForm />
          <br />
        </div>
      </div>
    </section>
  );
};

export default loginPage;
