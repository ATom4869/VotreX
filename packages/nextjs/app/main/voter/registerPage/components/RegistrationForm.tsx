"use client";

import React, { useState } from "react";
import Link from "next/link";
import "../registerPage.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Address, Hex } from "viem";
import { useSignTypedData, useWalletClient } from "wagmi";
import { asciiToHex, encodePacked, padRight, soliditySha3 } from "web3-utils";
import ButtonA from "~~/components/ButtonA";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    voterName: "",
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

  const { data: organizationDataFetches } = useScaffoldReadContract({
    contractName: "TestCompleXA2C",
    functionName: "organizationData",
    args: [formData.orgID],
  });

  const { data: VotreXStatusCheck } = useScaffoldReadContract({
    contractName: "TestCompleXA2C",
    functionName: "isVotreXActivated",
    account: walletClient?.account.address,
  });

  const { writeContractAsync: VoterRegistration } = useScaffoldWriteContract("TestCompleXA2C");

  const { signTypedData } = useSignTypedData();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const VotreXSysStatus = VotreXStatusCheck;
      const formattedVotreXStatus = VotreXSysStatus ? "Active" : "Paused";
      if (!VotreXSysStatus) {
        toast.error(`VotreX System is ${formattedVotreXStatus}. Please try again later.`, {
          autoClose: 2000,
        });
        return;
      }

      const voterAddress = walletClient?.account.address;
      let currentMemberNumber = Number(organizationDataFetches?.[4] as bigint);

      const uniqueVoterIDRaw = encodePacked((formData.orgID as string) + "-" + ++currentMemberNumber);
      const uniqueVoterID = padRight(asciiToHex(uniqueVoterIDRaw), 64);

      await VoterRegistration(
        {
          functionName: "registerVoter",
          args: [formData.voterName, formData.orgID, uniqueVoterID as Hex],
        },
        {
          onBlockConfirmation: txnReceipt => {
            toast.success(`Registration success Receipt: ` + txnReceipt.blockHash + txnReceipt.cumulativeGasUsed, {
              autoClose: 3000,
              onClose: () => (window.location.href = "/"),
            });
          },
        },
      );

      signTypedData({
        types: {
          Organization: [{ name: "orgData", type: "VoterData" }],
          VoterData: [
            { name: "organizationID", type: "string" },
            { name: "voterName", type: "string" },
            { name: "voterAddress", type: "address" },
            { name: "contents", type: "string" },
          ],
        },
        primaryType: "Organization",
        message: {
          orgData: {
            organizationID: formData.orgID,
            voterName: formData.voterName,
            voterAddress: voterAddress as Address,
            contents: soliditySha3(
              {
                type: "string",
                value: formData.orgID + formData.voterName + 'from:' + voterAddress
              }
            ) as string,
          },
        },
      });
    } catch (error) {
      // toast.error("Error registering as voter. Please try again.", {
      //   autoClose: 3000,
      // });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ToastContainer />
      <div>
        <label className="space-y-2">
          Nama Pemilih:
          <input
            id="voterName"
            name="voterName"
            className="input form-control input-bordered"
            style={{ color: "black" }}
            value={formData.voterName}
            onChange={handleInputChange}
            required
          />
        </label>
        <br />
        <label className="space-y-2">
          ID Organisasi:
          <input
            id="orgID"
            name="orgID"
            className="input form-control input-bordered"
            value={formData.orgID}
            onChange={handleInputChange}
            required
          />
        </label>
        <br />
      </div>
      <p>
        Bukan pemilih? Daftar sebagi admin{" "}
        <Link href="/register?role=admin" style={{ color: "blue" }}>
          disini
        </Link>
      </p>
      <br />
      <ButtonA buttonLabel="Register" />
    </form>
  );
};

export default RegistrationForm;
