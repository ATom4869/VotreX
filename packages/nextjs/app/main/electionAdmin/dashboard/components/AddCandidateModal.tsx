import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface AddCandidateModalProps {
    isOpen: boolean;
    onClose: () => void;
    electionID: string;
}

const AddCandidateModal: React.FC<AddCandidateModalProps> = ({ isOpen, onClose, electionID }) => {
    const [candidateName, setCandidateName] = useState("");
    const { writeContractAsync: VOXCommand } = useScaffoldWriteContract("TestCompleXA2C");

    const handleAddCandidate = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!candidateName.trim()) {
            toast.error("Nama kandidat tidak boleh kosong!");
            return;
        }

        try {
            await VOXCommand(
                {
                    functionName: "addCandidateDetail",
                    args: [electionID, candidateName],
                },
                {
                    onBlockConfirmation: txnReceipt => {
                        toast.success(`Kandidat ${candidateName} berhasil ditambahkan!`, {
                            autoClose: 2000,
                            onClose: () => {
                                setCandidateName("");
                                onClose();
                            },
                        });
                    },
                }
            );
        } catch (error) {
        }
    };

    const handleOutsideClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-35 flex items-center justify-center z-50" onClick={handleOutsideClick}>
            <div className="bg-base-100 p-6 rounded-lg shadow-lg w-1/3">
                <h2 className="text-xl font-bold mb-4">Tambah Kandidat</h2>
                <form onSubmit={handleAddCandidate}>
                    <label className="block mb-2 font-medium">Nama Kandidat:</label>
                    <input
                        type="text"
                        placeholder="Masukkan nama kandidat"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        className="input input-bordered w-full mb-4"
                    />
                    <div className="flex justify-end">
                        <button type="button" onClick={onClose} className="btn btn-secondary mr-2">Batal</button>
                        <button type="submit" className="btn btn-primary">Tambahkan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCandidateModal;
