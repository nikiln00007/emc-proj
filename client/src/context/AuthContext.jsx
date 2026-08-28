import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../utils/firebase';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [role, setRole] = useState('student'); // 'student' | 'teacher'
  const [loading, setLoading] = useState(true);

  const syncWithBackend = async (userObj) => {
    try {
      const { data } = await api.post('/api/users/sync', {
        name: userObj.displayName || userObj.email?.split('@')[0] || 'Developer',
        profileImage: userObj.photoURL || '',
      });
      if (data) setDbUser(data);
    } catch (e) {
      console.warn('User backend sync note:', e.message);
      setDbUser({
        firebaseUid: userObj.uid,
        name: userObj.displayName || userObj.email?.split('@')[0] || 'Developer',
        email: userObj.email,
        profileImage: userObj.photoURL || '',
        bio: userObj.role === 'teacher' ? 'Faculty Evaluator & Project Judge' : 'Student Developer & Builder at PeerHub',
        createdAt: new Date().toISOString(),
      });
    }
  };

  const signup = async (email, password, name, selectedRole = 'student') => {
    const userRole = selectedRole === 'teacher' ? 'teacher' : 'student';

    // 1. Try real Firebase Auth first
    if (auth && import.meta.env.VITE_FIREBASE_API_KEY && !import.meta.env.VITE_FIREBASE_API_KEY.includes('Dummy')) {
      try {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName: name });
        const augmentedUser = { ...user, displayName: name, role: userRole };
        await syncWithBackend(augmentedUser);
        setCurrentUser(augmentedUser);
        setRole(userRole);
        localStorage.setItem('peerhub_user_role', userRole);
        return augmentedUser;
      } catch (fbErr) {
        if (fbErr.code && fbErr.code !== 'auth/invalid-api-key' && fbErr.code !== 'auth/api-key-not-valid') {
          throw fbErr;
        }
      }
    }

    // 2. Seamless local development user session
    const devUid = 'usr_' + Math.random().toString(36).substring(2, 9);
    const mockUser = {
      uid: devUid,
      email,
      displayName: name,
      role: userRole,
      photoURL: `https://api.dicebear.com/7.x/${userRole === 'teacher' ? 'micah' : 'bottts'}/svg?seed=${encodeURIComponent(name)}`,
      getIdToken: async () => `dev-token:${btoa(JSON.stringify({ uid: devUid, email, name, role: userRole }))}`,
    };

    localStorage.setItem('peerhub_active_user', JSON.stringify({
      uid: devUid,
      email,
      displayName: name,
      role: userRole,
      photoURL: mockUser.photoURL,
    }));
    localStorage.setItem('peerhub_user_role', userRole);

    setCurrentUser(mockUser);
    setRole(userRole);
    await syncWithBackend(mockUser);
    return mockUser;
  };

  const login = async (email, password, selectedRole = null) => {
    // Determine role (or fallback from email if contains 'teacher' or 'prof')
    const inferredRole = selectedRole || (email.toLowerCase().includes('teacher') || email.toLowerCase().includes('prof') || email.toLowerCase().includes('admin') ? 'teacher' : 'student');

    // 1. Try real Firebase Auth first
    if (auth && import.meta.env.VITE_FIREBASE_API_KEY && !import.meta.env.VITE_FIREBASE_API_KEY.includes('Dummy')) {
      try {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        const augmentedUser = { ...user, role: inferredRole };
        setCurrentUser(augmentedUser);
        setRole(inferredRole);
        localStorage.setItem('peerhub_user_role', inferredRole);
        await syncWithBackend(augmentedUser);
        return augmentedUser;
      } catch (fbErr) {
        if (fbErr.code && fbErr.code !== 'auth/invalid-api-key' && fbErr.code !== 'auth/api-key-not-valid') {
          throw fbErr;
        }
      }
    }

    // 2. Seamless local development user session
    const saved = localStorage.getItem('peerhub_active_user');
    let userObj;
    if (saved) {
      const parsed = JSON.parse(saved);
      const userRole = selectedRole || parsed.role || inferredRole;
      userObj = {
        ...parsed,
        role: userRole,
        getIdToken: async () => `dev-token:${btoa(JSON.stringify({ uid: parsed.uid, email: parsed.email, name: parsed.displayName, role: userRole }))}`,
      };
    } else {
      const devUid = 'usr_' + Math.random().toString(36).substring(2, 9);
      const name = inferredRole === 'teacher' ? 'Prof. Anderson (Judge)' : email.split('@')[0];
      userObj = {
        uid: devUid,
        email,
        displayName: name,
        role: inferredRole,
        photoURL: `https://api.dicebear.com/7.x/${inferredRole === 'teacher' ? 'micah' : 'bottts'}/svg?seed=${encodeURIComponent(name)}`,
        getIdToken: async () => `dev-token:${btoa(JSON.stringify({ uid: devUid, email, name, role: inferredRole }))}`,
      };
      localStorage.setItem('peerhub_active_user', JSON.stringify({
        uid: devUid,
        email,
        displayName: name,
        role: inferredRole,
        photoURL: userObj.photoURL,
      }));
    }

    localStorage.setItem('peerhub_user_role', userObj.role);
    setCurrentUser(userObj);
    setRole(userObj.role);
    await syncWithBackend(userObj);
    return userObj;
  };

  const switchRole = (newRole) => {
    const validRole = newRole === 'teacher' ? 'teacher' : 'student';
    setRole(validRole);
    localStorage.setItem('peerhub_user_role', validRole);
    if (currentUser) {
      const updated = {
        ...currentUser,
        role: validRole,
        displayName: validRole === 'teacher' && !currentUser.displayName?.startsWith('Prof.') ? `Prof. ${currentUser.displayName}` : currentUser.displayName,
      };
      setCurrentUser(updated);
      localStorage.setItem('peerhub_active_user', JSON.stringify(updated));
    }
  };

  const logout = async () => {
    try {
      if (auth) await signOut(auth);
    } catch (e) {}
    localStorage.removeItem('peerhub_active_user');
    localStorage.removeItem('peerhub_user_role');
    setCurrentUser(null);
    setDbUser(null);
    setRole('student');
  };

  useEffect(() => {
    // 1. Restore local session & role
    const savedRole = localStorage.getItem('peerhub_user_role') || 'student';
    setRole(savedRole);

    const saved = localStorage.getItem('peerhub_active_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const restored = {
          ...parsed,
          role: parsed.role || savedRole,
          getIdToken: async () => `dev-token:${btoa(JSON.stringify({ uid: parsed.uid, email: parsed.email, name: parsed.displayName, role: parsed.role || savedRole }))}`,
        };
        setCurrentUser(restored);
        setRole(restored.role);
        syncWithBackend(restored);
      } catch (e) {}
    }

    // 2. Listen to real Firebase if configured
    let unsubscribe = () => {};
    if (auth && import.meta.env.VITE_FIREBASE_API_KEY && !import.meta.env.VITE_FIREBASE_API_KEY.includes('Dummy')) {
      try {
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            const augmented = { ...user, role: savedRole };
            setCurrentUser(augmented);
            await syncWithBackend(augmented);
          }
          setLoading(false);
        });
      } catch (e) {}
    }

    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const value = {
    currentUser,
    dbUser,
    role,
    isTeacher: role === 'teacher',
    isStudent: role === 'student',
    switchRole,
    setDbUser,
    loading,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-semibold text-sm">Loading PeerHub...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
