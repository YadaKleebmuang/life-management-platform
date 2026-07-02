import { db } from "@/lib/firebase";
import { collection, doc, getDocs, query, orderBy, runTransaction, where } from "firebase/firestore";
import { Debt, DebtRepayment, Transaction as AppTransaction, AccountSnapshot, Account, DebtStatus } from "../types";
import { stripUndefinedFields } from "../utils/stripUndefinedFields";

export const getDebts = async (userId: string): Promise<Debt[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, "users", userId, "debts"),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  const debts: Debt[] = [];
  querySnapshot.forEach((doc) => {
    debts.push(doc.data() as Debt);
  });
  return debts;
};

export const getDebtRepayments = async (userId: string, debtId: string): Promise<DebtRepayment[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, "users", userId, "debtRepayments"),
    where("debtId", "==", debtId),
    orderBy("repaymentDate", "desc")
  );
  const querySnapshot = await getDocs(q);
  const repayments: DebtRepayment[] = [];
  querySnapshot.forEach((doc) => {
    repayments.push(doc.data() as DebtRepayment);
  });
  return repayments;
};

export const saveDebt = async (userId: string, debt: Debt): Promise<void> => {
  if (!userId) return;

  await runTransaction(db, async (transaction) => {
    const accountRef = doc(db, "users", userId, "accounts", debt.relatedAccountId);
    const accountDoc = await transaction.get(accountRef);
    
    if (!accountDoc.exists()) {
      throw new Error("Account does not exist!");
    }
    
    const accountData = accountDoc.data() as Account;
    
    let newBalance = accountData.currentBalance;
    let transactionAmount = 0;

    if (debt.debtType === "borrowed") {
      // We borrowed money, so we received money
      newBalance += debt.amount;
      transactionAmount = debt.amount;
    } else if (debt.debtType === "lent") {
      // We lent money, so money left our account
      newBalance -= debt.amount;
      transactionAmount = -debt.amount;
    }

    const now = new Date().toISOString();

    // 1. Update Account Balance
    transaction.update(accountRef, { currentBalance: newBalance, updatedAt: now });

    // 2. Save Debt
    const debtRef = doc(db, "users", userId, "debts", debt.id);
    transaction.set(debtRef, stripUndefinedFields(debt));

    // 3. Create Transaction Record
    const txId = crypto.randomUUID();
    const appTx: AppTransaction = {
      id: txId,
      userId,
      type: "debt_created",
      accountId: debt.relatedAccountId,
      relatedDocumentId: debt.id,
      amount: transactionAmount,
      title: debt.debtType === "borrowed" ? `ยืมเงินจาก: ${debt.personName}` : `ให้ยืมเงิน: ${debt.personName}`,
      description: debt.note,
      transactionDate: now,
      createdAt: now,
    };
    transaction.set(doc(db, "users", userId, "transactions", txId), stripUndefinedFields(appTx));

    // 4. Create Account Snapshot
    const snapId = crypto.randomUUID();
    const snapshot: AccountSnapshot = {
      id: snapId,
      userId,
      accountId: debt.relatedAccountId,
      accountName: accountData.accountName,
      balance: newBalance,
      snapshotDate: now,
      sourceType: "debt_created",
      sourceId: debt.id,
      createdAt: now,
    };
    transaction.set(doc(db, "users", userId, "accountSnapshots", snapId), stripUndefinedFields(snapshot));
  });
};

export const repayDebt = async (userId: string, repayment: DebtRepayment): Promise<void> => {
  if (!userId) return;

  await runTransaction(db, async (transaction) => {
    // 1. Get the debt
    const debtRef = doc(db, "users", userId, "debts", repayment.debtId);
    const debtDoc = await transaction.get(debtRef);

    if (!debtDoc.exists()) {
      throw new Error("Debt record not found");
    }

    const debtData = debtDoc.data() as Debt;

    if (repayment.amount > debtData.remainingAmount) {
      throw new Error("Repayment amount cannot exceed remaining debt amount");
    }

    // 2. Get the account used for repayment
    const accountRef = doc(db, "users", userId, "accounts", repayment.accountId);
    const accountDoc = await transaction.get(accountRef);

    if (!accountDoc.exists()) {
      throw new Error("Account used for repayment not found");
    }

    const accountData = accountDoc.data() as Account;

    let newBalance = accountData.currentBalance;
    let transactionAmount = 0;

    if (debtData.debtType === "borrowed") {
      // We are paying back the borrowed money -> money leaves our account
      if (newBalance < repayment.amount) {
        throw new Error("Insufficient balance to repay debt");
      }
      newBalance -= repayment.amount;
      transactionAmount = -repayment.amount;
    } else if (debtData.debtType === "lent") {
      // We are receiving money back that we lent -> money enters our account
      newBalance += repayment.amount;
      transactionAmount = repayment.amount;
    }

    const now = new Date().toISOString();

    // 3. Update Account Balance
    transaction.update(accountRef, { currentBalance: newBalance, updatedAt: now });

    // 4. Update Debt remaining amount and status
    const newRemainingAmount = debtData.remainingAmount - repayment.amount;
    let newStatus: DebtStatus = "partially_paid";
    if (newRemainingAmount === 0) {
      newStatus = "paid";
    }

    transaction.update(debtRef, {
      remainingAmount: newRemainingAmount,
      status: newStatus,
      updatedAt: now
    });

    // 5. Save Repayment record
    const repaymentRef = doc(db, "users", userId, "debtRepayments", repayment.id);
    transaction.set(repaymentRef, stripUndefinedFields(repayment));

    // 6. Create Transaction Record
    const txId = crypto.randomUUID();
    const appTx: AppTransaction = {
      id: txId,
      userId,
      type: "debt_repayment",
      accountId: repayment.accountId,
      relatedDocumentId: repayment.id,
      amount: transactionAmount,
      title: debtData.debtType === "borrowed" ? `คืนเงินให้: ${debtData.personName}` : `รับเงินคืนจาก: ${debtData.personName}`,
      description: repayment.note,
      transactionDate: repayment.repaymentDate,
      createdAt: now,
    };
    transaction.set(doc(db, "users", userId, "transactions", txId), stripUndefinedFields(appTx));

    // 7. Create Account Snapshot
    const snapId = crypto.randomUUID();
    const snapshot: AccountSnapshot = {
      id: snapId,
      userId,
      accountId: repayment.accountId,
      accountName: accountData.accountName,
      balance: newBalance,
      snapshotDate: repayment.repaymentDate,
      sourceType: "debt_repayment",
      sourceId: repayment.id,
      createdAt: now,
    };
    transaction.set(doc(db, "users", userId, "accountSnapshots", snapId), stripUndefinedFields(snapshot));
  });
};
