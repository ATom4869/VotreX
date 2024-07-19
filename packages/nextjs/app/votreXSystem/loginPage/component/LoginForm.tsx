"use client";

import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Address } from "viem";
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
      const currentAddress = walletClient?.account.address;

      // Check if the current address is the admin of the organization
      const orgIDCheck = await VotreXSystemContract?.read.organizationData([formData.orgID]);
      if (orgIDCheck?.[1] && currentAddress === orgIDCheck?.[1]) {
        const accountCheck = await VotreXSystemContract?.read.getUserInfo();
        if (accountCheck?.[1]) {
          toast.success("You are an Admin", {
            autoClose: 3000,
            onClose: () => {
              localStorage.setItem("orgID", formData.orgID);
              localStorage.setItem("adminAddress", currentAddress);

              window.location.href = "/votreXSystem/electionAdmin/dashboard/";
            },
          });
          return;
        }
      }

      const voterCheck = await VotreXSystemContract?.read.voters([currentAddress as Address]);
      if (voterCheck?.[0] && (voterCheck[5] === formData.orgID || voterCheck[6] === formData.orgID)) {
        toast.success("You are a Voter", {
          autoClose: 3000,
          onClose: () => {
            localStorage.setItem("orgID", formData.orgID);
            localStorage.setItem("voterAddress", currentAddress as Address);

            window.location.href = "/votreXSystem/voter/dashboard/";
          },
        });
      } else {
        toast.error("Invalid organization ID or address. Have you do registration?.", {
          autoClose: 3000,
        });
      }
    } catch (e) {
      console.error("Error during login:", e);
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
