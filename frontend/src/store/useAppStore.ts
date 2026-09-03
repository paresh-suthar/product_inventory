import { create } from 'zustand';
import { Currency } from '../types';

interface AppState {
  activeCurrency: string;
  currencies: Currency[];
  isMobileSidebarOpen: boolean;
  setActiveCurrency: (code: string) => void;
  setCurrencies: (currencies: Currency[]) => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  convertValue: (amount: number, fromCurrency: string) => { amount: number; formatted: string; symbol: string };
}

export const useAppStore = create<AppState>((set, get) => ({
  activeCurrency: 'USD',
  currencies: [],
  isMobileSidebarOpen: false,
  setActiveCurrency: (code: string) => set({ activeCurrency: code }),
  setCurrencies: (currencies: Currency[]) => set({ currencies }),
  toggleMobileSidebar: () => set(state => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
  convertValue: (amount: number, fromCurrency: string) => {
    const { activeCurrency, currencies } = get();
    const active = currencies.find(c => c.code === activeCurrency);
    const from = currencies.find(c => c.code === fromCurrency);
    
    const symbol = active ? active.symbol : '$';
    if (!active || !from || fromCurrency === activeCurrency) {
      return {
        amount,
        formatted: `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        symbol,
      };
    }
    
    const rateFrom = from.exchange_rate_to_base || 1;
    const rateActive = active.exchange_rate_to_base || 1;
    
    const inBase = amount / rateFrom;
    const inActive = inBase * rateActive;
    
    return {
      amount: inActive,
      formatted: `${symbol}${inActive.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      symbol,
    };
  }
}));
