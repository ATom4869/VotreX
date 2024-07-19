"use client";

import React, { useEffect, useState } from "react";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useWalletClient } from "wagmi";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const TokenInfo = () => {
  const { data: walletClient } = useWalletClient();
  const { data: VotreXToken } = useScaffoldContract({
    contractName: "VotreXToken",
    walletClient,
  });

  const { data: VotreXTokenMAXSupply } = useScaffoldReadContract({
    contractName: "VotreXToken",
    functionName: "MAXSupply",
  });

  const { data: VotreXStatus } = useScaffoldReadContract({
    contractName: "VotreXSystem",
    functionName: "isVotreXActivated",
    account: walletClient?.account.address,
  });

  const tokenAddrData = VotreXToken?.address;

  const { data: InterfaceContract } = useScaffoldContract({
    contractName: "VotreXTXInterface",
    walletClient,
  });

  const { data: VotreXTokenOwner } = useScaffoldReadContract({
    contractName: "VotreXToken",
    functionName: "getOwnerAddress",
    account: walletClient?.account.address,
  });

  const { data: TokencirculatingSupply } = useScaffoldReadContract({
    contractName: "VotreXToken",
    functionName: "totalSupply",
  });

  const { data: contractTokenBalance } = useScaffoldReadContract({
    contractName: "VotreXToken",
    functionName: "balanceOf",
    args: [VotreXToken?.address],
  });

  const { data: contractVotreXTokenBalance } = useScaffoldReadContract({
    contractName: "VotreXSystem",
    functionName: "CheckTokenETHBalance",
  });

  const { data: contractVotreXVOXTokenBalance } = useScaffoldReadContract({
    contractName: "VotreXSystem",
    functionName: "CheckTokenBalance",
  });

  const [tokenName, setTokenName] = useState<string | null>(null);
  const [tokenAddr, setTokenAddr] = useState<string | null>(null);
  const [tokenOwner, setTokenOwner] = useState<string | null>(null);
  const [tokenSymbol, setTokenSymbol] = useState<string | null>(null);
  const [tokenSupply, setTokenSupply] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<string | null>(null);
  const [interfaceStatus, setinterfaceStatus] = useState<string | null>(null);
  const [votreXStatusState, setVotreXStatusState] = useState<string | null>(null);
  const [circulatingSupply, setcirculatingSupply] = useState<string | null>(null);
  const [contractBalance, setcontractBalance] = useState<string | null>(null);
  const [contractBalanceVotreX, setContractBalanceVotreX] = useState<string | null>(null);
  const [contractVOXBalanceVotreX, setContractVOXBalanceVotreX] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string>("");

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        const tokenAddrData = (await VotreXToken?.address) as string;

        const formattedAddress = (address: string) => {
          if (!address) return "Loading...";
          const firstPart = address.slice(0, 6);
          const lastPart = address.slice(-4);
          return `${firstPart}...${lastPart}`;
        };

        setTokenAddr(formattedAddress(tokenAddrData));

        const tokenNameData = (await VotreXToken?.read.name()) as string;
        setTokenName(tokenNameData);

        const tokenSymbolData = (await VotreXToken?.read.symbol()) as string;
        setTokenSymbol(tokenSymbolData);

        const tokenOwnerData = VotreXTokenOwner as string;

        setTokenOwner(formattedAddress(tokenOwnerData as string));

        setTokenSupply(formatTokenSupply(VotreXTokenMAXSupply as bigint, 18));

        const status = await VotreXToken?.read.paused();
        const formattedStatus = status ? "Paused" : "Active";
        setTokenStatus(formattedStatus);

        const interfaceStatus = await InterfaceContract?.read.isActivatedInterfaceCheck();
        const formattedInterfaceStatus = interfaceStatus ? "Active" : "Paused";
        setinterfaceStatus(formattedInterfaceStatus);

        const votreXSysStatus = VotreXStatus;
        const formattedVotreXStatus = votreXSysStatus ? "Active" : "Paused";
        setVotreXStatusState(formattedVotreXStatus);

        const circulatingSupply = TokencirculatingSupply as bigint;
        const formattedcirculatingSupply = formatTokenSupply(circulatingSupply as bigint, 18);

        setcirculatingSupply(formattedcirculatingSupply);

        const contractBalanceData = contractTokenBalance as bigint;
        const formattedContractBalance = formatTokenSupply(contractBalanceData as bigint, 18);
        setcontractBalance(formattedContractBalance);

        const contractVotreXVOXBalanceData = contractVotreXVOXTokenBalance as bigint;
        const formattedcontractVotreXVOXBalance = formatTokenSupply(contractVotreXVOXBalanceData as bigint, 18);
        setContractVOXBalanceVotreX(formattedcontractVotreXVOXBalance);

        const contractVotreXBalanceData = contractVotreXTokenBalance as bigint;
        const formattedcontractVotreXBalance = formatTokenSupply(contractVotreXBalanceData as bigint, 18);
        setContractBalanceVotreX(formattedcontractVotreXBalance);
      } catch (error) {
        console.error("Error fetching token data:", error);
      }
    };

    fetchTokenData();
  }, [
    VotreXToken,
    VotreXTokenMAXSupply,
    InterfaceContract,
    contractTokenBalance,
    TokencirculatingSupply,
    VotreXTokenOwner,
    VotreXStatus,
    contractVotreXTokenBalance,
    contractVotreXVOXTokenBalance,
  ]);

  const formatTokenSupply = (supply: bigint, decimals: number) => {
    const factor = BigInt(10 ** decimals);
    const supplyInMainUnit = Number(supply) / Number(factor);
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(supplyInMainUnit);
  };

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopySuccess("✅");
      setTimeout(() => setCopySuccess(""), 2000);
    } catch (err) {
      setCopySuccess("Failed to copy!");
    }
  };

  return (
    <div className="sticky-card">
      <div className="card w-90 bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <div className="card-title items-center">Token Address:</div>
          <div className="col">
            <div className="flex items-center space-x-2">
              <div className="addressText">{tokenAddr !== null ? tokenAddr : "Loading..."}</div>
              {tokenAddr && (
                <button
                  className="ml-2 p-1 text-accent rounded"
                  onClick={() => copyToClipboard(tokenAddrData as string)}
                >
                  <FontAwesomeIcon icon={faCopy} size="sm" />
                </button>
              )}
            </div>
            {copySuccess && <div className="text-green-500">{copySuccess}</div>}
          </div>
          <div className="row">
            <div className="card-title">Token Name:</div>
            <div>{tokenName !== null ? tokenName : "Loading..."}</div>
          </div>
          <div className="row">
            <div className="card-title">Token Symbol:</div>
            <div>{tokenSymbol !== null ? tokenSymbol : "Loading..."}</div>
          </div>
          <div className="row">
            <div className="card-title">Token Owner:</div>
            <div>{tokenOwner !== null ? tokenOwner : "Loading..."}</div>
          </div>
          <div className="row">
            <div className="card-title">Token Status:</div>
            <div>{tokenStatus !== null ? tokenStatus : "Loading..."}</div>
          </div>
          <div className="row">
            <div className="card-title">Interface Status:</div>
            <div>{interfaceStatus !== null ? interfaceStatus : "Loading..."}</div>
          </div>
          <div className="row">
            <div className="card-title">VotreX Status:</div>
            <div>{votreXStatusState !== null ? votreXStatusState : "Loading..."}</div>
          </div>
          <div className="col">
            <div className="card-title justify-content text-center">MAX Supply:</div>
            <div>{tokenSupply !== null ? tokenSupply.toString() : "Loading..."}</div>
          </div>
          <div className="col">
            <div className="card-title">Circulating Supply:</div>
            <div>{circulatingSupply !== null ? circulatingSupply.toString() : "Loading..."}</div>
          </div>
          <div className="col">
            <div className="card-title">Token Contract Balance:</div>
            <div>{contractBalance !== null ? contractBalance.toString() : "Loading..."}</div>
          </div>
          <div className="col">
            <div className="card-title">VotreX Contract Balance:</div>
            <div>{contractVOXBalanceVotreX !== null ? contractVOXBalanceVotreX.toString() + " VOX" : "Loading..."}</div>
            <div>{contractBalanceVotreX !== null ? contractBalanceVotreX.toString() + " FLR" : "Loading..."}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenInfo;
