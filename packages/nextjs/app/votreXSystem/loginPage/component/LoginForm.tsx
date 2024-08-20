"use client";

import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Address } from "viem";
import { useWalletClient } from "wagmi";
import ButtonA from "~~/components/ButtonA";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";

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
  const { data: VotreXSystemA1Contract } = useScaffoldContract({
    contractName: "VotreXSystemA1",
  });

  const { data: VotreXOrgData } = useScaffoldReadContract({
    contractName: "VotreXSystemA1",
    functionName: "organizationData",
    args: [formData.orgID],
    account: walletClient?.account.address,
  });

  const { data: getUserInfo } = useScaffoldReadContract({
    contractName: "VotreXSystemA1",
    functionName: "getUserInfo",
    account: walletClient?.account.address,
  });

  const { data: votersData } = useScaffoldReadContract({
    contractName: "VotreXSystemA1",
    functionName: "voters",
    args: [walletClient?.account.address],
  });

  const loginCheck = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const currentAddress = walletClient?.account.address;

      // Check if the current address is the admin of the organization

      if (VotreXOrgData?.[1] && currentAddress === VotreXOrgData?.[1]) {
        if (getUserInfo?.[1]) {
          toast.success("You are an Admin", {
            autoClose: 3000,
            onClose: () => {
              localStorage.setItem("orgID", formData.orgID);
              localStorage.setItem("adminAddress", currentAddress as string);

              window.location.href = "/votreXSystem/electionAdmin/dashboard/";
            },
          });
          return;
        }
      }

      if (votersData?.[0] && (votersData[5] === formData.orgID || votersData[6] === formData.orgID)) {
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
      toast.error("Error during login. Have you connect the wallet?");
    }
  };

  return (
    <form onSubmit={loginCheck}>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
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
