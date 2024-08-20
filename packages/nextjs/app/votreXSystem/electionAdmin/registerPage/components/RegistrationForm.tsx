"use client";

import React, { useState } from "react";
import Link from "next/link";
import "../registerPage.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Address } from "viem";
import { useBlockNumber, useWalletClient } from "wagmi";
import { useSignTypedData } from "wagmi";
import { soliditySha3 } from "web3-utils";
import ButtonA from "~~/components/ButtonA";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

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

  const { data, error } = useBlockNumber();

  const { data: walletClient } = useWalletClient();

  const { data: adminRegistrationFeeChecks } = useScaffoldReadContract({
    contractName: "VotreXSystemA1",
    functionName: "getRegistrationFee",
  });

  const { data: InterfaceCheck } = useScaffoldReadContract({
    contractName: "VotreXTXInterface",
    functionName: "isActivatedInterfaceCheck",
  });

  const { data: VotreXStatusCheck } = useScaffoldReadContract({
    contractName: "VotreXSystemA1",
    functionName: "isVotreXActivated",
    account: walletClient?.account.address,
  });

  const { writeContractAsync: ORGRegistration } = useScaffoldWriteContract("VotreXSystemA1");

  const { signTypedData } = useSignTypedData();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const interfaceStatus = InterfaceCheck;
    const VotreXSysStatus = VotreXStatusCheck;
    const formattedInterfaceStatus = interfaceStatus ? "Active" : "Paused";
    const formattedVotreXStatus = VotreXSysStatus ? "Active" : "Paused";
    const registrationFee = adminRegistrationFeeChecks as bigint;
    const adminAddress = walletClient?.account.address;
    const orgTypeValue = selectedOption === "Organization" ? 0 : 1;
    try {
      if (!interfaceStatus || !VotreXSysStatus) {
        toast.error(`Interface is ${formattedInterfaceStatus}. Please try again later`, {
          autoClose: 3000,
        });
        toast.error(`VotreX System is ${formattedVotreXStatus}. Please try again later.`, {
          autoClose: 3000,
        });
        return;
      }

      await ORGRegistration(
        {
          functionName: "registerOrganization",
          args: [formData.orgName, formData.orgID, formData.adminName, orgTypeValue],
          value: registrationFee,
          account: walletClient?.account.address,
        },
        {
          onBlockConfirmation: txnReceipt => {
            toast.success(`Registration success. gas used: ` + txnReceipt.cumulativeGasUsed, {
              autoClose: 3000,
              onClose: () => {
                window.location.href = "/votreXSystem";
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
              { type: "string", value: formData.orgID + formData.orgName + formData.adminName + 'from:' + adminAddress }
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
          Admin Name:
          <input
            id="adminName"
            name="adminName"
            className="input form-control input-bordered"
            style={{ color: "black" }}
            value={formData.adminName}
            onChange={handleInputChange}
            required
          />
        </label>
        <br />
        <label className="space-y-2">
          Organization Name:
          <input
            id="orgName"
            name="orgName"
            className="input form-control input-bordered"
            style={{ color: "black" }}
            value={formData.orgName}
            onChange={handleInputChange}
            required
          />
        </label>
        <br />
        <label className="space-y-2">
          Organization ID:
          <input
            id="orgID"
            name="orgID"
            className="input form-control input-bordered"
            style={{ color: "black" }}
            value={formData.orgID}
            onChange={handleInputChange}
            required
          />
        </label>
        <br />
      </div>

      <div id="orgType" className="space-y-2">
        <span className="text-sm font-medium text-accent-700">Organization Type</span>
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
              style={{ margin: 0 }}
            />
            <span className="flex items-center ml-2">Organization</span>
          </label>
          <label className="btn btn-bg-300 cursor-pointer join-item flex items-center space-x-2">
            <span className="flex items-center mr-2">Corporate</span>
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
        Not an admin? Register as Voter{" "}
        <Link href="/VotreXSystemA1/voter/registerPage" style={{ color: "blue" }}>
          Here
        </Link>
      </p>
      <br />
      <ButtonA buttonLabel="Register" />
    </form>
  );
};

export default RegistrationForm;
