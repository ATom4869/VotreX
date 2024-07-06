"use client";

import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useWalletClient } from "wagmi";
import ButtonA from "~~/components/ButtonA";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    orgID: "",
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const { data: walletClient } = useWalletClient();
  const { data: VotreXSystemContract } = useScaffoldContract({
    contractName: "VotreXSystem",
  });

  const loginCheck = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const currentAddress = await walletClient?.account.address;
      const orgIDCheck = await VotreXSystemContract?.read.organizationData([formData.orgID]);
      const accountCheck = await VotreXSystemContract?.read.getUserInfo();

      if (orgIDCheck?.[1] && currentAddress == orgIDCheck?.[1]) {
        if (accountCheck?.[1]) {
          toast.success("You are an Admin", {
            autoClose: 3000,
            onClose: () => {
              localStorage.setItem("orgID", formData.orgID);
              localStorage.setItem("adminAddress", currentAddress);

              window.location.href = "/votreXSystem/electionAdmin/dashboard/";
            },
          });
        } else {
          toast.success("You are a Voter", {
            autoClose: 3000,
            onClose: () => {
              localStorage.setItem("orgID", formData.orgID);
              localStorage.setItem("adminAddress", currentAddress);

              window.location.href = "/voter-dashboard";
            },
          });
        }
      } else {
        toast.error("Invalid organization ID or admin address. Please try again.", {
          autoClose: 3000,
        });
      }
    } catch (e) {
      toast.error("Error during login. Please try again.", {
        autoClose: 3000,
      });
    }
  };

  return (
    <form onSubmit={loginCheck}>
      <ToastContainer />
      <div>
        <label>
          Organization ID:
          <input
            id="orgID"
            name="orgID"
            className="form-control"
            style={{ color: "black" }}
            value={formData.orgID}
            onChange={handleInputChange}
            required
          />
        </label>
      </div>
      <br />
      <ButtonA buttonLabel="Login" />
    </form>
  );
};

export default LoginForm;
