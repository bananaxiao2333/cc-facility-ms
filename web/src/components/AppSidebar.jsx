import { NavLink, useLocation } from 'react-router-dom';
import { Icon, Button } from '@blueprintjs/core';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', icon: 'dashboard', label: 'Dashboard' },
  { to: '/profile', icon: 'user', label: 'Profile' },
];

const MODE_META = {
  auto:  { icon: 'contrast',     label: 'Auto' },
  light: { icon: 'flash',        label: 'Light' },
  dark:  { icon: 'moon',         label: 'Dark' },
};

export default function AppSidebar({ mode, onToggleTheme, open, onClose }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const meta = MODE_META[mode];

  return (
    <aside className={'app-sidebar' + (open ? ' app-sidebar--open' : '')}>
      <div className="app-sidebar-header">
        <h2 className="app-sidebar-title">
          <img src="/favicon.png" alt="" /> CC Facility
        </h2>
        <Button
          icon="cross"
          minimal
          small
          className="app-sidebar-close"
          onClick={onClose}
        />
      </div>

      {NAV_ITEMS.map(({ to, icon, label }) => {
        const active = location.pathname === to;
        return (
          <NavLink
            key={to}
            to={to}
            end
            className={'app-sidebar-link' + (active ? ' app-sidebar-link--active' : '')}
            onClick={onClose}
          >
            <Icon icon={icon} />
            {label}
          </NavLink>
        );
      })}

      <div className="app-sidebar-footer">
        {user && (
          <NavLink
            to="/profile"
            className={({ isActive }) => 'app-sidebar-user' + (isActive ? ' app-sidebar-user--active' : '')}
            onClick={onClose}
          >
            <Icon icon="user" />
            <span>{user.displayName || user.username}</span>
          </NavLink>
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
