import type { Bank } from "./types";

export const OWN_BANK: Bank = { code: "RYT", name: "Ryt Bank", shortName: "Ryt Bank" };

export const BANKS: readonly Bank[] = [
  OWN_BANK,
  { code: "MBB", name: "Malayan Banking Berhad", shortName: "Maybank" },
  { code: "CIMB", name: "CIMB Bank Berhad", shortName: "CIMB" },
  { code: "PBB", name: "Public Bank Berhad", shortName: "Public Bank" },
  { code: "RHB", name: "RHB Bank Berhad", shortName: "RHB" },
  { code: "HLB", name: "Hong Leong Bank Berhad", shortName: "Hong Leong" },
  { code: "AMB", name: "AmBank (M) Berhad", shortName: "AmBank" },
  { code: "BIMB", name: "Bank Islam Malaysia Berhad", shortName: "Bank Islam" },
  { code: "OCBC", name: "OCBC Bank (Malaysia) Berhad", shortName: "OCBC" },
  { code: "UOB", name: "United Overseas Bank (Malaysia) Bhd", shortName: "UOB" },
];

export const DUITNOW_LABEL = "DuitNow · Mobile";

export const findBank = (code: string | undefined): Bank | undefined => {
  return BANKS.find((bank) => bank.code === code);
};
