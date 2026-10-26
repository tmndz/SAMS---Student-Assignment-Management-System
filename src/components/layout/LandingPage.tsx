import React from 'react';
import { Button } from '@/components/ui/Button';
import { Layers, LogIn, UserPlus, RefreshCw, Users, Star, MessageSquare, CheckCircle2, Shield } from 'lucide-react';

interface LandingPageProps {
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenSignIn, onOpenSignUp }) => {
  const features = [
    {
      icon: RefreshCw,
      title: 'Canvas LMS Live Sync',
      desc: 'Connect your school Canvas instance. Automatically import deadlines, open/lock dates, and assignments with zero manual entry.',
    },
    {
      icon: Users,
      title: 'Academic Block Grouping',
      desc: 'Join your specific section or cohort via join code. See who is online and who has completed each assignment.',
    },
    {
      icon: MessageSquare,
      title: 'P2P "Ask Advice" Mentorship',
      desc: 'Stuck on a problem? Reach out directly to classmates who already completed the task in a dedicated thread.',
    },
    {
      icon: Star,
      title: '5-Star Study Material Hub',
      desc: 'Share and discover peer-vetted cheat sheets, lecture notes, Google Drive links, and code skeletons sorted by rating.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">
              Block<span className="text-indigo-400">Sync</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button size="sm" variant="ghost" onClick={onOpenSignIn}>
              <LogIn className="w-3.5 h-3.5 mr-1" />
              Sign In
            </Button>
            <Button size="sm" variant="primary" onClick={onOpenSignUp}>
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col items-center text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real-Time College Cohort Management</span>
        </div>

        <div className="space-y-4 max-w-2xl">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Collaborative Assignment Tracking for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Academic Blocks</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
            Stay in sync with your classmates. Manage shared deadlines, sync Canvas courses, share peer-rated study notes, and ask completed classmates for advice.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button size="lg" variant="primary" onClick={onOpenSignUp} className="w-full sm:w-auto px-7 py-3 text-sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Create Student Account
          </Button>
          <Button size="lg" variant="secondary" onClick={onOpenSignIn} className="w-full sm:w-auto px-7 py-3 text-sm">
            <LogIn className="w-4 h-4 mr-2" />
            Sign In with Cohort
          </Button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-10 text-left">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/30 transition-all space-y-2.5"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        BlockSync • Powered by Supabase Realtime & Canvas LMS API
      </footer>
    </div>
  );
};
