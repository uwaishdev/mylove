import React, { useState, useEffect } from 'react';
import { GirlfriendProposal } from './components/GirlfriendProposal';
import { FloatingHearts } from './components/FloatingHearts';
import { AudioToggle } from './components/AudioToggle';
import { AdminDashboard } from './components/AdminDashboard';
import { fetchPublicConfig } from './services/submissionService';
import { AppConfig } from './types';
import { Lock } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<AppConfig>({
    girlfriendName: 'My Love',
    yourName: 'Yours Forever',
    welcomeMessage:
      'Every single time I look at you, I find myself completely lost for words. You are one of the most beautiful parts of my life, and your smile makes even my ordinary days feel special.',
    surpriseMessage:
      "I've been wanting to ask you a few things for a while. Sometimes, words get difficult when you're right in front of me, so I made this little space just for us. Ready for a few questions from my heart?",
    thankYouMessage:
      'Thank you for sharing a little piece of your heart with me. Every word matters to me, and I\'m so lucky to have these memories with you.',
    hasGoogleScriptUrl: false
  });

  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Check URL pathname or hash for admin route
  useEffect(() => {
    const checkAdminRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/admin' || hash === '#admin') {
        setIsAdminOpen(true);
      }
    };

    checkAdminRoute();
    window.addEventListener('popstate', checkAdminRoute);
    return () => window.removeEventListener('popstate', checkAdminRoute);
  }, []);

  // Fetch config from server
  useEffect(() => {
    fetchPublicConfig().then((loaded) => {
      if (loaded) {
        setConfig((prev) => ({
          ...prev,
          ...loaded
        }));
      }
    });
  }, []);

  const handleConfigUpdated = (updated: AppConfig) => {
    setConfig(updated);
  };

  return (
    <div className="relative min-h-screen bg-[#0d0d1a] text-[#fce7f3] flex flex-col justify-between overflow-x-hidden selection:bg-[#ff007f]/30">
      {/* Background Hearts & Ambient Glow */}
      <FloatingHearts />

      {/* Romantic Audio Player Toggle */}
      <AudioToggle />

      {/* Main Multi-Step Romantic Flow */}
      <main className="flex-1 flex items-center justify-center relative z-10 w-full">
        <GirlfriendProposal config={config} />
      </main>

      {/* Discrete Admin Link in Footer */}
      <footer className="relative z-20 py-4 px-6 flex items-center justify-between text-[11px] text-pink-300/40 border-t border-[#ff007f]/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span>Made with ❤️ for {config.girlfriendName || 'My Love'}</span>
        </div>

        {/* Private Owner Access button */}
        <button
          onClick={() => setIsAdminOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 hover:text-pink-200 transition-colors text-pink-300/60"
          title="Open Private Admin Portal (Password Protected)"
        >
          <Lock className="w-3 h-3 text-[#ff007f]" />
          <span>Admin Portal</span>
        </button>
      </footer>

      {/* Private Admin Dashboard Modal/View */}
      {isAdminOpen && (
        <AdminDashboard
          onClose={() => {
            setIsAdminOpen(false);
            if (window.location.hash === '#admin') {
              window.history.pushState(null, '', window.location.pathname);
            }
          }}
          onConfigUpdated={handleConfigUpdated}
        />
      )}
    </div>
  );
}
