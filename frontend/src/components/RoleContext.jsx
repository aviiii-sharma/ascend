import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); 
  const [loading, setLoading] = useState(true);

  // This effect runs once on app load to check for a logged-in user
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (error) {
      console.error("Failed to initialize session from localStorage", error);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  // --- FIXED: This effect now waits for BOTH user and token to be set before navigating ---
  useEffect(() => {
    // Navigate only if we have a user AND a token, and the initial loading is complete
    if (user && token && !loading) {
      const dashboardMap = {
        HR: '/dashboard',
        Manager: '/manager-dashboard',
        Employee: '/employee-dashboard',
      };
      const targetDashboard = dashboardMap[user.role];

      // Redirect only if the user is on the login page
      if (targetDashboard && (location.pathname === '/' || location.pathname === '/login')) {
        navigate(targetDashboard);
      }
    }
    // --- The key change is adding `token` to this dependency array ---
  }, [user, token, loading, navigate, location.pathname]);


  const login = (userData, authToken) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    
    // Set the state. The useEffect above will now wait for both to be ready.
    setUser(userData);
    setToken(authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/'); // Navigate to the login page after logout
  };

  const value = {
    user,
    role: user?.role,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    token: token 
  };
  
  if (loading) {
    return null;
  }

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => useContext(RoleContext);
