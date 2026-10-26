import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAssignments } from '@/hooks/useAssignments';
import { useResources } from '@/hooks/useResources';
import { usePresence } from '@/hooks/usePresence';
import { useMessaging } from '@/hooks/useMessaging';
import { Assignment, ActivityFeedItem } from '@/types';

// Layout & Cohort Views
import { LandingPage } from '@/components/layout/LandingPage';
import { SelectCohortView } from '@/components/layout/SelectCohortView';
import { Navbar } from '@/components/layout/Navbar';
import { AuthModal } from '@/components/layout/AuthModal';
import { JoinBlockModal } from '@/components/layout/JoinBlockModal';
import { CanvasSyncModal } from '@/components/canvas/CanvasSyncModal';
import { ChatDrawer } from '@/components/chat/ChatDrawer';
import { AddResourceModal } from '@/components/resources/AddResourceModal';
import { PriorityHero } from '@/components/dashboard/PriorityHero';
import { QuickSearchBar, SearchCategory } from '@/components/dashboard/QuickSearchBar';
import { DailyOverviewFeed } from '@/components/dashboard/DailyOverviewFeed';
import { SetFocusModal } from '@/components/dashboard/SetFocusModal';
import { OnlinePresenceBar } from '@/components/social/OnlinePresenceBar';
import { AssignmentList } from '@/components/assignments/AssignmentList';
import { AssignmentDrawer } from '@/components/assignments/AssignmentDrawer';
import { CreateAssignmentModal } from '@/components/assignments/CreateAssignmentModal';
import { ResourceHub } from '@/components/resources/ResourceHub';
import { Layers } from 'lucide-react';

