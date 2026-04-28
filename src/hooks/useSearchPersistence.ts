"use client";

import { useEffect, useRef, useCallback } from 'react';

const SEARCH_KEY = 'eitaxi_search';
const RESULT_KEY = 'eitaxi_result';

export interface SavedSearchState {
  originText: string;
  destinationText: string;
  origin: any | null;
  destination: any | null;
  routeInfo: any | null;
}

export interface SavedResultState {
  searchInfo: any;
  drivers: any[];
}

export function useSearchPersistence() {
  const savedRef = useRef(false);

  // Guardar estado de búsqueda (inputs + ruta)
  const saveSearchState = useCallback((data: {
    originText: string;
    destinationText: string;
    origin: any | null;
    destination: any | null;
    routeInfo: any | null;
  }) => {
    try {
      sessionStorage.setItem(SEARCH_KEY, JSON.stringify(data));
    } catch {}
  }, []);

  // Guardar resultado de búsqueda (drivers + searchInfo)
  const saveSearchResult = useCallback((data: {
    searchInfo: any;
    drivers: any[];
  }) => {
    try {
      sessionStorage.setItem(RESULT_KEY, JSON.stringify(data));
    } catch {}
  }, []);

  // Restaurar estado de búsqueda (inputs + ruta)
  const restoreSearchState = useCallback((): SavedSearchState | null => {
    if (savedRef.current) return null;
    try {
      const raw = sessionStorage.getItem(SEARCH_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        savedRef.current = true;
        return parsed;
      }
    } catch {}
    return null;
  }, []);

  // Restaurar resultado de búsqueda
  const restoreSearchResult = useCallback((): SavedResultState | null => {
    try {
      const raw = sessionStorage.getItem(RESULT_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return null;
  }, []);

  // Limpiar todo (ej: cuando se hace búsqueda nueva sin navigate)
  const clearSavedSearch = useCallback(() => {
    try {
      sessionStorage.removeItem(SEARCH_KEY);
      sessionStorage.removeItem(RESULT_KEY);
    } catch {}
  }, []);

  return {
    saveSearchState,
    saveSearchResult,
    restoreSearchState,
    restoreSearchResult,
    clearSavedSearch,
  };
}
