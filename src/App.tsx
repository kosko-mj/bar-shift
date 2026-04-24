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

interface Alert {
  id: number
  type: '86' | 'doh' | 'customer' | 'meeting'
  title: string
  message: string
  date: string
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
  const [selectedBar, setSelectedBar] = useState('Bonus Room')
  const [showBarDropdown, setShowBarDropdown] = useState(false)
  const [userName, setUserName] = useState('')
  const [userPosition, setUserPosition] = useState('')
  const [userBars, setUserBars] = useState(['Bonus Room'])

  // Hardcoded alerts for demo
  const alerts: Alert[] = [
    { id: 1, type: '86', title: '86 - Narragansett', message: 'Sold out until Tuesday delivery', date: '2026-04-24' },
    { id: 2, type: '86', title: '86 - Fries', message: 'Potato shortage — sub tots or upgrade to onion rings', date: '2026-04-24' },
    { id: 3, type: 'doh', title: 'DOH Alert', message: 'Health department in area. Be ready!', date: '2026-04-23' },
    { id: 4, type: 'customer', title: 'Problem Customer Alert', message: 'Ridgewood area — male, 40s, aggressive. Call security if seen.', date: '2026-04-22' },
    { id: 5, type: 'meeting', title: 'Staff Meeting', message: 'Mandatory all-hands meeting Monday 4/28 10am', date: '2026-04-28' },
  ]

