const WORK_SHEET_CHANGED_EVENT = "work-sheet:changed";

export const notifyWorkSheetChanged = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(WORK_SHEET_CHANGED_EVENT));
};

export const subscribeWorkSheetChanged = (listener: () => void) => {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(WORK_SHEET_CHANGED_EVENT, listener);
  return () => window.removeEventListener(WORK_SHEET_CHANGED_EVENT, listener);
};

