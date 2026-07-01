import { db } from "@/lib/firebase";
import { collection, doc, getDocs, getDoc, query, orderBy, setDoc, runTransaction, where, writeBatch } from "firebase/firestore";
import { RecurringTransaction, Income, Expense, Account, AccountSnapshot, Transaction as AppTransaction } from "../types";
import { getAllocation } from "./budgetService";

export const getRecurringTransactions = async (userId: string): Promise<RecurringTransaction[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, "users", userId, "recurringTransactions"),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  const transactions: RecurringTransaction[] = [];
  querySnapshot.forEach((doc) => {
    transactions.push(doc.data() as RecurringTransaction);
  });
  return transactions;
};

export const saveRecurringTransaction = async (userId: string, tx: RecurringTransaction): Promise<void> => {
  if (!userId) return;
  const docRef = doc(db, "users", userId, "recurringTransactions", tx.id);
  await setDoc(docRef, tx);
};

export const deleteRecurringTransaction = async (userId: string, txId: string): Promise<void> => {
  if (!userId) return;

  // 1. Find all related records
  const incomesQ = query(collection(db, "users", userId, "incomes"), where("recurringTransactionId", "==", txId));
  const incomesSnap = await getDocs(incomesQ);

  const expensesQ = query(collection(db, "users", userId, "expenses"), where("recurringTransactionId", "==", txId));
  const expensesSnap = await getDocs(expensesQ);

  const transactionsQ = query(collection(db, "users", userId, "transactions"), where("recurringTransactionId", "==", txId));
  const transactionsSnap = await getDocs(transactionsQ);

  const snapshotsQ = query(collection(db, "users", userId, "accountSnapshots"), where("recurringTransactionId", "==", txId));
  const snapshotsSnap = await getDocs(snapshotsQ);

  // 2. Calculate balance adjustments per account
  const accountAdjustments: Record<string, number> = {};
  
  incomesSnap.forEach((docSnap) => {
    const data = docSnap.data() as Income;
    accountAdjustments[data.accountId] = (accountAdjustments[data.accountId] || 0) - data.amount;
  });
  
  expensesSnap.forEach((docSnap) => {
    const data = docSnap.data() as Expense;
    accountAdjustments[data.accountId] = (accountAdjustments[data.accountId] || 0) + data.amount;
  });

  const batch = writeBatch(db);

  // 3. Apply account adjustments
  for (const accountId of Object.keys(accountAdjustments)) {
    const adjustment = accountAdjustments[accountId];
    if (adjustment !== 0) {
      const accountRef = doc(db, "users", userId, "accounts", accountId);
      const accDoc = await getDoc(accountRef);
      if (accDoc.exists()) {
        const accData = accDoc.data() as Account;
        batch.update(accountRef, { 
          currentBalance: accData.currentBalance + adjustment,
          updatedAt: new Date().toISOString()
        });
      }
    }
  }

  // 4. Delete related records
  incomesSnap.forEach(docSnap => batch.delete(docSnap.ref));
  expensesSnap.forEach(docSnap => batch.delete(docSnap.ref));
  transactionsSnap.forEach(docSnap => batch.delete(docSnap.ref));
  snapshotsSnap.forEach(docSnap => batch.delete(docSnap.ref));

  // 5. Delete the recurring transaction itself
  const docRef = doc(db, "users", userId, "recurringTransactions", txId);
  batch.delete(docRef);

  // 6. Commit batch
  await batch.commit();
};

