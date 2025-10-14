import { useState, useEffect } from 'react'
import { auth, firestore, realtimeDb } from './lib/firebase'
import { doc, setDoc, onSnapshot } from 'firebase/firestore'

function App() {
  const [isTailwindWorking, setIsTailwindWorking] = useState(false)
  const [count, setCount] = useState(0)
  const [firebaseStatus, setFirebaseStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [isCounterLoading, setIsCounterLoading] = useState(true)

  // Reference to the counter document in Firestore
  const counterDocRef = doc(firestore, 'app', 'counter')

  // Test Firebase connection and set up real-time counter
  useEffect(() => {
    try {
      // Test if Firebase is initialized
      if (auth && firestore && realtimeDb) {
        setFirebaseStatus('connected')
        console.log('🔥 Firebase services initialized successfully!')
        
        // Set up real-time listener for counter
        const unsubscribe = onSnapshot(counterDocRef, 
          (doc) => {
            if (doc.exists()) {
              const data = doc.data()
              setCount(data.value || 0)
              console.log('📊 Counter loaded from Firestore:', data.value)
            } else {
              // Initialize counter if it doesn't exist
              setDoc(counterDocRef, { value: 0 })
              console.log('📊 Counter initialized in Firestore')
            }
            setIsCounterLoading(false)
          },
          (error) => {
            console.error('Error listening to counter:', error)
            setIsCounterLoading(false)
          }
        )

        // Cleanup listener on unmount
        return () => unsubscribe()
      } else {
        setFirebaseStatus('error')
      }
    } catch (error) {
      console.error('Firebase initialization error:', error)
      setFirebaseStatus('error')
    }
  }, [])

  // Update counter in Firestore
  const updateCounter = async (newValue: number) => {
    try {
      await setDoc(counterDocRef, { value: newValue })
      console.log('📊 Counter updated in Firestore:', newValue)
    } catch (error) {
      console.error('Error updating counter:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">CC</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  CollabCanvas
                </h1>
                <p className="text-sm text-gray-500">MVP Development</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-600">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          {/* Status Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-sm font-medium">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
            Tailwind CSS Testing Mode
          </div>

          {/* Hero Section */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              Real-time
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Collaborative Canvas
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Building a multiplayer canvas experience with React, Konva.js, and Firebase. 
              Testing modern UI components with Tailwind CSS.
            </p>
          </div>

          {/* Interactive Test Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Tailwind CSS Test</h2>
            
            {/* Firestore Counter */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <button
                  onClick={() => updateCounter(count + 1)}
                  disabled={isCounterLoading || firebaseStatus !== 'connected'}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <span className="mr-2">🔥</span>
                  {isCounterLoading ? 'Loading...' : `Firestore Counter: ${count}`}
                  <span className="ml-2">✨</span>
                </button>
                
                {count > 0 && (
                  <button
                    onClick={() => updateCounter(0)}
                    disabled={isCounterLoading || firebaseStatus !== 'connected'}
                    className="inline-flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reset
                  </button>
                )}
              </div>
              
              {count > 0 && !isCounterLoading && (
                <div className="animate-fade-in space-y-2">
                  <p className="text-green-600 font-medium">
                    🎉 Firestore is working! Data persists across refreshes!
                  </p>
                  <p className="text-blue-600 text-sm">
                    💡 Try opening another tab - the counter syncs in real-time!
                  </p>
                </div>
              )}
              
              {isCounterLoading && (
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Connecting to Firestore...</span>
                </div>
              )}
            </div>

            {/* Tailwind Status Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsTailwindWorking(!isTailwindWorking)}
                className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  isTailwindWorking
                    ? 'bg-green-100 text-green-800 border-2 border-green-200 shadow-md'
                    : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {isTailwindWorking ? '✅ Tailwind is Working!' : '🧪 Test Tailwind'}
              </button>
              
              {isTailwindWorking && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg animate-slide-up">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">🎨</span>
                    <span className="font-semibold text-green-800">Perfect!</span>
                  </div>
                  <p className="text-green-700 text-sm mt-2">
                    All Tailwind utilities are loading correctly. Ready for the next phase!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tech Stack Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12">
            {[
              { name: 'React', icon: '⚛️', color: 'from-blue-400 to-cyan-400' },
              { name: 'Konva.js', icon: '🎨', color: 'from-green-400 to-emerald-400' },
              { name: 'Firebase', icon: '🔥', color: 'from-orange-400 to-red-400' },
              { name: 'Tailwind', icon: '💨', color: 'from-purple-400 to-pink-400' }
            ].map((tech, index) => (
              <div
                key={tech.name}
                className="group bg-white rounded-xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${tech.color} rounded-lg flex items-center justify-center text-2xl mb-3 mx-auto group-hover:scale-110 transition-transform duration-200`}>
                  {tech.icon}
                </div>
                <h3 className="font-semibold text-gray-900">{tech.name}</h3>
                <div className="w-8 h-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full mx-auto mt-2 group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300"></div>
              </div>
            ))}
          </div>

          {/* Firebase Status */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-200/50">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              🔥 Firebase Status
            </h3>
            <div className="flex items-center space-x-3">
              {firebaseStatus === 'checking' && (
                <>
                  <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-yellow-700 font-medium">Checking Firebase connection...</span>
                </>
              )}
              {firebaseStatus === 'connected' && (
                <>
                  <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                  <span className="text-green-700 font-medium">Firebase connected! ✅</span>
                </>
              )}
              {firebaseStatus === 'error' && (
                <>
                  <div className="w-4 h-4 bg-red-400 rounded-full"></div>
                  <span className="text-red-700 font-medium">Firebase configuration needed ⚠️</span>
                </>
              )}
            </div>
            {firebaseStatus === 'connected' && (
              <p className="text-green-600 text-sm mt-2">
                Auth, Firestore, and Realtime Database are ready for development!
              </p>
            )}
            {firebaseStatus === 'error' && (
              <p className="text-red-600 text-sm mt-2">
                Please complete the Firebase setup steps and add your config to .env.local
              </p>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200/50">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">🚀 Next: Authentication System</h3>
            <p className="text-gray-600">
              Once Firebase is connected, we'll build the login/register system for user authentication.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
