"use client";

import React, { useState } from "react";
import Link from "next/link";
import "../registerPage.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Address } from "viem";
import { useWalletClient } from "wagmi";
import { useSignTypedData } from "wagmi";
import { soliditySha3 } from "web3-utils";
import ButtonA from "~~/components/ButtonA";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const RegistrationForm = () => {
  const [selectedOption, setSelectedOption] = useState("");
  const [formData, setFormData] = useState({
    adminName: "",
    orgName: "",
    orgID: "",
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
  };

  const { data: walletClient } = useWalletClient();

  const { data: VotreXStatusCheck } = useScaffoldReadContract({
    contractName: "TestCompleXA2C",
    functionName: "isVotreXActivated",
    account: walletClient?.account.address,
  });

  const { writeContractAsync: ORGRegistration } = useScaffoldWriteContract("TestCompleXA2C");

  const { signTypedData } = useSignTypedData();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const VotreXSysStatus = VotreXStatusCheck;
    const formattedVotreXStatus = VotreXSysStatus ? "Active" : "Paused";
    const adminAddress = walletClient?.account.address;
    const orgTypeValue = selectedOption === "Organization" ? 0 : 1;
    try {
      if (!VotreXSysStatus) {
        toast.error(`VotreX System is ${formattedVotreXStatus}. Please try again later.`, {
          autoClose: 3000,
        });
        return;
      }

      await ORGRegistration(
        {
          functionName: "registerOrganization",
          args: [formData.orgName, formData.orgID, formData.adminName, orgTypeValue],
          account: walletClient?.account.address,
        },
        {
          onBlockConfirmation: txnReceipt => {
            toast.success(`Registrasi berhasil. gas digunakan: ` + txnReceipt.cumulativeGasUsed, {
              autoClose: 3000,
              onClose: () => {
                window.location.href = "/";
              },
            });
          },
          onError: error => {
            toast.error(`Can't do registration: ${error?.cause}`);
          },
        },
      );

      signTypedData({
        types: {
          Organization: [{ name: "orgData", type: "AdminData" }],
          AdminData: [
            { name: "organizationID", type: "string" },
            { name: "orgName", type: "string" },
            { name: "adminName", type: "string" },
            { name: "adminAddress", type: "address" },
            { name: "contents", type: "string" },
          ],
        },
        primaryType: "Organization",
        message: {
          orgData: {
            organizationID: formData.orgID,
            orgName: formData.orgName,
            adminName: formData.adminName,
            adminAddress: walletClient?.account.address as Address,

            contents: soliditySha3(
              {
                type: "string",
                value: formData.orgID + formData.orgName + formData.adminName + 'from:' + adminAddress
              }
            ) as string,
          },
        },
      });
    } catch (error) {
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ToastContainer />
      <div>
        <label className="space-y-2">
          Nama Admin:
          <input
            id="adminName"
            name="adminName"
            className="input form-control input-bordered"
            style={{ color: "--bg-base-200" }}
            value={formData.adminName}
            onChange={handleInputChange}
            required
          />
        </label>
        <br />
        <label className="space-y-2">
          Nama Organisasi:
          <input
            id="orgName"
            name="orgName"
            className="input form-control input-bordered"
            style={{ color: "--bg-base-200" }}
            value={formData.orgName}
            onChange={handleInputChange}
            required
          />
        </label>
        <br />
        <label className="space-y-2">
          ID Organization:
          <input
            id="orgID"
            name="orgID"
            className="input form-control input-bordered"
            style={{ color: "--bg-base-200" }}
            value={formData.orgID}
            onChange={handleInputChange}
            required
          />
        </label>
        <br />
      </div>

      <div id="orgType" className="space-y-2">
        <span className="text-sm font-medium text-accent-700">Tipe Organisasi</span>
        <hr />
        <div className="join">
          <label className="btn btn-bg-300 cursor-pointer join-item flex items-center space-x-2">
            <input
              className="radio radio-accent join-item"
              type="radio"
              value="Organization"
              aria-label="Radio 1"
              checked={selectedOption === "Organization"}
              onChange={handleOptionChange}
              required
              style={{ margin: 0, backgroundColor: "--primary" }}
            />
            <span className="flex items-center ml-2">Organisasi</span>
          </label>
          <label className="btn btn-bg-300 cursor-pointer join-item flex items-center space-x-2">
            <span className="flex items-center mr-2">Perusahaan</span>
            <input
              className="radio radio-accent join-item"
              type="radio"
              value="Corporate"
              checked={selectedOption === "Corporate"}
              onChange={handleOptionChange}
              required
              style={{ margin: 0 }}
            />
          </label>
        </div>
      </div>

      <p>
        Bukan Admin? Daftar sebagai Pemilih {" "}
        <Link href="/register?role=voter" style={{ color: "blue" }}>
          disini
        </Link>
      </p>
      <br />
      <ButtonA buttonLabel="Register" />
    </form>
  );
};

export default RegistrationForm;
