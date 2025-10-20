import React, { useState } from 'react'
import { Globe, Lock, Link2, Edit, X, UserPlus, Trash2 } from 'lucide-react'
import { useCanvasMetadata } from '../../hooks/useCanvasMetadata'
import type { CanvasVisibility } from '../../hooks/useCanvases'

interface CanvasSettingsProps {
  canvasId: string
  userId: string
  onClose?: () => void
}

export function CanvasSettings({ canvasId, userId, onClose }: CanvasSettingsProps) {
  const {
    canvas,
    isCreator,
    updateVisibility,
    updatePublicCanEdit,
    addPermission,
    removePermission,
    updatePermission
  } = useCanvasMetadata(canvasId, userId)

  const [isUpdating, setIsUpdating] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState<'view' | 'edit'>('view')

  if (!canvas) {
    return <div className="p-4 text-sm text-gray-400">Loading...</div>
  }

  if (!isCreator) {
    return (
      <div className="p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Canvas Info</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p><span className="font-medium">Creator:</span> {canvas.createdByName}</p>
            <p><span className="font-medium">Visibility:</span> <span className="capitalize">{canvas.visibility}</span></p>
            <p><span className="font-medium">Your access:</span> {canvas.permissions.find(p => p.userId === userId)?.role || 'view'}</p>
          </div>
        </div>
      </div>
    )
  }

  const handleVisibilityChange = async (visibility: CanvasVisibility) => {
    setIsUpdating(true)
    try {
      await updateVisibility(visibility)
    } catch (err) {
      console.error('Failed to update visibility:', err)
      alert('Failed to update visibility')
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePublicCanEditToggle = async () => {
    setIsUpdating(true)
    try {
      await updatePublicCanEdit(!canvas.publicCanEdit)
    } catch (err) {
      console.error('Failed to update public edit permission:', err)
      alert('Failed to update permission')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddPermission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserEmail.trim()) return

    setIsUpdating(true)
    try {
      // In a real app, you'd lookup the user by email to get their userId
      // For now, we'll use email as a placeholder
      await addPermission({
        userId: newUserEmail.trim(),
        userName: newUserEmail.trim(),
        role: newUserRole
      })
      setNewUserEmail('')
      setNewUserRole('view')
    } catch (err) {
      console.error('Failed to add permission:', err)
      alert('Failed to add user')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemovePermission = async (userIdToRemove: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return

    setIsUpdating(true)
    try {
      await removePermission(userIdToRemove)
    } catch (err) {
      console.error('Failed to remove permission:', err)
      alert('Failed to remove user')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdatePermission = async (userIdToUpdate: string, role: 'view' | 'edit') => {
    setIsUpdating(true)
    try {
      await updatePermission(userIdToUpdate, role)
    } catch (err) {
      console.error('Failed to update permission:', err)
      alert('Failed to update permission')
    } finally {
      setIsUpdating(false)
    }
  }

  const getVisibilityIcon = (vis: CanvasVisibility) => {
    switch (vis) {
      case 'public':
        return <Globe className="h-4 w-4" />
      case 'unlisted':
        return <Link2 className="h-4 w-4" />
      case 'private':
        return <Lock className="h-4 w-4" />
    }
  }

  return (
    <div className="p-4 space-y-4">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Canvas Name */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Canvas Name
        </label>
        <div className="text-sm text-gray-900 font-medium">{canvas.name}</div>
      </div>

      {/* Visibility Settings */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-2">
          Visibility
        </label>
        <div className="space-y-2">
          {(['private', 'unlisted', 'public'] as CanvasVisibility[]).map((vis) => (
            <label
              key={vis}
              className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all ${
                canvas.visibility === vis
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isUpdating && handleVisibilityChange(vis)}
            >
              <input
                type="radio"
                name="visibility"
                value={vis}
                checked={canvas.visibility === vis}
                onChange={() => {}}
                disabled={isUpdating}
                className="cursor-pointer"
              />
              {getVisibilityIcon(vis)}
              <div className="flex-1">
                <div className="text-xs font-semibold text-gray-900 capitalize">
                  {vis}
                </div>
                <div className="text-xs text-gray-500">
                  {vis === 'private' && 'Only you and invited users'}
                  {vis === 'unlisted' && 'Anyone with the link'}
                  {vis === 'public' && 'Everyone can find and view'}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Public/Unlisted Edit Permission */}
      {(canvas.visibility === 'public' || canvas.visibility === 'unlisted') && (
        <div>
          <label
            className={`flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
              isUpdating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={() => !isUpdating && handlePublicCanEditToggle()}
          >
            <input
              type="checkbox"
              checked={canvas.publicCanEdit}
              onChange={() => {}}
              disabled={isUpdating}
              className="cursor-pointer"
            />
            <Edit className="h-4 w-4 text-gray-600" />
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-900">Allow public editing</div>
              <div className="text-xs text-gray-500">
                Anyone who can view can also edit
              </div>
            </div>
          </label>
        </div>
      )}

      {/* User Permissions (for private canvases) */}
      {canvas.visibility === 'private' && (
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            Invited Users
          </label>

          {/* Add User Form */}
          <form onSubmit={handleAddPermission} className="mb-3">
            <div className="flex gap-2">
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="Enter email..."
                disabled={isUpdating}
                className="flex-1 px-2 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-400 disabled:opacity-50"
              />
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as 'view' | 'edit')}
                disabled={isUpdating}
                className="px-2 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-400 disabled:opacity-50"
              >
                <option value="view">View</option>
                <option value="edit">Edit</option>
              </select>
              <button
                type="submit"
                disabled={isUpdating || !newUserEmail.trim()}
                className="px-2 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <UserPlus className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* User List */}
          <div className="space-y-2">
            {canvas.permissions.length === 0 ? (
              <div className="text-center py-4 text-xs text-gray-400">
                No users invited yet
              </div>
            ) : (
              canvas.permissions.map((permission) => (
                <div
                  key={permission.userId}
                  className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded"
                >
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="text-xs font-semibold text-gray-900 truncate">{permission.userName}</div>
                    <div className="text-xs text-gray-500 truncate">{permission.userId}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={permission.role}
                      onChange={(e) => handleUpdatePermission(permission.userId, e.target.value as 'view' | 'edit')}
                      disabled={isUpdating}
                      className="px-2 py-1 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-400 disabled:opacity-50"
                    >
                      <option value="view">View</option>
                      <option value="edit">Edit</option>
                    </select>
                    <button
                      onClick={() => handleRemovePermission(permission.userId)}
                      disabled={isUpdating}
                      className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Remove user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
