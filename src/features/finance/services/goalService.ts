import { db } from "@/lib/firebase";
import { collection, doc, getDocs, query, orderBy, runTransaction, where, setDoc } from "firebase/firestore";
import { Goal, GoalContribution, Transaction as AppTransaction, AccountSnapshot, Account, GoalStatus } from "../types";

export const getGoals = async (userId: string): Promise<Goal[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, "users", userId, "goals"),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  const goals: Goal[] = [];
  querySnapshot.forEach((doc) => {
    goals.push(doc.data() as Goal);
  });
  return goals;
};

export const getGoalContributions = async (userId: string, goalId: string): Promise<GoalContribution[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, "users", userId, "goalContributions"),
    where("goalId", "==", goalId),
    orderBy("contributionDate", "desc")
  );
  const querySnapshot = await getDocs(q);
  const contributions: GoalContribution[] = [];
  querySnapshot.forEach((doc) => {
    contributions.push(doc.data() as GoalContribution);
  });
  return contributions;
};

export const saveGoal = async (userId: string, goal: Goal): Promise<void> => {
  if (!userId) return;
  const docRef = doc(db, "users", userId, "goals", goal.id);
  await setDoc(docRef, goal);
};

export const addGoalContribution = async (userId: string, contribution: GoalContribution): Promise<void> => {
  if (!userId) return;

  await runTransaction(db, async (transaction) => {
    // 1. Get the goal
    const goalRef = doc(db, "users", userId, "goals", contribution.goalId);
    const goalDoc = await transaction.get(goalRef);

    if (!goalDoc.exists()) {
      throw new Error("Goal not found");
    }

    const goalData = goalDoc.data() as Goal;

    // 2. Get the account used for contribution
    const accountRef = doc(db, "users", userId, "accounts", contribution.accountId);
    const accountDoc = await transaction.get(accountRef);

    if (!accountDoc.exists()) {
      throw new Error("Account used for contribution not found");
    }

    const accountData = accountDoc.data() as Account;

    // 3. Validate balance
    if (accountData.currentBalance < contribution.amount) {
      throw new Error("ยอดเงินในบัญชีไม่พอสำหรับหยอดกระปุก");
    }

    const newBalance = accountData.currentBalance - contribution.amount;
    const now = new Date().toISOString();

    // 4. Update Account Balance
    transaction.update(accountRef, { currentBalance: newBalance, updatedAt: now });

    // 5. Update Goal current amount and status
    const newCurrentAmount = goalData.currentAmount + contribution.amount;
    let newStatus: GoalStatus = goalData.status;
    if (newCurrentAmount >= goalData.targetAmount) {
      newStatus = "completed";
    } else if (newStatus === "completed") {
      newStatus = "active";
    }

    transaction.update(goalRef, {
      currentAmount: newCurrentAmount,
      status: newStatus,
      updatedAt: now
    });

    // 6. Save Contribution record
    const contributionRef = doc(db, "users", userId, "goalContributions", contribution.id);
    transaction.set(contributionRef, contribution);

    // 7. Create Transaction Record
    const txId = crypto.randomUUID();
    const appTx: AppTransaction = {
      id: txId,
      userId,
      type: "goal_contribution",
      accountId: contribution.accountId,
      relatedDocumentId: contribution.id,
      amount: -contribution.amount, // Money left account to go into goal
      title: `ออมเงินเป้าหมาย: ${goalData.goalName}`,
      description: contribution.note,
      transactionDate: contribution.contributionDate,
      createdAt: now,
    };
    transaction.set(doc(db, "users", userId, "transactions", txId), appTx);

    // 8. Create Account Snapshot
    const snapId = crypto.randomUUID();
    const snapshot: AccountSnapshot = {
      id: snapId,
      userId,
      accountId: contribution.accountId,
      accountName: accountData.accountName,
      balance: newBalance,
      snapshotDate: contribution.contributionDate,
      sourceType: "goal_contribution",
      sourceId: contribution.id,
      createdAt: now,
    };
    transaction.set(doc(db, "users", userId, "accountSnapshots", snapId), snapshot);
  });
};
