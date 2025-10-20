import React, { useState, useEffect } from 'react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface ImageToolbarProps {
  onImageUrlChange: (url: string) => void
}

const ImageToolbar: React.FC<ImageToolbarProps> = ({ onImageUrlChange }) => {
  const [imageUrl, setImageUrl] = useState('')

  // Load saved URL from localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem('collabcanvas-image-url')
    if (savedUrl) {
      setImageUrl(savedUrl)
    }
  }, [])

  const handleUrlChange = (url: string) => {
    setImageUrl(url)
    localStorage.setItem('collabcanvas-image-url', url)
    onImageUrlChange(url)
  }

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="imageUrl" className="text-xs whitespace-nowrap">Image URL:</Label>
      <Input
        id="imageUrl"
        type="text"
        value={imageUrl}
        onChange={(e) => handleUrlChange(e.target.value)}
        placeholder="https://example.com/image.jpg"
        className="h-8 text-sm flex-1"
      />
    </div>
  )
}

export default ImageToolbar