// Automation function: checks for due recurring transactions and processes them
export const processRecurringTransactions = async (userId: string): Promise<number> => {
  if (!userId) return 0;
  
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  
  // Find active transactions first to avoid index errors, then filter by date in JS
  const q = query(
    collection(db, "users", userId, "recurringTransactions"),
    where("isActive", "==", true)
  );
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return 0;
  
  const allocation = await getAllocation(userId);
  let processedCount = 0;
  
  // We process them sequentially to avoid overlapping transaction conflicts on the same account
  for (const docSnapshot of querySnapshot.docs) {
    const recurringTx = docSnapshot.data() as RecurringTransaction;
    
    // JS filter for date
    if (recurringTx.nextRunDate > today) {
      continue;
    }
    
    // Check end date if exists
    if (recurringTx.endDate && recurringTx.nextRunDate > recurringTx.endDate) {
      // Mark as inactive if passed end date
      await setDoc(docRef(userId, recurringTx.id), { ...recurringTx, isActive: false });
      continue;
    }
    
    try {
      await runTransaction(db, async (transaction) => {
        const now = new Date().toISOString();
        const runDateStr = recurringTx.nextRunDate; // The date it was SUPPOSED to run
        
        if (recurringTx.type === "income" && recurringTx.isSplitBySettings && recurringTx.splitAccounts) {
          const splits = [
            { 
              accountId: recurringTx.splitAccounts.spendingAccountId, 
              amount: recurringTx.amount * (allocation.spendingPercentage / 100),
              suffix: " (ใช้จ่าย)"
            },
            { 
              accountId: recurringTx.splitAccounts.savingsAccountId, 
              amount: recurringTx.amount * (allocation.savingsPercentage / 100),
              suffix: " (เงินออม)"
            },
            { 
              accountId: recurringTx.splitAccounts.emergencyAccountId, 
              amount: recurringTx.amount * (allocation.emergencyFundPercentage / 100),
              suffix: " (ฉุกเฉิน)"
            }
          ].filter(s => s.amount > 0);

          // 1. ALL READS FIRST
          const accountDocsData = [];
          for (const split of splits) {
            const accountRef = doc(db, "users", userId, "accounts", split.accountId);
            const accountDoc = await transaction.get(accountRef);
            if (accountDoc.exists()) {
              accountDocsData.push({
                split,
                accountRef,
                accountData: accountDoc.data() as Account
              });
            }
          }

          // 2. ALL WRITES SECOND
          for (const item of accountDocsData) {
            const { split, accountRef, accountData } = item;
            const newBalance = accountData.currentBalance + split.amount;
            const recordId = crypto.randomUUID();
            
            const newIncome: Income = {
              id: recordId,
              title: `${recurringTx.title}${split.suffix}`,
              amount: split.amount,
              date: runDateStr,
              categoryId: recurringTx.categoryId,
              source: recurringTx.categoryId,
              accountId: split.accountId,
              usageDays: 0,
              note: recurringTx.note,
              recurringTransactionId: recurringTx.id,
              createdAt: now,
            };
            transaction.set(doc(db, "users", userId, "incomes", recordId), newIncome);
            
            transaction.update(accountRef, { currentBalance: newBalance, updatedAt: now });
            
            const appTxId = crypto.randomUUID();
            const appTx: AppTransaction = {
              id: appTxId,
              userId,
              type: "income",
              accountId: split.accountId,
              relatedDocumentId: recordId,
              amount: split.amount,
              title: `${recurringTx.title}${split.suffix}`,
              description: recurringTx.note,
              transactionDate: runDateStr,
              recurringTransactionId: recurringTx.id,
              createdAt: now,
            };
            transaction.set(doc(db, "users", userId, "transactions", appTxId), appTx);
            
            const snapId = crypto.randomUUID();
            const snapshot: AccountSnapshot = {
              id: snapId,
              userId,
              accountId: split.accountId,
              accountName: accountData.accountName,
              balance: newBalance,
              snapshotDate: runDateStr,
              sourceType: "income",
              sourceId: recordId,
              recurringTransactionId: recurringTx.id,
              createdAt: now,
            };
            transaction.set(doc(db, "users", userId, "accountSnapshots", snapId), snapshot);
          }
        } else {
          const accountRef = doc(db, "users", userId, "accounts", recurringTx.accountId);
          const accountDoc = await transaction.get(accountRef);
          
          if (!accountDoc.exists()) {
            console.warn(`Account ${recurringTx.accountId} not found for recurring tx ${recurringTx.id}`);
            // Update next run date anyway to avoid infinite loops, or disable it
            return;
          }
          
          const accountData = accountDoc.data() as Account;
          
          let newBalance = accountData.currentBalance;
          let finalTxAmount = 0;
          
          // 1. Create Income or Expense
          const recordId = crypto.randomUUID();
          
          if (recurringTx.type === "income") {
            newBalance += recurringTx.amount;
            finalTxAmount = recurringTx.amount;
            
            const newIncome: Income = {
              id: recordId,
              title: `${recurringTx.title} (อัตโนมัติ)`,
              amount: recurringTx.amount,
              date: runDateStr,
              categoryId: recurringTx.categoryId,
              source: recurringTx.categoryId,
              accountId: recurringTx.accountId,
              usageDays: 0,
              note: recurringTx.note,
              recurringTransactionId: recurringTx.id,
              createdAt: now,
            };
            transaction.set(doc(db, "users", userId, "incomes", recordId), newIncome);
          } else {
            newBalance -= recurringTx.amount;
            finalTxAmount = -recurringTx.amount;
            
            const newExpense: Expense = {
              id: recordId,
              title: `${recurringTx.title} (อัตโนมัติ)`,
              amount: recurringTx.amount,
              date: runDateStr,
              categoryId: recurringTx.categoryId,
              category: recurringTx.categoryId,
              accountId: recurringTx.accountId,
              note: recurringTx.note,
              recurringTransactionId: recurringTx.id,
              createdAt: now,
            };
            transaction.set(doc(db, "users", userId, "expenses", recordId), newExpense);
          }
          
          // 2. Update Account
          transaction.update(accountRef, { currentBalance: newBalance, updatedAt: now });
          
          // 3. Create Transaction Record
          const appTxId = crypto.randomUUID();
          const appTx: AppTransaction = {
            id: appTxId,
            userId,
            type: recurringTx.type === "income" ? "income" : "expense",
            accountId: recurringTx.accountId,
            relatedDocumentId: recordId,
            amount: finalTxAmount,
            title: `${recurringTx.title} (อัตโนมัติ)`,
            description: recurringTx.note,
            transactionDate: runDateStr,
            recurringTransactionId: recurringTx.id,
            createdAt: now,
          };
          transaction.set(doc(db, "users", userId, "transactions", appTxId), appTx);
          
          // 4. Create Account Snapshot
          const snapId = crypto.randomUUID();
          const snapshot: AccountSnapshot = {
            id: snapId,
            userId,
            accountId: recurringTx.accountId,
            accountName: accountData.accountName,
            balance: newBalance,
            snapshotDate: runDateStr,
            sourceType: recurringTx.type === "income" ? "income" : "expense",
            sourceId: recordId,
            recurringTransactionId: recurringTx.id,
            createdAt: now,
          };
          transaction.set(doc(db, "users", userId, "accountSnapshots", snapId), snapshot);
        }
        
        // 5. Update Recurring Transaction (calculate next run date)
        const nextDate = calculateNextRunDate(runDateStr, recurringTx.frequency);
        const rtRef = doc(db, "users", userId, "recurringTransactions", recurringTx.id);
        transaction.update(rtRef, {
          lastRunDate: runDateStr,
          nextRunDate: nextDate,
          updatedAt: now,
        });
        
        processedCount++;
      });
    } catch (err) {
      console.error(`Error processing recurring transaction ${recurringTx.id}:`, err);
    }
  }
  
  return processedCount;
};

// Helper function to calculate next run date
function calculateNextRunDate(currentDateStr: string, frequency: string): string {
  const date = new Date(currentDateStr);
  
  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  
  return date.toISOString().split("T")[0];
}

const docRef = (userId: string, docId: string) => doc(db, "users", userId, "recurringTransactions", docId);
