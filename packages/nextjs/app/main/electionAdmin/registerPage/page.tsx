import React from "react";
import RegistrationForm from "./components/RegistrationForm";
import { NextPage } from "next";
import HomeBtn from "../../loginPage/component/homeButton";

const registerPage: NextPage = () => {
  return (
    <section>
      <div className="mb-3 flex items-center flex-col flex-grow pt-8">
        <HomeBtn buttonLabel={"Kembali ke Beranda"} linkDest={"/"} />
        <br />
        <div className="container-lg center-items">
          <RegistrationForm />
          <br />
        </div>
      </div>
    </section>
  );
};

export default registerPage;
