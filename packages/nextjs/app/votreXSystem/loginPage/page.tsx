import React from "react";
import LoginForm from "./component/LoginForm";
import { NextPage } from "next";

const loginPage: NextPage = () => {
  return (
    <section>
      <div className="mb-3 flex items-center flex-col flex-grow pt-8">
        <div className="container-lg">
          <LoginForm />
          <br />
        </div>
      </div>
    </section>
  );
};

export default loginPage;
