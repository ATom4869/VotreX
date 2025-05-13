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
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { encryptBirthDate } from "~~/components/BirthDateHandler";

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    voterName: "",
    orgID: "",
    birthDate: new Date(),
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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

      const encryptedBirthDate = encryptBirthDate(formData.birthDate) as Hex;

      await VoterRegistration(
        {
          functionName: "registerVoter",
          args: [formData.voterName, formData.orgID, encryptedBirthDate, uniqueVoterID as Hex],
        },
        {
          onBlockConfirmation: txnReceipt => {
            toast.success(`Registration success Receipt: ` + txnReceipt.blockHash + txnReceipt.cumulativeGasUsed, {
              autoClose: 3000,
              onClose: () => (window.location.reload()),
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
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData(prevData => ({
        ...prevData,
        birthDate: date,
      }));
      console.log("Selected date:", date, "Epoch:", Math.floor(date.getTime() / 1000));
      setIsCalendarOpen(false);
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
        <label className="space-y-2">
          Tanggal Lahir Admin:
          <div className="dropdown">
            <input
              type="text"
              tabIndex={0}
              placeholder="Pilih tanggal lahir"
              className="input input-bordered w-full"
              value={formData.birthDate ? formData.birthDate.toLocaleDateString('id-ID') : ""}
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              readOnly
            />
            {isCalendarOpen && (
              <div tabIndex={0} className="dropdown-content z-[1] bg-base-100 rounded-lg shadow-lg px-4 py-2">
                <DayPicker
                  required={true}
                  mode="single"
                  selected={formData.birthDate}
                  onSelect={handleDateChange}
                  numberOfMonths={2}
                  captionLayout="dropdown"
                  showOutsideDays
                  defaultMonth={new Date()}
                />
              </div>
            )}
          </div>
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
