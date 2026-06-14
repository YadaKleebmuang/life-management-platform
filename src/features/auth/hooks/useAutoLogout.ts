"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { logoutUser } from "../services/authService";

export function useAutoLogout(timeoutMs: number = 10 * 60 * 1000) { // Default 10 minutes
  const { user } = useAuth();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(async () => {
    if (user) {
      try {
        await logoutUser();
        // Option to force reload or let AuthGuard handle redirect
        window.location.href = "/login";
      } catch (error) {
        console.error("Auto logout failed:", error);
      }
    }
  }, [user]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (user) {
      timerRef.current = setTimeout(handleLogout, timeoutMs);
    }
  }, [handleLogout, timeoutMs, user]);

  useEffect(() => {
    // Only setup listeners if user is logged in
    if (!user) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const events = ["mousemove", "keydown", "scroll", "click"];

    // Initialize timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user, resetTimer]);
}
