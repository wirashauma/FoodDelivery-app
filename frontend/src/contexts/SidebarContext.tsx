'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  isMobileMenuOpen: boolean;
  toggleCollapsed: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Initialize collapsed state from localStorage lazily
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Close mobile menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Memoized callbacks to prevent unnecessary re-renders
  const toggleCollapsed = useCallback(() => setIsCollapsed((prev: boolean) => !prev), []);
  const toggleMobileMenu = useCallback(() => setIsMobileMenuOpen((prev: boolean) => !prev), []);
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  // Memoized context value to prevent cascading re-renders
  const value = useMemo(() => ({
    isCollapsed,
    isMobileMenuOpen,
    toggleCollapsed,
    toggleMobileMenu,
    closeMobileMenu,
  }), [isCollapsed, isMobileMenuOpen, toggleCollapsed, toggleMobileMenu, closeMobileMenu]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
