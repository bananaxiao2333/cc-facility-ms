import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Breadcrumbs, Breadcrumb, Button, Icon } from '@blueprintjs/core';
import AppSidebar from '../components/AppSidebar';
import ErrorBoundary from '../components/ErrorBoundary';
import { useTheme } from '../context/ThemeContext';

function pathToBreadcrumbs(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return [{ text: 'Home', href: '/' }];

  return [
    { text: 'Home', href: '/' },
    ...segments.map((seg, i) => {
      const href = '/' + segments.slice(0, i + 1).join('/');
      return { text: seg.charAt(0).toUpperCase() + seg.slice(1), href };
    }),
  ];
}

export default function MainLayout() {
  const { mode, cycle } = useTheme();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const items = pathToBreadcrumbs(pathname);

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div className="app-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}
      <AppSidebar
        mode={mode}
        onToggleTheme={cycle}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="app-main">
        <div className="app-topbar">
          <Button
            icon="menu"
            minimal
            className="app-hamburger"
            onClick={() => setSidebarOpen(true)}
          />
          <Breadcrumbs
            items={items}
            className="app-breadcrumb-desktop"
            breadcrumbRenderer={({ text, href }) => (
              <Breadcrumb key={href} text={text} href={href} />
            )}
          />
          <div className="app-topbar-brand">
            <img src="/favicon.png" alt="" />
            <span>CC Facility</span>
          </div>
        </div>
        <div className="app-breadcrumb-mobile">
          <Breadcrumbs
            items={items}
            breadcrumbRenderer={({ text, href }) => (
              <Breadcrumb key={href} text={text} href={href} />
            )}
          />
        </div>
        <ErrorBoundary key={pathname} path={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
