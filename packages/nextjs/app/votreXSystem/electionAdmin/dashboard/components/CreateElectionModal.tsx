import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useBlockNumber, useWalletClient } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
}

const CreateElectionModal: React.FC<Props> = ({ isOpen, onClose, onCreate }) => {
  const { data: walletClient } = useWalletClient();
  const [orgID, setOrgID] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    electionName: "",
    electionID: "",
    candidateCounts: 0,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrgID(localStorage.getItem("orgID"));
    }
  }, [walletClient]);

  const { writeContractAsync: createElection } = useScaffoldWriteContract("VotreXSystem");

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: name === "candidateCounts" ? Number(value) : value,
    }));
  };

  const { data, error } = useBlockNumber();
  const handleCreateElection = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await createElection(
        {
          functionName: "createElection",
          args: [orgID as string, formData.electionID, formData.electionName, formData.candidateCounts as number],
        },
        {
          onBlockConfirmation: txnReceipt => {
            toast.success(
              `Success creating election, Receipt: ` + txnReceipt.blockHash + txnReceipt.cumulativeGasUsed,
              {
                autoClose: 3000,
                onClose: () => window.location.reload(),
              },
            );
          },
          // onError: error => {
          //   toast.error(`Can't create electiion: ${error?.cause}`);
          // },
        },
      );
      onCreate();
    } catch (e) { }
  };

  const handleOutsideClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-container" onClick={handleOutsideClick}>
      <div className="bg-base-100 modal-content">
        <form onSubmit={handleCreateElection}>
          <ToastContainer />
          <div>
            <label className="space-y-2">
              Election ID:
              <input
                id="electionID"
                name="electionID"
                className="input form-control input-bordered"
                style={{ color: "black" }}
                value={formData.electionID}
                onChange={handleInputChange}
                required
              />
            </label>
            <br />
            <label className="space-y-2">
              Election Name:
              <input
                id="electionName"
                name="electionName"
                className="input form-control input-bordered"
                style={{ color: "black" }}
                value={formData.electionName}
                onChange={handleInputChange}
                required
              />
            </label>
            <br />

            <label className="space-y-2">
              Candidate Counts:
              <input
                id="candidateCounts"
                name="candidateCounts"
                type="range"
                min={1}
                max="5"
                value={formData.candidateCounts}
                className="range range-sm range-accent px-3"
                step="1"
                onChange={handleInputChange}
              />
              <div className="flex w-full justify-between px-3 text-sm">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </label>
            <br />
          </div>
          <button type="submit" className="btn btn-sm btn-primary">
            Create
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateElectionModal;
