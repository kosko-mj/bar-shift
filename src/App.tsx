import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

interface Shift {
  id: number
  user_id: string
  date: string
  start_time: string
  end_time: string
  role: string
  note: string
  status: string
  created_at: string
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [showPostModal, setShowPostModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [newShift, setNewShift] = useState({
    date: '',
    startTime: '',
    endTime: '',
    role: 'bartender',
    note: ''
  })
  const [userId, setUserId] = useState<string | null>(null)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [authError, setAuthError] = useState('')

  // Load shifts from Supabase
  const loadShifts = async () => {
    console.log('Loading shifts...')
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('created_at', { ascending: false })
    
    console.log('Data:', data)
    console.log('Error:', error)
    
    if (error) {
      console.error('Error loading shifts:', error)
    } else {
      setShifts(data || [])
    }
  }

  // Auth handler
  const handleAuth = async () => {
    setAuthError('')
    
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      })
      if (error) {
        setAuthError(error.message)
      } else {
        setShowAuthModal(false)
        const { data: { user } } = await supabase.auth.getUser()
        setUserId(user?.id || null)
        loadShifts()
        setAuthEmail('')
        setAuthPassword('')
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      })
      if (error) {
        setAuthError(error.message)
      } else {
        setAuthError('Check your email to confirm your account!')
      }
    }
  }

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUserId(null)
    setShifts([])
  }

  // Check auth status on page load
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Session:', session)
      if (session?.user) {
        setUserId(session.user.id)
        await loadShifts()
      } else {
        setShowAuthModal(true)
      }
    }
    checkUser()
  }, [])

  // Claim a shift
  const claimShift = async (shiftId: number) => {
    console.log('Claiming shift:', shiftId)
    const { error } = await supabase
      .from('shifts')
      .update({ status: 'claimed' })
      .eq('id', shiftId)
    
    if (error) {
      console.error('Error claiming shift:', error)
    } else {
      loadShifts()
    }
  }

  // Post a new shift
  const postShift = async () => {
    console.log('postShift called')
    console.log('userId:', userId)
    console.log('newShift:', newShift)

    if (!userId) {
      console.error('User not logged in')
      return
    }

    const shiftToAdd = {
      user_id: userId,
      date: newShift.date,
      start_time: newShift.startTime,
      end_time: newShift.endTime,
      role: newShift.role,
      note: newShift.note,
      status: 'open'
    }

    console.log('shiftToAdd:', shiftToAdd)

    const { data, error } = await supabase
      .from('shifts')
      .insert([shiftToAdd])
      .select()

    if (error) {
      console.error('Supabase error:', error)
    } else {
      console.log('Success:', data)
      loadShifts()
      setShowPostModal(false)
      setNewShift({
        date: '',
        startTime: '',
        endTime: '',
        role: 'bartender',
        note: ''
      })
    }
  }

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Desktop sidebar - always visible */}
      <aside className={`
        hidden lg:block w-64 p-4 shadow-lg border-r
        ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
      `}>
        <h1 className="text-2xl font-bold text-red-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] tracking-wide mb-8">
          BarShift
        </h1>
        
        <nav className="space-y-1">
          <button 
            onClick={() => setActivePage('dashboard')}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              activePage === 'dashboard' 
                ? isDark ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
                : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActivePage('shifts')}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              activePage === 'shifts' 
                ? isDark ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
                : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Shift Swaps
          </button>
          <button 
            onClick={() => setActivePage('messages')}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              activePage === 'messages' 
                ? isDark ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
                : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Messages
          </button>
          <button 
            onClick={() => setActivePage('profile')}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              activePage === 'profile' 
                ? isDark ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
                : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Profile
          </button>
        </nav>
      </aside>

      {/* Mobile sidebar - fixed overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 bottom-0 w-64 p-4 shadow-lg z-50 transition-transform duration-300 lg:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isDark ? 'bg-gray-900 border-r border-gray-800' : 'bg-white border-r border-gray-200'}
      `}>
        <h1 className="text-2xl font-bold text-red-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] tracking-wide mb-8">
          BarShift
        </h1>
        
        <nav className="space-y-1">
          <button 
            onClick={() => {
              setActivePage('dashboard')
              setIsMobileMenuOpen(false)
            }}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              activePage === 'dashboard' 
                ? isDark ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
                : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => {
              setActivePage('shifts')
              setIsMobileMenuOpen(false)
            }}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              activePage === 'shifts' 
                ? isDark ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
                : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Shift Swaps
          </button>
          <button 
            onClick={() => {
              setActivePage('messages')
              setIsMobileMenuOpen(false)
            }}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              activePage === 'messages' 
                ? isDark ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
                : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Messages
          </button>
          <button 
            onClick={() => {
              setActivePage('profile')
              setIsMobileMenuOpen(false)
            }}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              activePage === 'profile' 
                ? isDark ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
                : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Profile
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-8">
        {/* Mobile menu button - RemixIcon */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden mb-4 text-3xl"
        >
          <i className="ri-menu-line"></i>
        </button>

        {activePage === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Welcome to BarShift. Manage shifts and team communication.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Open Shifts</h3>
                <p className="text-3xl font-bold">{shifts.filter(s => s.status === 'open').length}</p>
              </div>
              <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Unread Messages</h3>
                <p className="text-3xl font-bold">0</p>
              </div>
              <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Team Members</h3>
                <p className="text-3xl font-bold">1</p>
              </div>
            </div>
          </div>
        )}

        {activePage === 'shifts' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Shift Swaps</h2>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Post or claim shifts from your team.</p>
            
            <button 
              onClick={() => setShowPostModal(true)}
              className={`border px-4 py-2 rounded-lg transition-colors ${isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-300 hover:border-gray-400'}`}
            >
              Post a Shift
            </button>
            
            <div className="mt-6 space-y-3">
              {shifts.filter(shift => shift.status === 'open').length === 0 ? (
                <div className={`rounded-xl p-4 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No open shifts at the moment.</p>
                </div>
              ) : (
                shifts.filter(shift => shift.status === 'open').map((shift) => (
                  <div key={shift.id} className={`rounded-xl p-4 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{shift.role}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{shift.date} • {shift.start_time} - {shift.end_time}</p>
                        {shift.note && <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Note: {shift.note}</p>}
                      </div>
                      <button 
                        onClick={() => claimShift(shift.id)}
                        className={`px-3 py-1 border text-sm rounded-lg transition-colors ${isDark ? 'border-gray-700 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'}`}
                      >
                        Claim
                      </button>
                    </div>
                    <p className="text-xs text-green-500 mt-2">Open</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activePage === 'messages' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Messages</h2>
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Team messaging coming soon.</p>
          </div>
        )}

        {activePage === 'profile' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Profile</h2>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Your profile information.</p>
            
            <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="font-medium mb-1">Appearance</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Switch between dark and light mode</p>
                </div>
                <button 
                  onClick={toggleTheme}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isDark 
                      ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700' 
                      : 'bg-gray-200 hover:bg-gray-300 border border-gray-300'
                  }`}
                >
                  <i className={`ri-${isDark ? 'sun-line' : 'moon-line'} text-lg`}></i>
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>
              </div>
              
              {userId && (
                <div className="pt-4 border-t border-gray-700">
                  <button 
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auth Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className={`rounded-xl shadow-xl w-full max-w-md p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <h3 className="text-xl font-bold mb-4">{isLogin ? 'Login' : 'Sign Up'}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                  <input 
                    type="email" 
                    className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
                  <input 
                    type="password" 
                    className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                </div>
                
                {authError && (
                  <p className="text-sm text-red-500">{authError}</p>
                )}
              </div>
              
              <div className="flex justify-between items-center mt-6">
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-blue-500 hover:text-blue-400"
                >
                  {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowAuthModal(false)}
                    className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAuth}
                    className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    {isLogin ? 'Login' : 'Sign Up'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Post Shift Modal */}
        {showPostModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className={`rounded-xl shadow-xl w-full max-w-md p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <h3 className="text-xl font-bold mb-4">Post a Shift</h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Date</label>
                  <input 
                    type="date" 
                    className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
                    value={newShift.date}
                    onChange={(e) => setNewShift({...newShift, date: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Start Time</label>
                  <input 
                    type="time" 
                    className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
                    value={newShift.startTime}
                    onChange={(e) => setNewShift({...newShift, startTime: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>End Time</label>
                  <input 
                    type="time" 
                    className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
                    value={newShift.endTime}
                    onChange={(e) => setNewShift({...newShift, endTime: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Role</label>
                  <select 
                    className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
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
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Optional Note</label>
                  <textarea 
                    className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
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
                  className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={postShift}
                  className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
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