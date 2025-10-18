import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useCanvases, type CanvasVisibility, type Canvas } from '../hooks/useCanvases'
import { useAuth } from '../hooks/useAuth'
import { Globe, Lock, Link2, Edit } from 'lucide-react'

export function CanvasesListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { canvases, publicCanvases, loading, error, createCanvas } = useCanvases(user?.uid)
  const [isCreating, setIsCreating] = useState(false)
  const [newCanvasName, setNewCanvasName] = useState('')
  const [visibility, setVisibility] = useState<CanvasVisibility>('private')
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my')

  const handleCreateCanvas = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.uid) {
      alert('You must be logged in to create a canvas')
      return
    }

    try {
      setIsCreating(true)
      const canvasId = await createCanvas(
        newCanvasName.trim(),
        user.uid,
        user.displayName || user.email || 'Unknown',
        visibility
      )
      navigate(`/canvas?id=${canvasId}`)
    } catch (err) {
      console.error('Failed to create canvas:', err)
      alert('Failed to create canvas. Please try again.')
    } finally {
      setIsCreating(false)
      setNewCanvasName('')
      setVisibility('private')
    }
  }

  const handleCanvasClick = (canvasId: string) => {
    navigate(`/canvas?id=${canvasId}`)
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

  const getVisibilityColor = (vis: CanvasVisibility) => {
    switch (vis) {
      case 'public':
        return '#10b981'
      case 'unlisted':
        return '#f59e0b'
      case 'private':
        return '#6b7280'
    }
  }

  const renderCanvas = (canvas: Canvas, showCreator = false) => (
    <div
      key={canvas.id}
      onClick={() => handleCanvasClick(canvas.id)}
      style={{
        background: '#2a2a2a',
        border: '1px solid #3a3a3a',
        borderRadius: '12px',
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#4a9eff'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#3a3a3a'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '500',
          color: '#fff',
          flex: 1
        }}>
          {canvas.name}
        </h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          background: getVisibilityColor(canvas.visibility) + '20',
          color: getVisibilityColor(canvas.visibility),
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {getVisibilityIcon(canvas.visibility)}
          <span style={{ textTransform: 'capitalize' }}>{canvas.visibility}</span>
        </div>
      </div>

      {showCreator && canvas.createdByName && (
        <p style={{
          fontSize: '13px',
          color: '#888',
          marginBottom: '8px'
        }}>
          by {canvas.createdByName}
        </p>
      )}

      {canvas.publicCanEdit && canvas.visibility !== 'private' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
          color: '#10b981',
          marginBottom: '8px'
        }}>
          <Edit className="h-3 w-3" />
          <span>Public can edit</span>
        </div>
      )}

      <div style={{
        fontSize: '13px',
        color: '#888'
      }}>
        <p style={{ marginBottom: '4px' }}>
          Created: {canvas.createdAt.toLocaleDateString()}
        </p>
        <p>
          Updated: {canvas.updatedAt.toLocaleDateString()}
        </p>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#1a1a1a',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <p>Loading canvases...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#1a1a1a',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#ff6b6b', marginBottom: '16px' }}>Error loading canvases</p>
          <p style={{ fontSize: '14px', color: '#888' }}>{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1a1a',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '48px 24px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '600',
          marginBottom: '32px'
        }}>
          Canvases
        </h1>

        {/* Create New Canvas Form */}
        <form onSubmit={handleCreateCanvas} style={{
          marginBottom: '48px',
          background: '#2a2a2a',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #3a3a3a'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>Create New Canvas</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#888' }}>
                Name (optional - auto-generated if empty)
              </label>
              <input
                type="text"
                value={newCanvasName}
                onChange={(e) => setNewCanvasName(e.target.value)}
                placeholder="Enter canvas name or leave empty..."
                disabled={isCreating}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4a9eff'}
                onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#888' }}>
                Visibility
              </label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {(['private', 'unlisted', 'public'] as CanvasVisibility[]).map((vis) => (
                  <label
                    key={vis}
                    style={{
                      flex: '1 1 150px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px',
                      background: visibility === vis ? '#4a9eff20' : '#1a1a1a',
                      border: `2px solid ${visibility === vis ? '#4a9eff' : '#3a3a3a'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={vis}
                      checked={visibility === vis}
                      onChange={(e) => setVisibility(e.target.value as CanvasVisibility)}
                      style={{ cursor: 'pointer' }}
                    />
                    {getVisibilityIcon(vis)}
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', textTransform: 'capitalize' }}>
                        {vis}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        {vis === 'private' && 'Only you'}
                        {vis === 'unlisted' && 'Anyone with link'}
                        {vis === 'public' && 'Everyone'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              style={{
                padding: '12px 24px',
                background: isCreating ? '#3a3a3a' : '#4a9eff',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isCreating ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isCreating) {
                  e.currentTarget.style.background = '#3a8eef'
                }
              }}
              onMouseLeave={(e) => {
                if (!isCreating) {
                  e.currentTarget.style.background = '#4a9eff'
                }
              }}
            >
              {isCreating ? 'Creating...' : 'Create Canvas'}
            </button>
          </div>
        </form>

        {/* Tabs */}
        <div style={{ marginBottom: '24px', borderBottom: '1px solid #3a3a3a' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            <button
              onClick={() => setActiveTab('my')}
              style={{
                padding: '12px 0',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${activeTab === 'my' ? '#4a9eff' : 'transparent'}`,
                color: activeTab === 'my' ? '#fff' : '#888',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              My Canvases ({canvases.length})
            </button>
            <button
              onClick={() => setActiveTab('public')}
              style={{
                padding: '12px 0',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${activeTab === 'public' ? '#4a9eff' : 'transparent'}`,
                color: activeTab === 'public' ? '#fff' : '#888',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Public Canvases ({publicCanvases.length})
            </button>
          </div>
        </div>

        {/* Canvas List */}
        {activeTab === 'my' ? (
          canvases.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '64px 24px',
              color: '#888'
            }}>
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>No canvases yet</p>
              <p style={{ fontSize: '14px' }}>Create your first canvas to get started</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              {canvases.map((canvas) => renderCanvas(canvas, false))}
            </div>
          )
        ) : (
          publicCanvases.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '64px 24px',
              color: '#888'
            }}>
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>No public canvases</p>
              <p style={{ fontSize: '14px' }}>Check back later or create a public canvas</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              {publicCanvases.map((canvas) => renderCanvas(canvas, true))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
