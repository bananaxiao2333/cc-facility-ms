import { NavLink, useLocation } from 'react-router-dom';
import { Icon, Button } from '@blueprintjs/core';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', icon: 'dashboard', label: 'Dashboard' },
];

const MODE_META = {
  auto:  { icon: 'contrast',     label: 'Auto' },
  light: { icon: 'flash',        label: 'Light' },
  dark:  { icon: 'moon',         label: 'Dark' },
};

export default function AppSidebar({ mode, onToggleTheme }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const meta = MODE_META[mode];

  return (
    <aside className="app-sidebar">
      <h2 className="app-sidebar-title">
        <img src="/favicon.png" alt="" /> CC Facility
      </h2>

      {NAV_ITEMS.map(({ to, icon, label }) => {
        const active = location.pathname === to;
        return (
          <NavLink
            key={to}
            to={to}
            end
            className={'app-sidebar-link' + (active ? ' app-sidebar-link--active' : '')}
          >
            <Icon icon={icon} />
            {label}
          </NavLink>
        );
      })}

      <div className="app-sidebar-footer">
        {user && (
          <div className="app-sidebar-user">
            <Icon icon="user" />
            <span>{user.displayName || user.username}</span>
          </div>
        )}
        <Button
          icon={meta.icon}
          minimal
          small
          text={`Theme: ${meta.label}`}
          onClick={onToggleTheme}
          style={{ color: 'var(--bp-palette-gray-5)', width: '100%', justifyContent: 'flex-start' }}
        />
        <Button
          icon="log-out"
          minimal
          small
          text="Logout"
          onClick={logout}
          style={{ color: 'var(--bp-palette-gray-5)', width: '100%', justifyContent: 'flex-start', marginTop: 4 }}
        />
      </div>
    </aside>
  );
}
