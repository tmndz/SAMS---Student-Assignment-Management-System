import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAssignments } from '@/hooks/useAssignments';
import { useResources } from '@/hooks/useResources';
import { usePresence } from '@/hooks/usePresence';
import { useAdvice } from '@/hooks/useAdvice';
import { INITIAL_ACTIVITY } from '@/lib/mockData';
import { Assignment, ResourceItem, ActivityFeedItem } from '@/types';

// Layout & UI
import { Navbar } from '@/components/layout/Navbar';
import { JoinBlockModal } from '@/components/layout/JoinBlockModal';
import { OnlinePresenceBar } from '@/components/social/OnlinePresenceBar';
import { AskAdviceModal } from '@/components/social/AskAdviceModal';
import { AdviceDrawer } from '@/components/social/AdviceDrawer';

// Dashboard & Core Views
import { PriorityHero } from '@/components/dashboard/PriorityHero';
import { QuickSearchBar, SearchCategory } from '@/components/dashboard/QuickSearchBar';
import { DailyOverviewFeed } from '@/components/dashboard/DailyOverviewFeed';
import { SetFocusModal } from '@/components/dashboard/SetFocusModal';
import { AssignmentList } from '@/components/assignments/AssignmentList';
import { AssignmentDrawer } from '@/components/assignments/AssignmentDrawer';
import { CreateAssignmentModal } from '@/components/assignments/CreateAssignmentModal';
import { ResourceHub } from '@/components/resources/ResourceHub';

export function App() {
  const { user, block, joinBlockByCode, createBlock } = useAuth();
  const { assignments, priorityHero, toggleCompletion, createAssignment } = useAssignments();
  const { resources, addResource, getResourcesByAssignment } = useResources();
  const { peers, myFocusTaskId, myFocusTaskTitle, updateMyFocus } = usePresence();
  const { threads, sendAdviceRequest, replyToAdvice } = useAdvice();

  // Navigation & Search State
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'assignments' | 'resources'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<SearchCategory>('all');
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>(INITIAL_ACTIVITY);

  // Modals State
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isNewAsgOpen, setIsNewAsgOpen] = useState(false);
  const [isJoinBlockOpen, setIsJoinBlockOpen] = useState(false);
  const [isAdviceInboxOpen, setIsAdviceInboxOpen] = useState(false);
  const [isSetFocusOpen, setIsSetFocusOpen] = useState(false);

  // Ask Advice Target
  const [adviceTarget, setAdviceTarget] = useState<{
    peerId: string;
    peerName: string;
    asg: Assignment;
  } | null>(null);

  // Filtered Assignments & Resources via Search
  const filteredAssignments = useMemo(() => {
    if (!searchQuery.trim()) return assignments;
    const q = searchQuery.toLowerCase();
    return assignments.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.course_code.toLowerCase().includes(q) ||
        a.course_name.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
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

  const handleAskAdvice = (peerId: string, peerName: string, asg: Assignment) => {
    setAdviceTarget({ peerId, peerName, asg });
  };

  const handleSendAdvice = (params: {
    assignmentId: string;
    assignmentTitle: string;
    receiverId: string;
    receiverName: string;
    message: string;
  }) => {
    sendAdviceRequest(params);
    setActivityFeed((prev) => [
      {
        id: `act_${Date.now()}`,
        type: 'advice_asked',
        actor_name: `${user.full_name} (You)`,
        actor_avatar: user.avatar_url,
        target_title: `Asked ${params.receiverName} on ${params.assignmentTitle}`,
        target_id: params.assignmentId,
        timestamp: new Date().toISOString(),
        badge_text: 'Pending',
      },
      ...prev,
    ]);
  };

  const handleToggleComplete = (asgId: string) => {
    toggleCompletion(asgId);
    const target = assignments.find((a) => a.id === asgId);
    if (target && !target.is_completed) {
      setActivityFeed((prev) => [
        {
          id: `act_${Date.now()}`,
          type: 'completion',
          actor_name: `${user.full_name} (You)`,
          actor_avatar: user.avatar_url,
          target_title: target.title,
          target_id: target.id,
          timestamp: new Date().toISOString(),
          badge_text: 'Just Finished',
        },
        ...prev,
      ]);
    }
  };

  const handleUploadFile = (file: {
    title: string;
    file_type: 'pdf' | 'notes' | 'slides' | 'code';
    file_size?: string;
    assignment_id?: string | null;
    assignment_title?: string;
  }) => {
    addResource({
      assignment_id: file.assignment_id || selectedAssignment?.id,
      assignment_title: file.assignment_title || selectedAssignment?.title,
      title: file.title,
      file_type: file.file_type,
      file_size: file.file_size,
    });
    setActivityFeed((prev) => [
      {
        id: `act_${Date.now()}`,
        type: 'upload',
        actor_name: `${user.full_name} (You)`,
        actor_avatar: user.avatar_url,
        target_title: file.title,
        target_id: `res_${Date.now()}`,
        timestamp: new Date().toISOString(),
        badge_text: file.file_type.toUpperCase(),
      },
      ...prev,
    ]);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenNewAssignment={() => setIsNewAsgOpen(true)}
        onOpenJoinBlock={() => setIsJoinBlockOpen(true)}
        onOpenAdviceInbox={() => setIsAdviceInboxOpen(true)}
        adviceCount={threads.filter((t) => t.status === 'pending' && t.receiver_id === user.id).length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Live Non-Intrusive Peer Presence Bar */}
        <OnlinePresenceBar
          peers={peers}
          myFocusTitle={myFocusTaskTitle}
          onSetFocus={() => setIsSetFocusOpen(true)}
        />

        {/* Global Quick Search Bar */}
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

        {/* Main View Router */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Current Priority Hero */}
            <PriorityHero
              assignment={priorityHero}
              onToggleComplete={handleToggleComplete}
              onOpenDetails={setSelectedAssignment}
              onUploadMaterial={(asg) => {
                setSelectedAssignment(asg);
              }}
            />

            {/* Dashboard Split: Assignments & Live Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Active Block Tasks ({filteredAssignments.length})
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
            <h2 className="text-lg font-bold text-white">Block Assignments</h2>
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
              <h2 className="text-lg font-bold text-white">Block Resource Hub</h2>
              <p className="text-xs text-slate-400">
                Shared reviewers, formulas, lecture notes, and past lab skeletons from classmates in {block.name}.
              </p>
            </div>
            <ResourceHub
              resources={filteredResources}
              assignments={assignments}
              onUploadResource={handleUploadFile}
            />
          </div>
        )}
      </main>

      {/* Global Modals & Drawers */}
      <AssignmentDrawer
        isOpen={Boolean(selectedAssignment)}
        onClose={() => setSelectedAssignment(null)}
        assignment={selectedAssignment}
        resources={selectedAssignment ? getResourcesByAssignment(selectedAssignment.id) : []}
        onToggleComplete={handleToggleComplete}
        onAskAdvice={handleAskAdvice}
        onUploadFile={handleUploadFile}
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

      {adviceTarget && (
        <AskAdviceModal
          isOpen={Boolean(adviceTarget)}
          onClose={() => setAdviceTarget(null)}
          peerId={adviceTarget.peerId}
          peerName={adviceTarget.peerName}
          assignmentId={adviceTarget.asg.id}
          assignmentTitle={adviceTarget.asg.title}
          onSendAdvice={handleSendAdvice}
        />
      )}

      <AdviceDrawer
        isOpen={isAdviceInboxOpen}
        onClose={() => setIsAdviceInboxOpen(false)}
        threads={threads}
        currentUserId={user.id}
        onReply={replyToAdvice}
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
