import { useState } from 'react'

function App() {
  const [activePage, setActivePage] = useState('dashboard')

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-4">
        <h1 className="text-xl font-bold text-green-700 mb-8">BarShift</h1>
        
        <nav className="space-y-2">
          <button 
            onClick={() => setActivePage('dashboard')}
            className={`w-full text-left px-4 py-2 rounded-lg ${activePage === 'dashboard' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActivePage('shifts')}
            className={`w-full text-left px-4 py-2 rounded-lg ${activePage === 'shifts' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Shift Swaps
          </button>
          <button 
            onClick={() => setActivePage('messages')}
            className={`w-full text-left px-4 py-2 rounded-lg ${activePage === 'messages' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Messages
          </button>
          <button 
            onClick={() => setActivePage('profile')}
            className={`w-full text-left px-4 py-2 rounded-lg ${activePage === 'profile' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Profile
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        {activePage === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h2>
            <p className="text-gray-600">Welcome to BarShift. Manage shifts and team communication.</p>
            
            {/* Stats cards placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-gray-500 text-sm">Open Shifts</h3>
                <p className="text-3xl font-bold text-gray-800">0</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-gray-500 text-sm">Unread Messages</h3>
                <p className="text-3xl font-bold text-gray-800">0</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-gray-500 text-sm">Team Members</h3>
                <p className="text-3xl font-bold text-gray-800">1</p>
              </div>
            </div>
          </div>
        )}

        {activePage === 'shifts' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Shift Swaps</h2>
            <p className="text-gray-600 mb-6">Post or claim shifts from your team.</p>
            
            {/* Post shift button */}
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              + Post a Shift
            </button>
            
            {/* Open shifts list placeholder */}
            <div className="mt-6 space-y-3">
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <p className="text-gray-500 text-sm">No open shifts at the moment.</p>
              </div>
            </div>
          </div>
        )}

        {activePage === 'messages' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Messages</h2>
            <p className="text-gray-600">Team messaging coming soon.</p>
          </div>
        )}

        {activePage === 'profile' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Profile</h2>
            <p className="text-gray-600">Your profile information.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App