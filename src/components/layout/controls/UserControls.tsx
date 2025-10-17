
import React, { useState } from 'react';
import type { PresenceUser, Cursor as CursorType } from '../../../types';

interface UserControlsProps {
  presenceUsers: PresenceUser[];
  cursors: CursorType[];
  onUserClick?: (userId: string) => void;
}

const UserControls: React.FC<UserControlsProps> = ({ presenceUsers, cursors, onUserClick }) => {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const handleUserClick = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId);
    if (onUserClick) {
      onUserClick(userId);
    }
  };

  const getUserCursor = (userId: string) => {
    return cursors.find((cursor) => cursor.userId === userId);
  };

  return (
    <div className="space-y-2">
      {(() => {
        const activeUsers = presenceUsers.filter((user) => getUserCursor(user.userId));

        if (activeUsers.length === 0) {
          return <div className="text-gray-500 text-sm p-2">No other users online</div>;
        }

        return activeUsers.map((user) => {
          const userCursor = getUserCursor(user.userId);
          const isExpanded = expandedUser === user.userId;

          return (
            <div key={user.userId} className="space-y-1">
              <button
                onClick={() => handleUserClick(user.userId)}
                className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 border border-blue-200"
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.color }} />
                <span className="text-sm text-gray-700 flex-1 text-left">{user.userName}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">{isExpanded ? '▼' : '▶'}</span>
                </div>
              </button>

              {isExpanded && userCursor && (
                <div className="ml-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs space-y-2">
                  <div className="text-blue-700 space-y-1">
                    <div className="flex justify-between">
                      <span>Position:</span>
                      <span className="font-mono">
                        ({Math.round(userCursor.x)}, {Math.round(userCursor.y)})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Color:</span>
                      <div className="flex items-center gap-1">
                        <div
                          className="w-3 h-3 rounded border"
                          style={{ backgroundColor: userCursor.color }}
                        />
                        <span className="font-mono text-xs">{userCursor.color}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Updated:</span>
                      <span>{new Date(userCursor.lastUpdated).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>In Viewport:</span>
                      <span className={userCursor.isVisible ? 'text-green-600' : 'text-red-600'}>
                        {userCursor.isVisible ? '✓ Visible' : '✗ Outside'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        });
      })()}
    </div>
  );
};

export default UserControls;
