import { createContext, useContext, useState, useEffect } from 'react';

const UtilContext = createContext();

export const useUtils = () => {
  return useContext(UtilContext);
};

export const UtilsProvider = ({ children }) => {
  // Get initial values from localStorage
  const initialFormattedDates = localStorage.getItem('formattedDates') === 'true';
  const initialNotifsMode = localStorage.getItem('notifsMode') || 'custom';
  
  // Set up state with initial values
  const [isFormattedDatesEnabled, setIsFormattedDatesEnabled] = useState(initialFormattedDates);
  const [notifsMode, setNotifsMode] = useState(initialNotifsMode);
  
  // Update localStorage when settings change
  useEffect(() => {
    localStorage.setItem('formattedDates', isFormattedDatesEnabled);
  }, [isFormattedDatesEnabled]);
  
  useEffect(() => {
    localStorage.setItem('notifsMode', notifsMode);
  }, [notifsMode]);
  
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '$0';
    const isNeg = amount < 0
    if(isNeg) amount = amount * -1
    
    const formattedNum =  new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);

    return isNeg ? `[${formattedNum}]` : formattedNum
  };
  
  const formatDate = (dateStr, long) => {
    if (!dateStr) return '';
    
    // Parse the date to ensure it is treated as a local date
    const [year, month, day] = dateStr.split(' ')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day); // Month is 0-based in JavaScript
    let options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    
    // Handle long dates if long dates enabled in settings or was passed in to func
    if (isFormattedDatesEnabled || long) {
      options.month = 'long';
    }
    
    return date.toLocaleDateString(undefined, options);
  };
  
  const sum = (iter, key, initial = 0) => {
    return iter ? iter.reduce((accumulator, currentValue) => {
      return accumulator + (key ? currentValue[key] : currentValue);
    }, initial) : initial;
  };
  
  const settingsObj = {
    isFormattedDatesEnabled,
    setIsFormattedDatesEnabled,
    notifsMode,
    setNotifsMode
  };
  
  return (
    <UtilContext.Provider value={{ formatCurrency, formatDate, sum, settingsObj }}>
      {children}
    </UtilContext.Provider>
  );
};