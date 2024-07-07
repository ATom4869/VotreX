"use client";

import React, { useState } from "react";
import Link from "next/link";
import "../registerPage.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Address } from "viem";
import { useWalletClient } from "wagmi";
import { useSignTypedData } from "wagmi";
import { encodePacked } from "web3-utils";
import ButtonA from "~~/components/ButtonA";
import { useScaffoldContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

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
  const { data: VotreXSystem } = useScaffoldContract({
    contractName: "VotreXSystem",
    walletClient,
  });

  const { data: VotreXSystemInterface } = useScaffoldContract({
    contractName: "VotreXTXInterface",
    walletClient,
  });

  const { writeContractAsync: ORGRegistration } = useScaffoldWriteContract("VotreXSystem");

  const { signTypedData } = useSignTypedData();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const interfaceStatus = await VotreXSystemInterface?.read.isActivatedInterfaceCheck();
    const VotreXSysStatus = await VotreXSystem?.read.isVotreXActivated();
    const formattedInterfaceStatus = interfaceStatus ? "Active" : "Paused";
    const formattedVotreXStatus = VotreXSysStatus ? "Active" : "Paused";
    const adminAddress = walletClient?.account.address;
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

      const registrationFee = await VotreXSystem?.read.getRegistrationFee();
      const orgTypeValue = selectedOption === "Organization" ? 0 : 1;

      await ORGRegistration(
        {
          functionName: "registerOrganization",
          args: [formData.orgName, formData.orgID, formData.adminName, orgTypeValue],
          value: registrationFee,
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
          Organization: [{ name: "orgID", type: "Admin" }],
          Admin: [
            { name: "organizationID", type: "string" },
            { name: "orgName", type: "string" },
            { name: "adminName", type: "string" },
            { name: "adminAddress", type: "address" },
            { name: "contents", type: "string" },
          ],
        },
        primaryType: "Organization",
        message: {
          orgID: {
            organizationID: formData.orgID,
            orgName: formData.orgName,
            adminName: formData.adminName,
            adminAddress: walletClient?.account.address as Address,

            contents: encodePacked(
              `Your Registration Receipt: ${formData.orgID}, ${formData.orgName}, ${formData.adminName} from: ${adminAddress}`,
            ),
          },
        },
      });
    } catch (error) {
      toast.error(`Error registering organization. Please try again.` + error, {
        autoClose: 3000,
      });
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
        <div className=" join">
          <label className="btn btn-secondary myRadButton join-item">
            <input
              className="join-item"
              type="radio"
              value="Organization"
              aria-label="Radio 1"
              checked={selectedOption === "Organization"}
              onChange={handleOptionChange}
              required
            />
            <span className="ml-2">Organization</span>
          </label>
          <label className="btn btn-secondary myRadButton join-item">
            <input
              className="join-item"
              type="radio"
              value="Corporate"
              checked={selectedOption === "Corporate"}
              onChange={handleOptionChange}
              required
            />
            <span className="ml-2">Corporate</span>
          </label>
        </div>
      </div>
      <p>
        Not an admin? Register as Voter{" "}
        <Link href="/votreXSystem/voter/registerPage" style={{ color: "blue" }}>
          Here
        </Link>
      </p>
      <br />
      <ButtonA buttonLabel="Register" />
    </form>
  );
};

export default RegistrationForm;
