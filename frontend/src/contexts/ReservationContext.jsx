import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const ReservationContext = createContext(null);

export function ReservationProvider({ children }) {
  const [reservation, setReservation] = useState({
    grade: "",
    section: "",
    pickupDate: "",
    slot: "",
  });
  const [isInitialized, setIsInitialized] = useState(false);

  const getStorageKey = useCallback(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id || payload.sub || payload.userId;
      
      return userId ? `reservation_${userId}` : null;
    } catch (e) {
      console.warn("[RESERVATION] Failed to generate storage key:", e);
      return null;
    }
  }, []);

  const persist = useCallback((next) => {
    const key = getStorageKey();
    if (!key) return;
    
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch (e) {
      console.warn("[RESERVATION] localStorage failed:", e);
    }
  }, [getStorageKey]);

  const loadFromStorage = useCallback(() => {
    const key = getStorageKey();
    if (!key) return { grade: "", section: "", pickupDate: "", slot: "" };
    
    try {
      const v = JSON.parse(localStorage.getItem(key) || '{"grade":"","section":"","pickupDate":"","slot":""}');
      return v && typeof v === "object" ? v : { grade: "", section: "", pickupDate: "", slot: "" };
    } catch {
      return { grade: "", section: "", pickupDate: "", slot: "" };
    }
  }, [getStorageKey]);

  const clearStorage = useCallback(() => {
    const key = getStorageKey();
    if (key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn("[RESERVATION] Failed to clear storage:", e);
      }
    }
  }, [getStorageKey]);

  const setReservationDetails = useCallback((details) => {
    const next = { ...reservation, ...details };
    setReservation(next);
    persist(next);
    setIsInitialized(true);
  }, [reservation, persist]);

  const clearReservation = useCallback(() => {
    const empty = { grade: "", section: "", pickupDate: "", slot: "" };
    setReservation(empty);
    persist(empty);
    setIsInitialized(false);
  }, [persist]);

  const logout = useCallback(() => {
    clearReservation();
    clearStorage();
  }, [clearReservation, clearStorage]);

  // Load from storage on mount
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored.grade || stored.section || stored.pickupDate || stored.slot) {
      setReservation(stored);
      setIsInitialized(true);
    }
  }, [loadFromStorage]);

  // Clear on logout
  useEffect(() => {
    const onAuthLogout = () => {
      logout();
    };
    window.addEventListener('auth:logout', onAuthLogout);
    return () => window.removeEventListener('auth:logout', onAuthLogout);
  }, [logout]);

  const value = useMemo(
    () => ({ 
      reservation, 
      isInitialized, 
      setReservationDetails, 
      clearReservation,
      logout 
    }),
    [reservation, isInitialized, setReservationDetails, clearReservation, logout]
  );

  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>;
}

export function useReservation() {
  const ctx = useContext(ReservationContext);
  if (!ctx) throw new Error('useReservation must be used within ReservationProvider');
  return ctx;
}

export default ReservationContext;
