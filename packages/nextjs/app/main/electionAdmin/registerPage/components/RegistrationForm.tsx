"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import "../registerPage.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Address, Hex } from "viem";
import { useWalletClient } from "wagmi";
import { useSignTypedData } from "wagmi";
import { soliditySha3, padLeft } from "web3-utils";
import ButtonA from "~~/components/ButtonA";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { parseEnvNumber } from "~~/components/parseEnvNumber";

const RegistrationForm = () => {
  const [selectedOption, setSelectedOption] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState({
    adminName: "",
    orgName: "",
    orgID: "",
    birthDate: new Date(),
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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

    let orgTypeValue: number;
    switch (selectedOption) {
      case "Organization":
        orgTypeValue = 0;
        break;
      case "Churches":
        orgTypeValue = 1;
        break;
      case "Corporate":
        orgTypeValue = 2;
        break;
      default:
        toast.error("Pilih tipe organisasi.");
        return;
    }

    try {
      if (formattedVotreXStatus === "Paused") {
        toast.error(`VotreX System is ${formattedVotreXStatus}. Please try again later.`, {
          autoClose: 3000,
        });
        return;
      }

      const encryptedBirthDate = encryptBirthDate(formData.birthDate) as Hex;

      await ORGRegistration(
        {
          functionName: "registerOrganization",
          args: [formData.orgName, formData.orgID, formData.adminName, encryptedBirthDate, orgTypeValue],
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
      console.error("Error during registration:", error);
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

  const encryptBirthDate = (birthDate: Date): string => {
    const OFFSET = BigInt(parseEnvNumber(process.env.NEXT_PUBLIC_TIME_OFFSET));;
    const timestamp = BigInt(Math.floor(birthDate.getTime() / 1000));

    const adjusted = timestamp + OFFSET;

    const TWOS_COMPLEMENT_BASE = BigInt(2) ** BigInt(256);
    const finalValue = adjusted < 0n ? TWOS_COMPLEMENT_BASE + adjusted : adjusted;

    const hex = finalValue.toString(16);
    return "0x" + padLeft(hex, 64);
  };

  return (
    <form onSubmit={handleSubmit}>
      <ToastContainer />
      <div className="justify-center">
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
              <div tabIndex={0} className="dropdown-content z-[1] bg-base-100 rounded-lg shadow-lg p-2">
                <DayPicker
                  required={true}
                  mode="single"
                  selected={formData.birthDate}
                  onSelect={handleDateChange}
                  captionLayout="dropdown"
                  defaultMonth={formData.birthDate}
                />
              </div>
            )}
          </div>
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

      <div id="orgType" className="space-y-2 mb-4">
        <span className="text-sm font-medium text-accent-700">Tipe Organisasi</span>
        <hr />
        <div className={isMobile ? "flex flex-col gap-4 pt-5" : "join flex flex-wrap"}>
          <label className={
            isMobile ? "btn btn-md btn-bg-300 cursor-pointer flex items-center" :
              "btn btn-md btn-bg-300 cursor-pointer join-item flex items-center"
          }>
            <input
              className={isMobile ? "radio radio-sm radio-bg-300" : "radio radio-sm radio-bg-300"}
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
          <label className={
            isMobile ? "btn btn-md btn-bg-300 cursor-pointer flex items-center" :
              "btn btn-md btn-bg-300 cursor-pointer join-item flex items-center"
          }>
            <input
              className={isMobile ? "radio radio-sm radio-bg-300" : "radio radio-sm radio-bg-300"}
              type="radio"
              value="Churches"
              aria-label="Radio 1"
              checked={selectedOption === "Churches"}
              onChange={handleOptionChange}
              required
              style={{ margin: 0, backgroundColor: "--primary" }}
            />
            <span className="flex items-center ml-2">Gereja</span>
          </label>
          <label className={
            isMobile ? "btn btn-md btn-bg-300 cursor-pointer flex items-center" :
              "btn btn-md btn-bg-300 cursor-pointer join-item flex items-center"
          }>
            <input
              className={isMobile ? "radio radio-sm radio-bg-300" : "radio radio-sm radio-bg-300"}
              type="radio"
              value="Corporate"
              checked={selectedOption === "Corporate"}
              onChange={handleOptionChange}
              required
              style={{ margin: 0 }}
            />
            <span className="flex items-center mr-2">Perusahaan</span>
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
