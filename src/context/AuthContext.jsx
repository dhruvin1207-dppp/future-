import { createContext, useContext, useState, useEffect } from 'react';
import { menuItems } from '../config/navigation';

const AuthContext = createContext();

const ADMIN_CREDENTIALS = {
  username: 'Future Admin',
  password: 'Admin@1227',
  role: 'admin',
  name: 'Future Admin',
};

const STAFF_CREDENTIALS = {
  username: 'Future Staff',
  password: 'Staff@1207',
  role: 'staff',
  name: 'Future Staff',
};

const STORAGE_KEY_USER = 'future_auth_user';
const STORAGE_KEY_PERMISSIONS = 'future_staff_permissions';

// Initialize default permissions for staff (all pages enabled by default)
const getDefaultPermissions = () => {
  const defaults = {};
  menuItems.forEach((item) => {
    if (item.id !== 'adminPanel') {
      defaults[item.id] = true;
    }
  });
  return defaults;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [staffPermissions, setStaffPermissions] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PERMISSIONS);
      if (saved) {
        return { ...getDefaultPermissions(), ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return getDefaultPermissions();
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PERMISSIONS, JSON.stringify(staffPermissions));
  }, [staffPermissions]);

  const login = (username, password) => {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (
      cleanUsername.toLowerCase() === ADMIN_CREDENTIALS.username.toLowerCase() &&
      cleanPassword === ADMIN_CREDENTIALS.password
    ) {
      const userData = {
        username: ADMIN_CREDENTIALS.username,
        role: ADMIN_CREDENTIALS.role,
        name: ADMIN_CREDENTIALS.name,
      };
      setUser(userData);
      return { success: true, user: userData };
    }

    if (
      cleanUsername.toLowerCase() === STAFF_CREDENTIALS.username.toLowerCase() &&
      cleanPassword === STAFF_CREDENTIALS.password
    ) {
      const userData = {
        username: STAFF_CREDENTIALS.username,
        role: STAFF_CREDENTIALS.role,
        name: STAFF_CREDENTIALS.name,
      };
      setUser(userData);
      return { success: true, user: userData };
    }

    return {
      success: false,
      message: 'Invalid User ID or Password. Please try again.',
    };
  };

  const logout = () => {
    setUser(null);
  };

  const updateStaffPermission = (pageId, allowed) => {
    setStaffPermissions((prev) => ({
      ...prev,
      [pageId]: allowed,
    }));
  };

  const setAllStaffPermissions = (allowed) => {
    const updated = {};
    menuItems.forEach((item) => {
      if (item.id !== 'adminPanel') {
        updated[item.id] = allowed;
      }
    });
    setStaffPermissions(updated);
  };

  const resetStaffPermissions = () => {
    setStaffPermissions(getDefaultPermissions());
  };

  const isPageAllowed = (pageId) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (pageId === 'adminPanel') return false;
    return staffPermissions[pageId] !== false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        staffPermissions,
        updateStaffPermission,
        setAllStaffPermissions,
        resetStaffPermissions,
        isPageAllowed,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