  // Load shifts from Supabase
  const loadShifts = async () => {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('created_at', { ascending: false })
    
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

    const { error } = await supabase
      .from('shifts')
      .insert([shiftToAdd])

    if (error) {
      console.error('Error posting shift:', error)
    } else {
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

  const getAlertIcon = (type: string) => {
    switch(type) {
      case '86': return 'ri-restaurant-line'
      case 'doh': return 'ri-government-line'
      case 'customer': return 'ri-user-forbid-line'
      case 'meeting': return 'ri-calendar-event-line'
      default: return 'ri-notification-line'
    }
  }

  const getAlertColor = (type: string) => {
    switch(type) {
      case '86': return 'text-purple-500 border-purple-500/30 bg-purple-500/5'
      case 'doh': return 'text-blue-500 border-blue-500/30 bg-blue-500/5'
      case 'customer': return 'text-red-500 border-red-500/30 bg-red-500/5'
      case 'meeting': return 'text-amber-500 border-amber-500/30 bg-amber-500/5'
      default: return 'text-gray-500 border-gray-500/30 bg-gray-500/5'
    }
  }

  // Get display name (from userName or email or fallback)
  const getDisplayName = () => {
    if (userName) return userName
    if (authEmail) return authEmail.split('@')[0]
    return 'Team Member'
  }

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Desktop sidebar - always visible */}
      <aside className={`
        hidden lg:flex lg:flex-col w-64 p-4 shadow-lg border-r
        ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
      `}>
        <div className="flex-1">
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
        </div>

        {/* Theme toggle at bottom of sidebar - centered */}
        <div className="flex justify-center pt-4 border-t border-gray-700 mt-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors hover:bg-gray-700 text-xl"
            aria-label="Toggle theme"
          >
            <i className={`ri-${isDark ? 'sun-line' : 'moon-line'}`}></i>
          </button>
        </div>
      </aside>

      {/* Mobile sidebar - fixed overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 bottom-0 w-64 p-4 shadow-lg z-50 transition-transform duration-300 lg:hidden flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isDark ? 'bg-gray-900 border-r border-gray-800' : 'bg-white border-r border-gray-200'}
      `}>
        <div className="flex-1">
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
        </div>

        {/* Theme toggle at bottom of mobile sidebar - centered */}
        <div className="flex justify-center pt-4 border-t border-gray-700 mt-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors hover:bg-gray-700 text-xl"
            aria-label="Toggle theme"
          >
            <i className={`ri-${isDark ? 'sun-line' : 'moon-line'}`}></i>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-8">
        {/* Mobile menu button */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden mb-4 text-3xl"
        >
          <i className="ri-menu-line"></i>
        </button>

        {/* Dashboard / Bar Name View */}
        {activePage === 'dashboard' && (
          <div>
            {/* Greeting */}
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Hello, {getDisplayName()}
            </h1>
            
            {/* Bar selector */}
            <div className="relative mb-8">
              <button
                onClick={() => setShowBarDropdown(!showBarDropdown)}
                className="flex items-center gap-2 text-xl md:text-2xl text-gray-500 hover:text-gray-400 transition-opacity"
              >
                {selectedBar}
                <i className={`ri-arrow-down-s-line text-xl transition-transform ${showBarDropdown ? 'rotate-180' : ''}`}></i>
              </button>
              
              {showBarDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowBarDropdown(false)} />
                  <div className={`absolute top-full left-0 mt-1 w-48 rounded-lg shadow-lg border z-40 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    {userBars.map((bar) => (
                      <button
                        key={bar}
                        onClick={() => {
                          setSelectedBar(bar)
                          setShowBarDropdown(false)
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedBar === bar ? (isDark ? 'bg-gray-700' : 'bg-gray-100') : ''}`}
                      >
                        {bar}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Alerts Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <i className="ri-alert-line text-red-500"></i>
                Alerts & Announcements
              </h3>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`rounded-lg p-4 border ${getAlertColor(alert.type)}`}>
                    <div className="flex items-start gap-3">
                      <i className={`${getAlertIcon(alert.type)} text-xl mt-0.5`}></i>
                      <div className="flex-1">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <h4 className="font-semibold">{alert.title}</h4>
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{alert.date}</span>
                        </div>
                        <p className="text-sm mt-1 opacity-90">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Cards */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Operations</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-exchange-line text-xl text-green-500"></i>
                    <h3 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Open Shifts</h3>
                  </div>
                  <p className="text-3xl font-bold">{shifts.filter(s => s.status === 'open').length}</p>
                </div>
                <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-mail-line text-xl text-blue-500"></i>
                    <h3 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Unread Messages</h3>
                  </div>
                  <p className="text-3xl font-bold">0</p>
                </div>
                <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-team-line text-xl text-purple-500"></i>
                    <h3 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Team Members</h3>
                  </div>
                  <p className="text-3xl font-bold">1</p>
                </div>
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
            
            <div className="space-y-6">
              {/* Personal Info Section */}
              <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <i className="ri-user-line"></i>
                  Personal Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Name</label>
                    <input 
                      type="text" 
                      className={`w-full max-w-md rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
                      placeholder="Your name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Position</label>
                    <input 
                      type="text" 
                      className={`w-full max-w-md rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
                      placeholder="e.g., Bartender, Manager, Server"
                      value={userPosition}
                      onChange={(e) => setUserPosition(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Avatar</label>
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        {userName ? userName.charAt(0).toUpperCase() : '?'}
                      </div>
                      <button className={`px-3 py-1 rounded-lg text-sm ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}>
                        Upload Photo
                      </button>
                    </div>
                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Photo upload coming soon. Using initials for now.</p>
                  </div>
                </div>
              </div>

              {/* Bars Section */}
              <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <i className="ri-store-line"></i>
                  My Bars
                </h3>
                <div className="space-y-3">
                  {userBars.map((bar, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span>{bar}</span>
                      <button 
                        onClick={() => setUserBars(userBars.filter(b => b !== bar))}
                        className="text-red-500 hover:text-red-600"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <input 
                      type="text" 
                      className={`flex-1 rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
                      placeholder="Add a bar (e.g., 'The Local')"
                      id="newBarInput"
                    />
                    <button 
                      onClick={() => {
                        const input = document.getElementById('newBarInput') as HTMLInputElement
                        if (input.value.trim()) {
                          setUserBars([...userBars, input.value.trim()])
                          input.value = ''
                        }
                      }}
                      className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                >
                  <i className="ri-logout-box-line"></i>
                  Logout
                </button>
              </div>
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