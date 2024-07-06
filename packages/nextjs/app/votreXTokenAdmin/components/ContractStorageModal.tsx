import React from "react";
import "./ContractStorageModal.css";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  authorized: string;
  stakingContract: string;
  dexContract: string;
  VotreXContract: string;
  interfaceContract: string;
  AirdropContract: string;
}

const ContractStorageModal: React.FC<Props> = ({
  isOpen,
  onClose,
  authorized,
  stakingContract,
  dexContract,
  VotreXContract,
  interfaceContract,
  AirdropContract,
}) => {
  if (!isOpen) return null;

  return (
    <div className="Contract-modal-container">
      <button className="close-button" onClick={onClose}>
        <FontAwesomeIcon icon={faCircleXmark} />
      </button>
      <div className="bg-base-100 Contract-modal-content">
        <div className="scrollable-content">
          <div className="Authorized-container">
            <h2>Authorized</h2>
            <label className="title-md">{authorized}</label>
          </div>
          <br />
          <div className="Staking-container">
            <h2>Staking Contract</h2>
            <label className="title-md">{stakingContract}</label>
          </div>
          <br />
          <div className="DEx-container">
            <h2>DEx Contract</h2>
            <label className="title-md">{dexContract}</label>
          </div>
          <br />
          <div className="VotreXAddr-container">
            <h2>VotreX Contract</h2>
            <label className="title-md">{VotreXContract}</label>
          </div>
          <br />
          <div className="Interface-container">
            <h2>Interface Contract</h2>
            <label className="title-md">{interfaceContract}</label>
          </div>
          <br />
          <div className="Airdrop-container">
            <h2>Airdrop Contract</h2>
            <label className="title-md">{AirdropContract}</label>
          </div>
          <br />
        </div>
      </div>
    </div>
  );
};

export default ContractStorageModal;
