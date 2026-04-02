import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();
const LanguageContext = createContext();

// Translation Data
const translations = {
  en: { 
    bet: "Bet", cashOut: "Cash Out", wait: "Wait...", 
    wallet: "Wallet", liveBets: "Live Bets", history: "Round History",
    autoOut: "Auto Out", online: "Online" 
  },
  am: { 
    bet: "መወራረድ", cashOut: "ገንዘብ አውጣ", wait: "ጠብቅ...", 
    wallet: "ኪስ", liveBets: "ቀጥታ ውርርድ", history: "የመጫወቻ ታሪክ",
    autoOut: "ራስ-ሰር ማውጫ", online: "በመስመር ላይ" 
  },
  ti: { 
    bet: "ውርርድ", cashOut: "ገንዘብ አውጽእ", wait: "ተጸበ...", 
    wallet: "ካሳ", liveBets: "ቀጥታ ውርርድ", history: "ዝሓለፈ ታሪኽ",
    autoOut: "ባዕላዊ መውጽኢ", online: "ኦንላይን" 
  },
  or: { 
    bet: "Dorgommama", cashOut: "Maallaqa Baasi", wait: "Eegi...", 
    wallet: "Walleetii", liveBets: "Dorgommama Kallattii", history: "Seenaa Taphaa",
    autoOut: "Ofumaan Baasuu", online: "Toora irratti" 
  }
};

export const AppProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [lang, setLang] = useState('en');

  const t = translations[lang];

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode }}>
      <LanguageContext.Provider value={{ lang, setLang, t }}>
        {children}
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export const useLanguage = () => useContext(LanguageContext);