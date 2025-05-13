"use client";

import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Address } from "viem";
import { useWalletClient } from "wagmi";
import ButtonA from "~~/components/ButtonA";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

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

  const { data: VotreXOrgData } = useScaffoldReadContract({
    contractName: "TestCompleXA2C",
    functionName: "organizationData",
    args: [formData.orgID],
    account: walletClient?.account.address,
  });

  const { data: getUserInfo } = useScaffoldReadContract({
    contractName: "TestCompleXA2C",
    functionName: "getUserInfo",
    account: walletClient?.account.address,
  });

  const { data: votersData } = useScaffoldReadContract({
    contractName: "TestCompleXA2C",
    functionName: "voters",
    args: [walletClient?.account.address],
  });

  const loginCheck = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const currentAddress = walletClient?.account.address;

      if (VotreXOrgData?.[1] && currentAddress === VotreXOrgData?.[1]) {
        if (getUserInfo?.[1]) {
          toast.success("Masuk sebagai Admin", {
            autoClose: 3000,
            onClose: () => {
              localStorage.setItem("orgID", formData.orgID);
              localStorage.setItem("adminAddress", currentAddress as string);

              window.location.href = "/dashboard?role=admin";
            },
          });
          return;
        }
      }

      if (
        votersData?.[0] && (
          votersData[5] === formData.orgID ||
          votersData[6] === formData.orgID
        )) {
        toast.success("Masuk sebagai Voter", {
          autoClose: 3000,
          onClose: () => {
            localStorage.setItem("orgID", formData.orgID);
            localStorage.setItem("voterAddress", currentAddress as Address);

            window.location.href = "/dashboard?role=voter";
          },
        });
      } else {
        toast.error("Invalid ID Organisasi atau alamat. Sudah melakukan registrasi?.", {
          autoClose: 3000,
        });
      }
    } catch (e) {
      toast.error("Error proses login. Apakah dompetmu sudah terhubung?");
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
          ID Organisasi:
          <input
            id="orgID"
            name="orgID"
            className="input input-bordered input-accent w-3/4"
            placeholder="Masukkan ID Disini"
            value={formData.orgID}
            onChange={handleInputChange}
            required
          />
        </label>
      </div>
      <br />
      <ButtonA buttonLabel="Masuk" />
    </form>
  );
};

export default LoginForm;