export function App() {
  const { user, block, isAuthenticated, isLoading, joinBlockByCode, createBlock, signOut } = useAuth();
  const { assignments, priorityHero, toggleCompletion, createAssignment, refreshAssignments } = useAssignments();
  const { resources, rateResource, uploadFile, addLink } = useResources();
  const { peers, myFocusTaskId, myFocusTaskTitle, updateMyFocus } = usePresence();
  const { conversations, activeConversationId, setActiveConversationId, messages, sendMessage, getOrCreateDirectConversation } = useMessaging();

  // Navigation & Search State
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'assignments' | 'resources'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<SearchCategory>('all');
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);

  // Modals & Drawers
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isNewAsgOpen, setIsNewAsgOpen] = useState(false);
  const [isJoinBlockOpen, setIsJoinBlockOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isCanvasSyncOpen, setIsCanvasSyncOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [resourceTargetAsgId, setResourceTargetAsgId] = useState<string | null>(null);
  const [isSetFocusOpen, setIsSetFocusOpen] = useState(false);

  // Filtered Assignments & Resources
  const filteredAssignments = useMemo(() => {
    if (!searchQuery.trim()) return assignments;
    const q = searchQuery.toLowerCase();
    return assignments.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.course_code && a.course_code.toLowerCase().includes(q)) ||
        (a.course_name && a.course_name.toLowerCase().includes(q))
    );
  }, [assignments, searchQuery]);

  const filteredResources = useMemo(() => {
    if (!searchQuery.trim()) return resources;
    const q = searchQuery.toLowerCase();
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.assignment_title && r.assignment_title.toLowerCase().includes(q))
    );
  }, [resources, searchQuery]);

  // Handle "Ask Advice" Trigger: Opens P2P Chat Thread linked to assignment
  const handleAskAdvice = async (peerId: string, peerName: string, asg: Assignment) => {
    if (!user) return;
    await getOrCreateDirectConversation(peerId, peerName, asg.id, asg.title);
    setIsChatOpen(true);
    setActivityFeed((prev) => [
      {
        id: `act_${Date.now()}`,
        type: 'advice_asked',
        actor_name: `${user.full_name || 'You'}`,
        actor_avatar: user.avatar_url,
        target_title: `Asked ${peerName} on "${asg.title}"`,
        target_id: asg.id,
        timestamp: new Date().toISOString(),
        badge_text: 'P2P Advice',
      },
      ...prev,
    ]);
  };

  const handleToggleComplete = async (asgId: string) => {
    if (!user) return;
    await toggleCompletion(asgId);
    const target = assignments.find((a) => a.id === asgId);
    if (target && !target.is_completed) {
      setActivityFeed((prev) => [
        {
          id: `act_${Date.now()}`,
          type: 'completion',
          actor_name: `${user.full_name || 'You'}`,
          actor_avatar: user.avatar_url,
          target_title: target.title,
          target_id: target.id,
          timestamp: new Date().toISOString(),
          badge_text: 'Marked Done',
        },
        ...prev,
      ]);
    }
  };

  // 1. Initial Session Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-600/20 animate-pulse">
          <Layers className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-400 tracking-wide">Syncing BlockSync Cohort...</p>
      </div>
    );
  }

  // 2. Unauthenticated State: Clean Landing / Menu Page
  if (!isAuthenticated || !user) {
    return (
      <>
        <LandingPage
          onOpenSignIn={() => { setAuthMode('signin'); setIsAuthOpen(true); }}
          onOpenSignUp={() => { setAuthMode('signup'); setIsAuthOpen(true); }}
        />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          defaultMode={authMode}
        />
      </>
    );
  }

  // 3. Authenticated but No Academic Block Selected
  if (!block) {
    return (
      <SelectCohortView
        userName={user.full_name || user.email.split('@')[0]}
        onJoinCode={joinBlockByCode}
        onCreateBlock={createBlock}
        onSignOut={signOut}
      />
    );
  }

  // 4. Authenticated Cohort Dashboard
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenNewAssignment={() => setIsNewAsgOpen(true)}
        onOpenJoinBlock={() => setIsJoinBlockOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenCanvasSync={() => setIsCanvasSyncOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        unreadCount={conversations.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Live Non-Intrusive Presence Bar */}
        <OnlinePresenceBar
          peers={peers}
          myFocusTitle={myFocusTaskTitle}
          onSetFocus={() => setIsSetFocusOpen(true)}
        />

        {/* Global Instant Search Bar */}
        <QuickSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          category={searchCategory}
          onSelectCategory={(cat) => {
            setSearchCategory(cat);
            if (cat === 'assignments') setCurrentTab('assignments');
            if (cat === 'resources') setCurrentTab('resources');
          }}
          resultsCount={filteredAssignments.length + filteredResources.length}
        />

        {/* View Router */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            <PriorityHero
              assignment={priorityHero}
              onToggleComplete={handleToggleComplete}
              onOpenDetails={setSelectedAssignment}
              onUploadMaterial={(asg) => {
                setResourceTargetAsgId(asg.id);
                setIsAddResourceOpen(true);
              }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Cohort Tasks & Canvas Deadlines ({filteredAssignments.length})
                  </h3>
                  <button
                    onClick={() => setCurrentTab('assignments')}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    View all &rarr;
                  </button>
                </div>
                <AssignmentList
                  assignments={filteredAssignments}
                  onToggleComplete={handleToggleComplete}
                  onOpenDetails={setSelectedAssignment}
                  onAskAdvice={handleAskAdvice}
                  onCreateNew={() => setIsNewAsgOpen(true)}
                />
              </div>

              {/* Side Column: Block Activity Feed */}
              <div className="space-y-4">
                <DailyOverviewFeed
                  activities={activityFeed}
                  onSelectActivity={(act) => {
                    const found = assignments.find((a) => a.id === act.target_id);
                    if (found) setSelectedAssignment(found);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {currentTab === 'assignments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Academic Cohort Assignments</h2>
              <button
                onClick={() => setIsCanvasSyncOpen(true)}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                Sync with Canvas LMS &rarr;
              </button>
            </div>
            <AssignmentList
              assignments={filteredAssignments}
              onToggleComplete={handleToggleComplete}
              onOpenDetails={setSelectedAssignment}
              onAskAdvice={handleAskAdvice}
              onCreateNew={() => setIsNewAsgOpen(true)}
            />
          </div>
        )}

        {currentTab === 'resources' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Community-Rated Study Material Hub</h2>
              <p className="text-xs text-slate-400">
                Shared notes, Notion docs, Google Drive reviewers, and PDF cheat sheets rated 1 to 5 stars by block mates.
              </p>
            </div>
            <ResourceHub
              resources={filteredResources}
              assignments={assignments}
              onOpenAddResource={() => {
                setResourceTargetAsgId(null);
                setIsAddResourceOpen(true);
              }}
              onRateResource={rateResource}
            />
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      <AssignmentDrawer
        isOpen={Boolean(selectedAssignment)}
        onClose={() => setSelectedAssignment(null)}
        assignment={selectedAssignment}
        resources={selectedAssignment ? resources.filter((r) => r.assignment_id === selectedAssignment.id) : []}
        onToggleComplete={handleToggleComplete}
        onAskAdvice={handleAskAdvice}
        onOpenAddResource={() => {
          setResourceTargetAsgId(selectedAssignment?.id || null);
          setIsAddResourceOpen(true);
        }}
        onRateResource={rateResource}
      />

      <CreateAssignmentModal
        isOpen={isNewAsgOpen}
        onClose={() => setIsNewAsgOpen(false)}
        onSubmit={createAssignment}
      />

      <JoinBlockModal
        isOpen={isJoinBlockOpen}
        onClose={() => setIsJoinBlockOpen(false)}
        onJoinCode={joinBlockByCode}
        onCreateBlock={createBlock}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultMode={authMode}
      />

      <CanvasSyncModal
        isOpen={isCanvasSyncOpen}
        onClose={() => setIsCanvasSyncOpen(false)}
        onSyncComplete={refreshAssignments}
      />

      <AddResourceModal
        isOpen={isAddResourceOpen}
        onClose={() => setIsAddResourceOpen(false)}
        assignments={assignments}
        defaultAssignmentId={resourceTargetAsgId}
        onUploadFile={async (file, title, asgId) => {
          await uploadFile(file, title, asgId);
        }}
        onAddLink={async (url, title, fileType, asgId) => {
          await addLink(url, title, fileType, asgId);
        }}
      />

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        conversations={conversations}
        activeConvId={activeConversationId}
        onSelectConv={setActiveConversationId}
        messages={messages}
        currentUserId={user.id}
        onSendMessage={(text) => sendMessage(text, selectedAssignment?.id)}
      />

      <SetFocusModal
        isOpen={isSetFocusOpen}
        onClose={() => setIsSetFocusOpen(false)}
        assignments={assignments}
        currentFocusId={myFocusTaskId}
        onSelectFocus={updateMyFocus}
      />
    </div>
  );
}
