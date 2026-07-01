const FINANCE_CHANGED_EVENT = "finance:changed";

export const notifyFinanceChanged = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(FINANCE_CHANGED_EVENT));
};

export const subscribeFinanceChanged = (listener: () => void) => {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(FINANCE_CHANGED_EVENT, listener);
  return () => window.removeEventListener(FINANCE_CHANGED_EVENT, listener);
};
