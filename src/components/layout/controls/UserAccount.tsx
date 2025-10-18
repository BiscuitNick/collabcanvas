
import React from 'react';
import { useAuth } from '../../../hooks/useAuth';

const UserAccount: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="mt-auto pt-4 border-t border-gray-200">
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 flex-1">
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-8 h-8 rounded-full"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-gray-900 truncate">
              {user?.displayName || user?.email || 'User'}
            </div>
            <div className="text-xs text-gray-500">
              {user?.email && user?.displayName ? user.email : 'Logged in'}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-3 py-1.5 bg-red-500 text-white text-sm rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserAccount;
