import React, { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onBurn: (burnAmount: bigint) => void;
}

const BurnModal: React.FC<Props> = ({ isOpen, onClose, onBurn }) => {
  const [burnAmount, setBurnAmount] = useState<string>("");

  const handleBurn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const burnAmountBigInt = BigInt(burnAmount);
    onBurn(burnAmountBigInt);
    setBurnAmount("");
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (/^\d*$/.test(value)) {
      setBurnAmount(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-container">
      <div className="modal-content">
        <h2 className="text-theme">Burn Tokens</h2>
        <form onSubmit={handleBurn}>
          <label className="text-theme">
            Amount to Burn:
            <input
              type="number"
              className="modal-form-control"
              style={{ justifyItems: "center" }}
              value={burnAmount}
              onChange={handleInputChange}
              min="0"
              step="100"
              required
            />
          </label>
          <p className="text-theme" style={{ textAlign: "center", marginBottom: "15px" }}>
            Feel free to not input number with 18 decimal,
          </p>
          <p className="text-theme" style={{ textAlign: "center", marginBottom: "15px" }}>
            input like this: 200 VOX will be acceptable
          </p>
          <button type="submit" className="btn btn-sm btn-danger">
            Confirm Burn
          </button>
          <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default BurnModal;
