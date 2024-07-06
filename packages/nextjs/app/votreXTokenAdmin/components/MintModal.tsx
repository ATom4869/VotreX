import React, { useState } from "react";
import { Address } from "viem";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onMint: (MintDestinationAddr: Address, mintAmount: bigint) => void;
}

const MintModal: React.FC<Props> = ({ isOpen, onClose, onMint }) => {
  const [mintAmount, setMintAmount] = useState<string>("");
  const [mintDestination, setMintDestination] = useState<string>("");

  const handleMint = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const mintAmountBigInt = BigInt(mintAmount);
    onMint(mintDestination as Address, mintAmountBigInt);
    setMintDestination("");
    setMintAmount("");
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (/^\d*$/.test(value)) {
      setMintAmount(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-container">
      <div className="modal-content">
        <h2 className="text-theme">Mint Tokens</h2>
        <form onSubmit={handleMint}>
          <label className="text-theme">
            Destination:
            <input
              type="text"
              className="modal-form-control"
              style={{ justifyItems: "center" }}
              value={mintDestination}
              onChange={e => setMintDestination(e.target.value)}
            />
          </label>
          <label className="text-theme">
            Amount to Mint:
            <input
              type="number"
              className="modal-form-control"
              style={{ justifyItems: "center" }}
              value={mintAmount}
              onChange={handleInputChange}
              min="0"
              step="100"
              required
            />
          </label>
          <p className="text-theme" style={{ textAlign: "center", marginBottom: "15px" }}>
            Please input number with 18 decimal,
          </p>
          <button type="submit" className="btn btn-sm btn-danger">
            Confirm Mint
          </button>
          <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default MintModal;
