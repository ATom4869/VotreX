"use client";

import React, { useState } from "react";
import Link from "next/link";
import "../registerPage.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Address } from "viem";
// import { encodePacked } from "web3-utils";
import { encodePacked } from "viem";
import { useSignTypedData, useWalletClient } from "wagmi";
import ButtonA from "~~/components/ButtonA";
import { useScaffoldContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

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
  const { data: VotreXSystem } = useScaffoldContract({
    contractName: "VotreXSystem",
    walletClient,
  });

  const { data: VotreXSystemInterface } = useScaffoldContract({
    contractName: "VotreXTXInterface",
    walletClient,
  });

  const { writeContractAsync: VoterRegistration } = useScaffoldWriteContract("VotreXSystem");

  const { signTypedData } = useSignTypedData();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const interfaceStatus = await VotreXSystemInterface?.read.isActivatedInterfaceCheck();
      const VotreXSysStatus = await VotreXSystem?.read.isVotreXActivated();
      const formattedInterfaceStatus = interfaceStatus ? "Active" : "Paused";
      const formattedVotreXStatus = VotreXSysStatus ? "Active" : "Paused";
      if (!interfaceStatus && VotreXSysStatus) {
        toast.error(`Interface is ${formattedInterfaceStatus}. Please try again later.`, {
          autoClose: 3000,
        });
        toast.error(`VotreX System is ${formattedVotreXStatus}. Please try again later.`, {
          autoClose: 3000,
        });
        return;
      }

      const registrationFee = await VotreXSystem?.read.getRegistrationFee();
      const voterRegFee = (registrationFee as bigint) / 2n;
      const voterAddress = walletClient?.account.address;

      await VoterRegistration(
        {
          functionName: "registerVoter",
          args: [formData.voterName, formData.orgID],
          value: voterRegFee,
        },
        {
          onBlockConfirmation: txnReceipt => {
            toast.success(`Registration success Receipt: ` + txnReceipt.blockHash + txnReceipt.cumulativeGasUsed, {
              autoClose: 3000,
              onClose: () => window.location.reload(),
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

            contents: encodePacked(
              ["string", "string", "string", "address"],
              ["Registration Receipt: ", formData.orgID, formData.voterName, voterAddress as Address],
            ),
          },
        },
      });
      toast.success("Registration successful!", {
        autoClose: 3000,
        onClose: () => window.location.reload(),
      });
    } catch (error) {
      toast.error("Error registering as voter. Please try again." + error, {
        autoClose: 3000,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ToastContainer />
      <div>
        <label className="space-y-2">
          Voter Name:
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
      <p>
        Not a voter? Register as Admin{" "}
        <Link href="/votreXSystem/electionAdmin/registerPage" style={{ color: "blue" }}>
          Here
        </Link>
      </p>
      <br />
      <ButtonA buttonLabel="Register" />
    </form>
  );
};

export default RegistrationForm;
