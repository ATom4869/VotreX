"use client";

import React, { useState } from "react";
import BurnModal from "./BurnModal";
import ContractStorageModal from "./ContractStorageModal";
import MintModal from "./MintModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Address } from "viem";
import { useWalletClient } from "wagmi";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const TokenControl = () => {
  const { data: walletClient } = useWalletClient();

  const adminAddress = walletClient?.account.address as string;

  const { data: VotreXTokenT2Contract } = useScaffoldContract({
    contractName: "VotreXTokenT2",
    walletClient,
  });

  const { data: VotreXSysContract } = useScaffoldContract({
    contractName: "VotreXSystemA1",
    walletClient,
  });

  const { data: VotreXStateCheck } = useScaffoldReadContract({
    contractName: "VotreXSystemA1",
    functionName: "isVotreXActivated",
  });

  const { writeContractAsync: VotreXControl } = useScaffoldWriteContract("VotreXSystemA1");

  const [votreXAddress, setVotreXAddress] = useState<string>("");
  const [interfaceContract, setInterfaceContract] = useState("");
  const [stakingContract, setStakingContract] = useState("");
  const [dexContract, setDexContract] = useState("");
  const [balanceTransferAmount, setBalanceTransferAmount] = useState("");
  const [balanceWithdrawalsAmount, setBalanceWithdrawalsAmount] = useState("");
  const [destinationAddress, setDestinationAddress] = useState<string>("");
  const [isBurnModalOpen, setIsBurnModalOpen] = useState(false);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [isContractStrgModalOpen, setIsContractStrgModalOpen] = useState(false);
  const [interfaceApprovalValue, setInterfaceApprovalValue] = useState<string>("");
  const [VotreXSysApprovalValue, setVotreXSysApprovalValue] = useState<string>("");
  const [contractStorageData, setContractStorageData] = useState({
    Authorized: "",
    VotreXContract: "",
  });

  const activateTokenFunction = async () => {
    try {
      const status = await VotreXTokenT2Contract?.read.paused();
      if (status) {
        await VotreXTokenT2Contract?.write.Activate();
        toast.success("Activated token", {
          autoClose: 3000,
          onClose: () => window.location.reload(),
        });
      } else {
        toast.error("Token is already active", {
          autoClose: 3000,
        });
      }
    } catch (e) {
      toast.error("Error Activating token", {
        autoClose: 3000,
      });
    }
  };

  const pauseTokenFunction = async () => {
    try {
      const status = await VotreXTokenT2Contract?.read.paused();
      if (!status) {
        await VotreXTokenT2Contract?.write.pause();
        toast.success("Paused token system", {
          autoClose: 3000,
          onClose: () => window.location.reload(),
        });
      } else {
        toast.error("Token is already paused", {
          autoClose: 3000,
        });
      }
    } catch (e) {
      toast.error("Error Pausing system", {
        autoClose: 3000,
      });
      console.error("Error Pausing System:", e);
    }
  };

  const ChangeVotreXSysStatusFunction = async () => {
    try {
      const status = VotreXStateCheck
      if (status) {
        await VotreXControl(
          {
            functionName: "changeSystemState",
          },
          {
            onBlockConfirmation: txnReceipt => {
              toast.success(
                `Paused VotreX successfully, gas used: ` +
                txnReceipt.cumulativeGasUsed,
                {
                  autoClose: 3000,
                  onClose: () => window.location.reload(),
                },
              );
            },
          },
        );
      } else {
        await VotreXControl(
          {
            functionName: "changeSystemState",
          },
          {
            onBlockConfirmation: txnReceipt => {
              toast.success(
                `Paused VotreX successfully, gas used: ` +
                txnReceipt.cumulativeGasUsed,
                {
                  autoClose: 3000,
                  onClose: () => window.location.reload(),
                },
              );
            },
          },
        );
      }
    } catch (e) {
      toast.error("Error changing system state", {
        autoClose: 3000,
      });
      console.error("Error changing system state:", e);
    }
  };

  const handleSetVotreXAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const TokenStatus = await VotreXTokenT2Contract?.read.paused();
    const formattedTokensStatus = TokenStatus ? "Paused" : "Active";

    try {
      if (TokenStatus) {
        await VotreXTokenT2Contract?.write.setVotreXContract([votreXAddress as Address]);
        toast.success("VotreX System Contract Address set successfully", {
          autoClose: 3000,
          onOpen: () => setVotreXAddress(""),
        });
      }
      if (!TokenStatus) {
        toast.error("Token Status is " + formattedTokensStatus + " Please Pause first", {
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("Error setting VotreX System Contract Address", {
        autoClose: 3000,
      });
    }
  };

  const handleBurnTokens = async (burnAmountBigInt: bigint) => {
    try {
      const tokenStatus = await VotreXTokenT2Contract?.read.paused();
      if (!tokenStatus) {
        await VotreXTokenT2Contract?.write.burn([burnAmountBigInt]);
        toast.success(`Burned ${burnAmountBigInt.toString()} tokens successfully`, {
          autoClose: 3000,
          onClose: () => window.location.reload(),
        });
        setIsBurnModalOpen(false);
      } else {
        toast.error("Token Burn error", {
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("Error burning tokens detected", {
        autoClose: 3000,
      });
    }
  };

  const handleMintTokens = async (MintDestinationAddr: Address, mintAmountBigInt: bigint) => {
    try {
      const tokenStatus = await VotreXTokenT2Contract?.read.paused();
      if (!tokenStatus) {
        await VotreXTokenT2Contract?.write.mint([MintDestinationAddr, mintAmountBigInt]);
        toast.success(`Minted ${mintAmountBigInt.toString()} tokens successfully`, {
          autoClose: 3000,
          onClose: () => window.location.reload(),
        });
        setIsBurnModalOpen(false);
      } else {
        toast.error("Token Mint canceled", {
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("Error minting tokens", {
        autoClose: 3000,
      });
    }
  };

  const handleContractStrgCheck = async () => {
    try {
      const contractStorage2 = await VotreXTokenT2Contract?.read.ContractStorage([adminAddress as Address]);

      setContractStorageData({
        Authorized: contractStorage2?.[0] as string,
        VotreXContract: contractStorage2?.[3] as string,
      });
      setIsContractStrgModalOpen(true);
      console.log("VotreX Contrasct Address = ", contractStorage2);
    } catch (error) {
      toast.error("Error fetching contract storage details", {
        autoClose: 3000,
      });
      console.error("Error fetching contract storage:", error);
    }
  };

  const handleVotreXSysApproval = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const approvalValuesinBigInt = BigInt(VotreXSysApprovalValue);
      await VotreXTokenT2Contract?.write.customApprove([
        VotreXTokenT2Contract.address, votreXAddress, approvalValuesinBigInt
      ]);
      toast.success(`Approved ${approvalValuesinBigInt.toString()} tokens for VotreX System successfully`, {
        autoClose: 3000,
        onClose: () => window.location.reload(),
      });
      setVotreXSysApprovalValue(VotreXSysApprovalValue);
    } catch (e) {
      toast.error("Error Approval tokens" + e, {
        autoClose: 3000,
      });
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (/^\d*$/.test(value)) {
      setInterfaceApprovalValue(value);
      setVotreXSysApprovalValue(value);
    }
  };

  const handlevVotreXApprovInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (/^\d*$/.test(value)) {
      setVotreXSysApprovalValue(value);
    }
  };

  return (
    <div className="token-control-container">
      <section>
        <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border z-2 border-base-300 flex flex-col mt-10 relative">
          <div className="flex justify-center items-center h-[3rem] w-[8rem] bg-base-300 absolute self-start rounded-[22px] -top-[38px] left-1/2 transform -translate-x-1/2 z--1 py-[0.65rem] shadow-lg shadow-base-300">
            <div className="flex items-center justify-center space-x-2">
              <p className="my-0 text-sm">Token System</p>
            </div>
          </div>
          <div className="p-5 divide-y divide-base-300"></div>
          <ToastContainer />
          <div className="button-container">
            <br />
            <div className="title-md">Change Token System State:</div>
            <div className="button-group">
              <button className="btn btn-sm btn-primary" onClick={activateTokenFunction}>
                Activate
              </button>
              <button className="btn btn-sm btn-warning" onClick={pauseTokenFunction}>
                Pause
              </button>
            </div>
            <br />
            <div className="title-md"> Token Supply Control: </div>
            <div className="button-group">
              <button className="btn btn-sm btn-danger" onClick={() => setIsBurnModalOpen(true)}>
                Burn
              </button>
              <button className="btn btn-sm btn-primary" onClick={() => setIsMintModalOpen(true)}>
                Mint
              </button>
            </div>
            <br />
            <div className="title-md"> Check Contract Storage: </div>
            <div className="button-group">
              <button className="btn btn-sm btn-primary" onClick={handleContractStrgCheck}>
                View Contract Storage
              </button>
            </div>
          </div>

          <br />
          <div className="form-container">
            <form className="form" onSubmit={handleVotreXSysApproval}>
              <label>
                VotreX Approval
                <div className="input-group vertical-center">
                  <input
                    type="number"
                    className="form-control"
                    value={VotreXSysApprovalValue}
                    step="1000"
                    onChange={handlevVotreXApprovInputChange}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm">
                    Approve
                  </button>
                </div>
              </label>
            </form>
            <form className="form" onSubmit={handleSetVotreXAddress}>
              <label className="justify-content-center">
                VotreX System Contract Address
                <div className="input-group vertical-center">
                  <input
                    id="VotreXAddress"
                    name="VotreXAddress"
                    type="text"
                    className="form-control"
                    value={votreXAddress}
                    onChange={e => setVotreXAddress(e.target.value)}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm">
                    Set
                  </button>
                </div>
              </label>
            </form>
          </div>
        </div>
      </section>
      <br />
      <br />
      <section className="VotreXSys-section">
        <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 flex flex-col mt-10 relative">
          <div className="flex justify-center items-center h-[3rem] w-[8rem] bg-base-300 absolute self-start rounded-[22px] -top-[38px] left-1/2 transform -translate-x-1/2 z--1 py-[0.65rem] shadow-lg shadow-base-300">
            <div className="flex items-center justify-center space-x-2">
              <p className="my-0 text-sm">VotreX System</p>
            </div>
          </div>
          <div className="p-5 divide-y divide-base-300"></div>
          <div className="title-md">Change VotreX System State:</div>
          <div className="button-group">
            <button className="btn btn-sm btn-primary" onClick={ChangeVotreXSysStatusFunction}>
              Change VotreX System State
            </button>
          </div>
          <br />
          <br />
        </div>
      </section>

      <BurnModal isOpen={isBurnModalOpen} onClose={() => setIsBurnModalOpen(false)} onBurn={handleBurnTokens} />
      <MintModal isOpen={isMintModalOpen} onClose={() => setIsMintModalOpen(false)} onMint={handleMintTokens} />
      <ContractStorageModal
        isOpen={isContractStrgModalOpen}
        onClose={() => setIsContractStrgModalOpen(false)}
        authorized={contractStorageData.Authorized}
        VotreXContract={contractStorageData.VotreXContract}
      />
    </div>
  );
};

export default TokenControl;
