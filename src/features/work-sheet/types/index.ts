export type WorkStatus = "open" | "in_progress" | "partially_paid" | "paid" | "cancelled";
export type FinancialStatus = "unpaid" | "partial" | "paid" | "overpaid" | "cancelled";
export type DepositType = "percentage" | "fixed";
export type PaymentType = "deposit" | "installment" | "final" | "manual";

export interface WorkParticipantDraft {
  id?: string;
  name: string;
  amount: number;
  shareAmount?: number;
  depositType?: DepositType;
  depositValue?: number;
}

export interface WorkParticipant extends WorkParticipantDraft {
  id: string;
  amount: number;
  shareAmount: number;
  depositType: DepositType;
  depositValue: number;
  depositAmount: number;
  paidAmount: number;
  remainingAmount: number;
  financialStatus: FinancialStatus;
}

export interface WorkPayment {
  id: string;
  workItemId: string;
  participantId: string;
  participantName: string;
  clientId?: string;
  clientName?: string;
  amount: number;
  paymentType: PaymentType;
  paymentDate: string;
  note?: string;
  proofUrl?: string;
  createdByUid: string;
  createdByName: string;
  createdAt: string;
}

export interface WorkItemDraft {
  workDate: string;
  title?: string;
  workTitle: string;
  workDetail?: string;
  workLink?: string;
  clients: WorkParticipantDraft[];
  participants?: WorkParticipantDraft[];
  jobPrice: number;
  depositType?: DepositType;
  depositValue?: number;
  depositRate?: number;
  revisionCount: number;
  revisionFee: number;
  note?: string;
  attachmentUrl?: string;
  status: WorkStatus;
}

export interface WorkItem extends WorkItemDraft {
  id: string;
  title: string;
  workTitle: string;
  workLink?: string;
  clients: WorkParticipant[];
  participants: WorkParticipant[];
  participantCount: number;
  depositType: DepositType;
  depositValue: number;
  depositRate: number;
  depositAmount: number;
  remainingAfterDeposit: number;
  revisionTotal: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  financialStatus: FinancialStatus;
  createdByUid: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export type WorkItemStatus = WorkStatus;
export type WorkItemClientDraft = WorkParticipantDraft;
export type WorkItemClient = WorkParticipant;
export type WorkItemPayment = WorkPayment;
