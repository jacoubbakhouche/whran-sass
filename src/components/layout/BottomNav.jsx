import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiMap, FiSearch, FiBook, FiUser, FiGrid, FiBell, FiMessageSquare, FiTrendingUp, FiShoppingBag, FiTruck } from 'react-icons/fi';
import './BottomNav.css';

const userTabs = [
  { to: '/home',    icon: <FiHome size={22} />, label: 'الرئيسية'  },
  { to: '/map',     icon: <FiMap size={22} />, label: 'الخريطة'   },
  { to: '/search',  icon: <FiSearch size={22} />, label: 'البحث'      },
  { to: '/profile/messages', icon: <FiMessageSquare size={22} />, label: 'الرسائل' },
  { to: '/store',   icon: <FiBook size={22} />, label: 'المكتبة'    },
  { to: '/profile', icon: <FiUser size={22} />, label: 'ملفي'       },
];

const institutionTabs = [
  { to: '/institution-admin', icon: <FiGrid size={22} />, label: 'Overview' },
  { to: '/institution-admin/profile', icon: <FiUser size={22} />, label: 'Profile' },
  { to: '/institution-admin/announcements', icon: <FiBell size={22} />, label: 'Ads' },
  { to: '/institution-admin/messages', icon: <FiMessageSquare size={22} />, label: 'Chat' },
];

const vendorTabs = [
  { to: '/vendor', icon: <FiGrid size={22} />, label: 'Home' },
  { to: '/vendor/inventory', icon: <FiShoppingBag size={22} />, label: 'Items' },
  { to: '/vendor/orders', icon: <FiTruck size={22} />, label: 'Orders' },
  { to: '/profile', icon: <FiUser size={22} />, label: 'Me' },
];

export default function BottomNav() {
  const location = useLocation();
  
  // Conditionally select tabs based on current path
  let activeTabs = userTabs;
  if (location.pathname.startsWith('/institution-admin')) activeTabs = institutionTabs;
  else if (location.pathname.startsWith('/vendor')) activeTabs = vendorTabs;

  // Still hide on login/portal/onboarding/dashboards
  const hidden = [
    '/login', '/institution-login', '/vendor-login', 
    '/pro-portal', '/admin-login', '/admin', 
    '/welcome', '/user-type',
    '/cart', '/store/book', '/institution/'
  ];
  // More specific check: hide on exact dashboard roots and specific detail pages
  if (hidden.some(p => location.pathname === p || location.pathname.startsWith(p))) return null;

  return (
    <nav className="bottom-nav" dir="rtl">
      {activeTabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/institution-admin' || tab.to === '/vendor'}
          className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}
        >
          <span className="bottom-nav__icon">{tab.icon}</span>
        </NavLink>
      ))}
    </nav>
  );
}
