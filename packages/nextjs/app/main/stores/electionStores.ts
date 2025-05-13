import { create } from 'zustand';

export interface Election {
  electionID: string;
  electionName: string;
  electionStatus: string;
}

export interface ElectionDetails {
  electionID: string;
  electionName: string;
  waveNumber: number;
  totalCandidates: number;
  candidateLimit: number;
  candidateIDs: bigint[];
  candidateNames: string[];
  voteCounts: number[];
  totalParticipants: number;
  electionStatus: string;
  electionMode: string;
}

export interface ElectionResult {
  isPruned: boolean;
  adminAddress: string;
  waveNumber: number;
  startTime: bigint;
  endTime: bigint;
  totalVoter: number;
  electionID: string;
  electionName: string;
  digitalSignature: string;
  registeredOrganization: string;
  electionWinner: string;
  signedBy: string;
  candidates: {
    candidateID: bigint;
    name: string;
    voteCount: number;
  }[];
}

export interface CandidateResult {
  electionID: string;
  candidateName: string;
  voteCount: number;
}

export interface ElectionStore {
  orgID: string | null;
  electionOverviewData: Election[];
  selectedElection: ElectionDetails | null;
  electionResult: ElectionResult | null;
  candidateName: string;
  passedCandidates: CandidateResult[] | null;
  isMobile: boolean;
  hasVotedCheck: boolean | null;

  setOrgID: (val: string | null) => void;
  setelectionOverviewData: (val: Election[]) => void;
  setSelectedElection: (val: ElectionDetails | null) => void;
  setElectionResult: (val: ElectionResult | null) => void;
  setCandidateName: (val: string) => void;
  setPassedCandidates: (val: CandidateResult[] | null) => void;
  setIsMobile: (val: boolean) => void;
  setHasVotedCheck: (val: boolean | null) => void;
}

export const useElectionStore = create<ElectionStore>(set => ({
  orgID: null,
  electionOverviewData: [],
  selectedElection: null,
  electionResult: null,
  candidateName: '',
  passedCandidates: null,
  isMobile: false,
  hasVotedCheck: null,
  isAdmin: null,

  setOrgID: (val) => set({ orgID: val }),
  setelectionOverviewData: (val) => set({ electionOverviewData: val }),
  setSelectedElection: (val) => set({ selectedElection: val }),
  setElectionResult: (val) => set({ electionResult: val }),
  setCandidateName: (val) => set({ candidateName: val }),
  setPassedCandidates: (val) => set({ passedCandidates: val }),
  setIsMobile: (val) => set({ isMobile: val }),
  setHasVotedCheck: (val) => set({ hasVotedCheck: val }),
}));
