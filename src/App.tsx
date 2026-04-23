import { useState } from 'react'

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [showPostModal, setShowPostModal] = useState(false)
  const [newShift, setNewShift] = useState({
  date: '',
  startTime: '',
  endTime: '',
  role: 'bartender',
  note: ''
})
const [shifts, setShifts] = useState([])
const claimShift = (shiftId) => {
  setShifts(shifts.map(shift => 
    shift.id === shiftId 
      ? { ...shift, status: 'claimed' } 
      : shift
  ))
}

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
<p className="text-3xl font-bold text-gray-800">{shifts.filter(s => s.status === 'open').length}</p>              </div>
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
            <button 
              onClick={() => setShowPostModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              + Post a Shift
            </button>
            
            {/* Open shifts list placeholder */}
            <div className="mt-6 space-y-3">
              {shifts.filter(shift => shift.status === 'open').length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <p className="text-gray-500 text-sm">No open shifts at the moment.</p>
                </div>
              ) : (
                shifts.filter(shift => shift.status === 'open').map((shift) => (
                  <div key={shift.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{shift.role}</p>
                        <p className="text-sm text-gray-500">{shift.date} • {shift.startTime} - {shift.endTime}</p>
                        {shift.note && <p className="text-sm text-gray-500 mt-1">Note: {shift.note}</p>}
                      </div>
                      <button 
                        onClick={() => claimShift(shift.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                      >
                        Claim
                      </button>
                    </div>
                    <p className="text-xs text-green-600 mt-2">Open</p>
                  </div>
                ))
              )}
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
                        {showPostModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4">Post a Shift</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2" 
                    value={newShift.date}
                    onChange={(e) => setNewShift({...newShift, date: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input 
                    type="time" 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2" 
                    value={newShift.startTime}
                    onChange={(e) => setNewShift({...newShift, startTime: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input 
                    type="time" 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2" 
                    value={newShift.endTime}
                    onChange={(e) => setNewShift({...newShift, endTime: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    value={newShift.role}
                    onChange={(e) => setNewShift({...newShift, role: e.target.value})}
                  >
                    <option value="bartender">Bartender</option>
                    <option value="server">Server</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Optional Note</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    rows={3}
                    placeholder="Any additional info..."
                    value={newShift.note}
                    onChange={(e) => setNewShift({...newShift, note: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    const shiftToAdd = {
                      id: Date.now(),
                      ...newShift,
                      status: 'open'
                    }
                    setShifts([shiftToAdd, ...shifts])
                    setShowPostModal(false)
                    setNewShift({
                      date: '',
                      startTime: '',
                      endTime: '',
                      role: 'bartender',
                      note: ''
                    })
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Post Shift
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App