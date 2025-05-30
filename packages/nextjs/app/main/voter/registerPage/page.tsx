import React from "react";
import RegistrationForm from "./components/RegistrationForm";
import { NextPage } from "next";
import HomeBtn from "../../loginPage/component/homeButton";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"

const registerPage: NextPage = () => {
  return (
    <section>
      <Analytics />
      <SpeedInsights />
      <div className="mb-3 flex items-center flex-col flex-grow pt-8">
        <HomeBtn buttonLabel={"Kembali ke Beranda"} linkDest={"/"} />
        <br />
        <div className="container-lg">
          <RegistrationForm />
          <br />
        </div>
      </div>
    </section>
  );
};

export default registerPage;
