import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 380);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-bg-100 dark:bg-[#070d14] text-text-100 dark:text-slate-100 transition-colors duration-300 relative">
      {/* Subtle Top Route Transition Indicator */}
      {isNavigating && (
        <div className="fixed top-16 left-0 right-0 h-[2.5px] z-50 pointer-events-none overflow-hidden">
          <div className="h-full bg-gradient-to-r from-accent-200 via-cyan-400 to-accent-100 dark:from-cyan-500 dark:via-sky-400 dark:to-cyan-300 animate-route-progress shadow-[0_0_8px_rgba(2,132,199,0.5)]" />
        </div>
      )}

      <Header />
      <main className="flex-grow flex flex-col">
        <div key={location.pathname} className="page-transition flex-1 flex flex-col">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;