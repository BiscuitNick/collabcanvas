import React, { useState, useEffect } from 'react'
import type { PresenceUser } from '../../types'

interface OnlineUsersWidgetProps {
  presence: PresenceUser[]
}

const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

const OnlineUsersWidget: React.FC<OnlineUsersWidgetProps> = ({ presence }) => {
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Update time every second to refresh durations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const getUserDuration = (joinedAt: number | Date): string => {
    const joinTime = joinedAt instanceof Date ? joinedAt.getTime() : joinedAt
    const duration = currentTime - joinTime
    return formatDuration(duration)
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0">
        <h4 className="text-xs font-semibold text-gray-700">Online Users</h4>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">{presence.length}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
        {presence.length === 0 ? (
          <div className="text-xs text-gray-400 text-center py-4">No users online</div>
        ) : (
          presence.map(user => (
            <div key={user.userId} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded border border-gray-200">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: user.color }}
                ></div>
                <span className="text-xs font-medium text-gray-700 truncate">{user.userName}</span>
              </div>
              <span className="text-xs text-green-600 ml-2 flex-shrink-0">{getUserDuration(user.joinedAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default OnlineUsersWidget
