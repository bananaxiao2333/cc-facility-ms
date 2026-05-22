import { Outlet, useLocation } from 'react-router-dom';
import { Breadcrumbs, Breadcrumb } from '@blueprintjs/core';
import AppSidebar from '../components/AppSidebar';
import ErrorBoundary from '../components/ErrorBoundary';
import useTheme from '../hooks/useTheme';

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
  const items = pathToBreadcrumbs(pathname);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <AppSidebar mode={mode} onToggleTheme={cycle} />
      <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        <Breadcrumbs
          items={items}
          breadcrumbRenderer={({ text, href }) => (
            <Breadcrumb key={href} text={text} href={href} />
          )}
        />
        <ErrorBoundary key={pathname} path={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
