import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { RightSidebar } from './RightSidebar';
import { CreatePostModal } from '../feed/CreatePostModal';

interface LayoutProps {
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}

export const Layout: React.FC<LayoutProps> = ({
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
}) => {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex justify-center">
      <div className="w-full max-w-[1400px] flex justify-between relative">
        {/* Left Desktop Sidebar */}
        <Sidebar
          onOpenCreatePost={() => setIsCreatePostOpen(true)}
          unreadMessagesCount={unreadMessagesCount}
          unreadNotificationsCount={unreadNotificationsCount}
        />

        {/* Central Content Area */}
        <div className="flex-1 flex flex-col min-w-0 max-w-2xl border-r border-slate-200/80 dark:border-slate-800/80 pb-20 md:pb-6">
          {/* Top Mobile Bar */}
          <Navbar
            unreadMessagesCount={unreadMessagesCount}
            unreadNotificationsCount={unreadNotificationsCount}
          />

          <main className="flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>

        {/* Right Desktop Sidebar */}
        <RightSidebar />

        {/* Bottom Mobile Navigation */}
        <MobileNav onOpenCreatePost={() => setIsCreatePostOpen(true)} />

        {/* Global Create Post Modal */}
        <CreatePostModal
          isOpen={isCreatePostOpen}
          onClose={() => setIsCreatePostOpen(false)}
        />
      </div>
    </div>
  );
};
