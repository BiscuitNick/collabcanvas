import React from 'react'
import type { PresenceUser } from '../../types'

interface PresenceListProps {
  users: PresenceUser[]
}

const PresenceList: React.FC<PresenceListProps> = ({ users }) => {
  console.log('👥 PresenceList rendering with users:', users)
  
  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Online Users ({users.length})
        </h3>
      </div>
      
      <div className="space-y-3">
        {users.length === 0 ? (
          <div className="text-gray-500 text-sm">
            No other users online
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.userId}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Color indicator dot */}
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: user.color }}
              />
              
              {/* User info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {user.userName}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Online
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default PresenceList
