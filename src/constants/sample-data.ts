// Placeholder content for building the screens before the API exists.
import { ringgit } from "@/lib/money";
import type { Recipient, Transaction } from "@/services/api/types";

export const SAMPLE_RECIPIENTS: Recipient[] = [
  { id: "r1", name: "Wei Jie Tan", type: "BANK_ACCOUNT", accountId: "5123456789", bankCode: "MBB", bankName: "Maybank", isFavourite: true },
  { id: "r2", name: "Priya Raman", type: "DUITNOW_MOBILE", accountId: "60123456789", bankName: "DuitNow · Mobile" },
  { id: "r3", name: "Hafiz Ismail", type: "BANK_ACCOUNT", accountId: "7001234567", bankCode: "CIMB", bankName: "CIMB", isFavourite: true },
  { id: "r4", name: "Mei Ling Wong", type: "BANK_ACCOUNT", accountId: "3209876543", bankCode: "PBB", bankName: "Public Bank" },
  { id: "r5", name: "Daniel Lee", type: "DUITNOW_MOBILE", accountId: "60198765432", bankName: "DuitNow · Mobile" },
  { id: "r6", name: "Siti Abdullah", type: "BANK_ACCOUNT", accountId: "2145678901", bankCode: "RHB", bankName: "RHB" },
];

const hoursAgo = (hours: number): string => new Date(Date.now() - hours * 3_600_000).toISOString();

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  { id: "t1", reference: "RYT0001", direction: "debit", amount: ringgit(45), counterparty: SAMPLE_RECIPIENTS[0], note: "Dinner split", createdAt: hoursAgo(2), status: "completed" },
  { id: "t2", reference: "RYT0002", direction: "credit", amount: ringgit(120), counterparty: SAMPLE_RECIPIENTS[1], note: "Concert", createdAt: hoursAgo(5), status: "completed" },
  { id: "t3", reference: "RYT0003", direction: "debit", amount: ringgit(1_200), counterparty: SAMPLE_RECIPIENTS[3], note: "Rent", createdAt: hoursAgo(26), status: "completed" },
  { id: "t4", reference: "RYT0004", direction: "debit", amount: ringgit(18.9), counterparty: SAMPLE_RECIPIENTS[2], note: "Coffee", createdAt: hoursAgo(30), status: "completed" },
  { id: "t5", reference: "RYT0005", direction: "credit", amount: ringgit(60), counterparty: SAMPLE_RECIPIENTS[4], createdAt: hoursAgo(52), status: "completed" },
  { id: "t6", reference: "RYT0006", direction: "debit", amount: ringgit(250), counterparty: SAMPLE_RECIPIENTS[5], note: "Groceries", createdAt: hoursAgo(75), status: "completed" },
  { id: "t7", reference: "RYT0007", direction: "debit", amount: ringgit(32), counterparty: SAMPLE_RECIPIENTS[0], note: "Badminton court", createdAt: hoursAgo(98), status: "completed" },
];
