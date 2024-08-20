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
  const { writeContractAsync: TokenWithdrawals } = useScaffoldWriteContract("VotreXTXInterface");

  const { data: InterfaceContract } = useScaffoldContract({
    contractName: "VotreXTXInterface",
    walletClient,
  });

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
    stakingContract: "",
    dexContract: "",
    VotreXContract: "",
    interfaceContract: "",
    AirdropContract: "",
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

  const ChangeInterfaceStateFunction = async () => {
    try {
      const status = await InterfaceContract?.read.isActivatedInterfaceCheck();
      if (status) {
        await InterfaceContract?.write.changeSystemState();
        toast.success("Paused successfully", {
          autoClose: 3000,
          onClose: () => window.location.reload(),
        });
      } else {
        await InterfaceContract?.write.changeSystemState();
        toast.success("Activating interface successfully", {
          autoClose: 3000,
          onClose: () => window.location.reload(),
        });
      }
    } catch (e) {
      toast.error("Error changing system state", {
        autoClose: 3000,
      });
      console.error("Error changing system state:", e);
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
    const Interfacestatus = await InterfaceContract?.read.isActivatedInterfaceCheck();
    const TokenStatus = await VotreXTokenT2Contract?.read.paused();
    const formattedInterfaceStatus = Interfacestatus ? "Active" : "Paused";
    const formattedTokensStatus = TokenStatus ? "Paused" : "Active";

    try {
      if (!Interfacestatus && TokenStatus) {
        await VotreXTokenT2Contract?.write.setVotreXContract([votreXAddress as Address]);
        await InterfaceContract?.write.setVotreXSys([votreXAddress as Address]);
        toast.success("VotreX System Contract Address set successfully", {
          autoClose: 3000,
          onOpen: () => setVotreXAddress(""),
        });
      }
      if (!Interfacestatus && !TokenStatus) {
        toast.error("Token Status is " + formattedTokensStatus + " Please Pause first", {
          autoClose: 3000,
        });
      }
      if (Interfacestatus && TokenStatus) {
        toast.error("Interface Sys Status is " + formattedInterfaceStatus + " Please Pause first", {
          autoClose: 3000,
        });
      }
      if (Interfacestatus && !TokenStatus) {
        toast.error(
          "Interface Sys Status is " +
          formattedTokensStatus +
          " & Token System Status is " +
          formattedInterfaceStatus +
          " Please Pause both first",
          {
            autoClose: 3000,
          },
        );
      }
    } catch (error) {
      toast.error("Error setting VotreX System Contract Address", {
        autoClose: 3000,
      });
    }
  };

  const handleBalanceTransferAmount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const accountDestination = destinationAddress;
    const VotreXAdress = VotreXSysContract?.address;
    const OwnerAddress = await VotreXSysContract?.read.getOwnerAddress();
    const balanceTransferAmountBigInt = BigInt(balanceTransferAmount);
    try {
      if (accountDestination === VotreXAdress) {
        await InterfaceContract?.write.balanceTx([accountDestination, balanceTransferAmountBigInt]);
        toast.success(`Success transfered ${balanceTransferAmountBigInt} VOX to ${accountDestination}`, {
          autoClose: 3000,
          onOpen: () => setBalanceTransferAmount(""),
          onClose: () => setDestinationAddress(""),
        });
      }
      if (accountDestination === OwnerAddress) {
        await InterfaceContract?.write.balanceTx([accountDestination, balanceTransferAmountBigInt]);
        toast.success(`Success transfered ${balanceTransferAmountBigInt} VOX to ${accountDestination}`, {
          autoClose: 3000,
          onClose: () => window.location.reload(),
        });
      }
    } catch (error) {
      toast.error("Token transfer Error.", {
        autoClose: 3000,
      });
      console.error("Error Token transfer:", error);
    }
  };

  const handleVotreXWithdrawalAmount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const TokenBalanceTransferAmountBigInt = BigInt(balanceWithdrawalsAmount);
    const VotreXaddr = VotreXSysContract?.address;
    try {
      await TokenWithdrawals(
        {
          functionName: "TokenWithdraw",
          args: [TokenBalanceTransferAmountBigInt],
        },
        {
          onBlockConfirmation: txnReceipt => {
            console.log("📦 Transaction blockHash", txnReceipt.blockHash);
            toast.success(
              `Success transfered ${TokenBalanceTransferAmountBigInt} VOX from ` +
              VotreXaddr +
              " to Admin Address, Receipt: " +
              txnReceipt.blockHash +
              txnReceipt.cumulativeGasUsed,
              {
                autoClose: 3000,
                onClose: () => window.location.reload(),
              },
            );
          },
        },
      );
      await VotreXControl(
        {
          functionName: "withdrawFees",
        },
        {
          onBlockConfirmation: txnReceipt => {
            toast.success(
              `Success withdrawn all ETH to Admin Address, Receipt: ` +
              txnReceipt.blockHash +
              txnReceipt.cumulativeGasUsed,
              {
                autoClose: 3000,
                onClose: () => window.location.reload(),
              },
            );
          },
        },
      );
    } catch (error) { }
  };

  const handleSetInterfaceContract = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const TokenStatus = await VotreXTokenT2Contract?.read.paused();
    const formattedTokenStatus = TokenStatus ? "Paused" : "Active";

    try {
      if (TokenStatus) {
        await VotreXTokenT2Contract?.write.setInterface([interfaceContract as Address]);
        toast.success("Interface Contract Address set successfully", {
          autoClose: 3000,
          onOpen: () => setInterfaceContract(""),
        });
      } else {
        toast.error("Token Status is still " + formattedTokenStatus + " Please Pause first", {
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("Error setting Interface System Contract Address" + error, {
        autoClose: 3000,
      });
    }
  };

  const handleSetStakingContract = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const Interfacestatus = await InterfaceContract?.read.isActivatedInterfaceCheck();
    const TokenStatus = await VotreXTokenT2Contract?.read.paused();
    const formattedInterfaceStatus = Interfacestatus ? "Active" : "Paused";
    const formattedTokensStatus = TokenStatus ? "Paused" : "Active";

    try {
      if (!Interfacestatus && TokenStatus) {
        await VotreXTokenT2Contract?.write.setStakingContract([votreXAddress as Address]);
        await InterfaceContract?.write.setStakingContract([votreXAddress as Address]);
        toast.success("Setting Staking Contract Address to Token successfully", {
          autoClose: 3000,
          onClose: () => window.location.reload(),
        });
        toast.success("Setting Staking Contract Address to Interface successfully", {
          autoClose: 3000,
          onClose: () => window.location.reload(),
        });
      }
      if (!Interfacestatus && !TokenStatus) {
        toast.error("Token Status is " + formattedTokensStatus + " Please Pause first", {
          autoClose: 3000,
        });
      }
      if (Interfacestatus && TokenStatus) {
        toast.error("Interface Sys Status is " + formattedInterfaceStatus + " Please Pause first", {
          autoClose: 3000,
        });
      }
      if (Interfacestatus && !TokenStatus) {
        toast.error(
          "Interface Sys Status is " +
          formattedTokensStatus +
          " & Token System Status is " +
          formattedInterfaceStatus +
          " Please Pause both first",
          {
            autoClose: 3000,
          },
        );
      }
    } catch (error) {
      toast.error("Error setting VotreX System Contract Address", {
        autoClose: 3000,
      });
    }
  };

  const handleSetDexContract = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const Interfacestatus = await InterfaceContract?.read.isActivatedInterfaceCheck();
    const TokenStatus = await VotreXTokenT2Contract?.read.paused();
    const formattedInterfaceStatus = Interfacestatus ? "Active" : "Paused";
    const formattedTokensStatus = TokenStatus ? "Paused" : "Active";

    try {
      if (!Interfacestatus && TokenStatus) {
        await VotreXTokenT2Contract?.write.setDexContract([votreXAddress as Address]);
        toast.success("DEx Contract Address set successfully to Token Contract", {
          autoClose: 3000,
        });
        await InterfaceContract?.write.setDeX([votreXAddress as Address]);
        toast.success("DEx Contract Address set successfully to Interface Contract", {
          autoClose: 3000,
        });
      }
      if (!Interfacestatus && !TokenStatus) {
        toast.error("Token Status is " + formattedTokensStatus + " Please Pause first", {
          autoClose: 3000,
        });
      }
      if (Interfacestatus && TokenStatus) {
        toast.error("Interface Sys Status is " + formattedInterfaceStatus + " Please Pause first", {
          autoClose: 3000,
        });
      }
      if (Interfacestatus && !TokenStatus) {
        toast.error(
          "Interface Sys Status is " +
          formattedTokensStatus +
          " & Token System Status is " +
          formattedInterfaceStatus +
          " Please Pause both first",
          {
            autoClose: 3000,
          },
        );
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
      const AirdropContractAddr2 = await InterfaceContract?.read.ContractStorage([adminAddress as Address]);

      setContractStorageData({
        Authorized: contractStorage2?.[0] as string,
        stakingContract: contractStorage2?.[1] as string,
        dexContract: contractStorage2?.[2] as string,
        VotreXContract: contractStorage2?.[3] as string,
        interfaceContract: contractStorage2?.[4] as string,
        AirdropContract: AirdropContractAddr2?.[5] as string,
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

  const handleInterfaceApproval = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const approvalValuesinNumber = Number(interfaceApprovalValue);
      await InterfaceContract?.write.approveTxInterface([approvalValuesinNumber]);
      toast.success(`Approved ${approvalValuesinNumber.toString()} tokens for Interface successfully`, {
        autoClose: 3000,
        onOpen: () => setInterfaceApprovalValue(""),
      });
      // setInterfaceApprovalValue(interfaceApprovalValue);
    } catch (error) {
      toast.error("Error Approval tokens", {
        autoClose: 3000,
      });
    }
  };

  const handleVotreXSysApproval = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const approvalValuesinBigInt = BigInt(VotreXSysApprovalValue);
      await InterfaceContract?.write.approveVotreX([approvalValuesinBigInt]);
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
            <form className="form" onSubmit={handleSetInterfaceContract}>
              <label>
                Interface Contract Address
                <div className="input-group vertical-center">
                  <input
                    type="text"
                    className="form-control"
                    value={interfaceContract}
                    onChange={e => setInterfaceContract(e.target.value)}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm">
                    Set
                  </button>
                </div>
              </label>
            </form>
            <form className="form" onSubmit={handleSetStakingContract}>
              <label>
                Staking Contract Address
                <div className="input-group vertical-center">
                  <input
                    type="text"
                    className="form-control"
                    value={stakingContract}
                    onChange={e => setStakingContract(e.target.value)}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm">
                    Set
                  </button>
                </div>
              </label>
            </form>
            <form className="form" onSubmit={handleSetDexContract}>
              <label>
                DEx Contract Address
                <div className="input-group vertical-center">
                  <input
                    type="text"
                    className="form-control"
                    value={dexContract}
                    onChange={e => setDexContract(e.target.value)}
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
      <section className="interface-section">
        <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 flex flex-col mt-10 relative">
          <div className="flex justify-center items-center h-[3rem] w-[9rem] bg-base-300 absolute self-start rounded-[22px] -top-[38px] left-1/2 transform -translate-x-1/2 z--1 py-[0.65rem] shadow-lg shadow-base-300">
            <div className="flex items-center justify-center space-x-2">
              <p className="my-0 text-sm">Interface Control</p>
            </div>
          </div>
          <div className="p-5 divide-y divide-base-300"></div>
          <div className="title-md">Change Interface System State:</div>
          <div className="button-group">
            <button className="btn btn-sm btn-primary" onClick={ChangeInterfaceStateFunction}>
              Change Interface State
            </button>
          </div>

          <div className="form-container">
            <form className="form" onSubmit={handleInterfaceApproval}>
              <label>
                Interface Approval
                <div className="input-group vertical-center">
                  <input
                    type="number"
                    className="form-control"
                    value={interfaceApprovalValue}
                    step="100"
                    onChange={handleInputChange}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm">
                    Approve
                  </button>
                </div>
              </label>
            </form>
          </div>

          <div className="dropdown dropdown-top vertical-center">
            <div tabIndex={0} role="button" className="btn btn btn-primary px-5 py-2">
              Token Transfer
            </div>
            <div
              tabIndex={0}
              className="dropdown-content z-[1] card card-compact w-64 p-2 shadow bg-base-100 text-primary-content text-center"
            >
              <div className="card-body">
                <h3 className="card-title">Balance Token Transfer</h3>
                <p>Feel free to using a non 18 decimal value</p>
                <form className="form" onSubmit={handleBalanceTransferAmount}>
                  <label className="justify-content-center">
                    Destination Address
                    <div className="input-group vertical-center">
                      <input
                        id="destinationAddressDropdown"
                        name="DestinationAddress"
                        className="form-control"
                        value={destinationAddress}
                        onChange={e => setDestinationAddress(e.target.value)}
                      ></input>
                    </div>
                  </label>
                  <label className="justify-content-center">
                    Token Amount
                    <div className="input-group vertical-center">
                      <input
                        id="TransferAmountForm"
                        name="TransferAmount"
                        type="number"
                        className="dropdown form-control"
                        value={balanceTransferAmount}
                        min="0"
                        step="100"
                        max="4000000"
                        onChange={e => setBalanceTransferAmount(e.target.value)}
                      />
                      <button type="submit" className="btn btn-secondary btn-sm">
                        Send
                      </button>
                    </div>
                  </label>
                </form>
              </div>
            </div>
          </div>
          <br />
        </div>
      </section>
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
          <div className="dropdown dropdown-top vertical-center">
            <div tabIndex={0} role="button" className="btn btn btn-primary px-5 py-2">
              VotreX Token Withdraw
            </div>
            <div
              tabIndex={0}
              className="dropdown-content z-[1] card card-compact w-64 p-2 shadow bg-base-100 text-primary-content text-center"
            >
              <div className="card-body">
                <h3 className="card-title">Balance Token Withdrawals</h3>
                <p>Feel free to using a non 18 decimal value</p>
                <form className="form" onSubmit={handleVotreXWithdrawalAmount}>
                  <label className="justify-content-center">
                    Token Amount
                    <div className="input-group vertical-center">
                      <input
                        id="TransferAmountForm"
                        name="TransferAmount"
                        type="number"
                        className="dropdown form-control"
                        value={balanceWithdrawalsAmount}
                        min="0"
                        max="4000000"
                        onChange={e => setBalanceWithdrawalsAmount(e.target.value)}
                      />
                      <button type="submit" className="btn btn-secondary btn-sm">
                        Withdraw
                      </button>
                    </div>
                  </label>
                </form>
              </div>
            </div>
          </div>
          <br />
        </div>
      </section>

      <BurnModal isOpen={isBurnModalOpen} onClose={() => setIsBurnModalOpen(false)} onBurn={handleBurnTokens} />
      <MintModal isOpen={isMintModalOpen} onClose={() => setIsMintModalOpen(false)} onMint={handleMintTokens} />
      <ContractStorageModal
        isOpen={isContractStrgModalOpen}
        onClose={() => setIsContractStrgModalOpen(false)}
        authorized={contractStorageData.Authorized}
        stakingContract={contractStorageData.stakingContract}
        dexContract={contractStorageData.dexContract}
        VotreXContract={contractStorageData.VotreXContract}
        interfaceContract={contractStorageData.interfaceContract}
        AirdropContract={contractStorageData.AirdropContract}
      />
    </div>
  );
};

export default TokenControl;
