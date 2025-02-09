import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useWalletClient } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
}

const CreateElectionModal: React.FC<Props> = ({ isOpen, onClose, onCreate }) => {
  const { data: walletClient } = useWalletClient();
  const [orgID, setOrgID] = useState<string | null>(null);
  const [isHaveCandidateMode, setIsHaveCandidateMode] = useState<boolean>(true); // New state for mode selection
  const [candidateCount, setCandidateCount] = useState<number>(2); // Default 2 candidates

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

  const { writeContractAsync: createElection } = useScaffoldWriteContract("TestCompleXA2C");

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleCreateElection = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isHaveCandidateMode && (candidateCount < 2 || candidateCount > 5)) {
      toast.error("Jumlah kandidat harus antara 2 hingga 5!");
      return;
    }
    console.log('candidateCount: ' + candidateCount)

    try {
      await createElection(
        {
          functionName: "createElection",
          args: [orgID as string, formData.electionID, formData.electionName, candidateCount, isHaveCandidateMode],
        },
        {
          onBlockConfirmation: txnReceipt => {
            toast.success(
              `Success creating election, Receipt: ` + txnReceipt.blockHash + 'gas' + txnReceipt.cumulativeGasUsed,
              {
                autoClose: 2000,
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
      setFormData({
        electionName: "",
        electionID: "",
        candidateCounts: 0,
      })
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-container" onClick={handleOutsideClick}>
      <div className="modal-content">
        <form onSubmit={handleCreateElection}>
          <ToastContainer />
          <div>
            <label className="space-y-2 text-theme">
              ID Pemilihan:
              <input
                id="electionID"
                name="electionID"
                className="input form-control input-bordered"
                value={formData.electionID}
                onChange={handleInputChange}
                required
              />
            </label>
            <br />
            <label className="space-y-2 text-theme">
              Nama Pemilihan:
              <input
                id="electionName"
                name="electionName"
                className="input form-control input-bordered"
                value={formData.electionName}
                onChange={handleInputChange}
                required
              />
            </label>
            <br />
          </div>

          {/* Mode Selection */}
          <div className="mt-4">
            <h3 className="font-bold">Pilih Mode Pemungutan Suara:</h3>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="voteMode"
                  value="true"
                  checked={isHaveCandidateMode}
                  onChange={() => setIsHaveCandidateMode(true)}
                  className="radio radio-primary"
                />
                <span className="ml-2">Gunakan Kandidat</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="voteMode"
                  value="false"
                  checked={!isHaveCandidateMode}
                  onChange={() => setIsHaveCandidateMode(false)}
                  className="radio radio-primary"
                />
                <span className="ml-2">Input Nama Manual</span>
              </label>
            </div>
          </div>

          {/* Candidate Count Selection (Only when "Gunakan Kandidat" is selected) */}
          {isHaveCandidateMode && (
            <div className="mt-4">
              <h3 className="font-medium">Jumlah Kandidat:</h3>
              <input
                type="range"
                min="2"
                max="5"
                value={candidateCount}
                onChange={(e) => setCandidateCount(Number(e.target.value))}
                className="range range-primary w-full"
              />
              <div className="text-center mt-2 text-lg font-bold">{candidateCount} Kandidat</div>
            </div>
          )}

          <button type="submit" className="btn btn-sm btn-primary mt-4">
            Buat Sekarang
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateElectionModal;
