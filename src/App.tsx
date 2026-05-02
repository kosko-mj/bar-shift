import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/dashboard/Dashboard'
import { ShiftsPage, Shift } from './components/shifts/ShiftsPage'
import { ProfilePage } from './components/profile/ProfilePage'
import { SchedulePage } from './components/schedule/SchedulePage'
import { AuthModal } from './components/modals/AuthModal'
import { PostShiftModal } from './components/modals/PostShiftModal'
import { AlertsPage } from './components/alerts/AlertsPage'
import { MessagesPage } from './components/messages/MessagesPage'

interface DbAlert {
  id: number
  title: string
  type: string
  severity: string
  status: string
  message: string
  end_time: string | null
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
  const [selectedBar, setSelectedBar] = useState('Bonus Room')
  const [showBarDropdown, setShowBarDropdown] = useState(false)
  const [userName, setUserName] = useState('')
  const [userPosition, setUserPosition] = useState('')
  const [userBars, setUserBars] = useState(['Bonus Room'])
  const [isSaving, setIsSaving] = useState(false)
  const [activeAlerts, setActiveAlerts] = useState<DbAlert[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastReadAt, setLastReadAt] = useState<string>(new Date().toISOString())

  const loadProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error loading profile:', error)
    } else if (data) {
      setUserName(data.name || '')
      setUserPosition(data.position || '')
      setUserBars(data.bars || ['Bonus Room'])
      if (data.last_read_at) setLastReadAt(data.last_read_at)
    }
  }

  const saveProfile = async () => {
    if (!userId) return
    
    setIsSaving(true)
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        name: userName,
        position: userPosition,
        bars: userBars,
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile')
    } else {
      alert('Profile saved!')
    }
    
    setIsSaving(false)
  }

  const getDisplayName = () => {
    if (userName) return userName
    if (authEmail) return authEmail.split('@')[0]
    return 'Team Member'
  }

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

  const loadMessageCount = useCallback(async () => {
    if (!userId || !userBars.length) return
    
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('bar_id', userBars)
      .gt('created_at', lastReadAt)
      .neq('user_id', userId) // Don't count your own messages as "unread"
    
    if (error) console.error('Error loading message count:', error)
    else setUnreadCount(count || 0)
  }, [userId, userBars, lastReadAt])

  // Logic: When the user enters the messages page, mark everything as "read"
  useEffect(() => {
    if (activePage === 'messages' && userId) {
      const now = new Date().toISOString()
      setLastReadAt(now)
      setUnreadCount(0) // Visual shortcut: clear the count immediately
      
      // Update database
      supabase
        .from('profiles')
        .update({ last_read_at: now })
        .eq('id', userId)
        .then(({ error }) => {
          if (error) console.error('Error updating last_read_at:', error)
        })
    }
  }, [activePage, userId])

  const loadGlobalAlerts = useCallback(async () => {
    console.log('App: Loading global alerts for bar:', selectedBar)
    const now = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('bar_id', selectedBar)
      .in('status', ['open', 'acknowledged'])
      .or(`end_time.is.null,end_time.gt.${now}`)
      .order('created_at', { ascending: false })
      
    if (error) {
      console.error('App: Error loading alerts:', error)
    } else if (data) {
      console.log('App: Loaded', data.length, 'alerts')
      setActiveAlerts([...data])
    }
  }, [selectedBar])

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
        if (user?.id) {
          await loadProfile(user.id)
        }
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUserId(null)
    setShifts([])
    setUserName('')
    setUserPosition('')
    setUserBars(['Bonus Room'])
  }

  useEffect(() => {
  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      setUserId(session.user.id)
      await loadProfile(session.user.id)
      await loadShifts()
      await loadGlobalAlerts()
      await loadMessageCount()
    } else {
      setShowAuthModal(true)
    }
  }
  checkUser()
}, [loadGlobalAlerts, loadMessageCount])

  // Real-time subscription for shifts AND schedule AND alerts
  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'shifts' },
        () => {
          console.log('Shifts changed, reloading...')
          loadShifts()
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'schedule' },
        () => {
          console.log('Schedule changed, reloading shifts...')
          loadShifts()
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'alerts' },
        () => {
          console.log('Alerts changed, reloading...')
          loadGlobalAlerts()
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          console.log('Messages changed, reloading count...')
          loadMessageCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadGlobalAlerts, loadMessageCount])

  // Polling fallback for alerts (every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Polling: Refreshing alerts...')
      loadGlobalAlerts()
    }, 10000)
    return () => clearInterval(interval)
  }, [selectedBar, loadGlobalAlerts])

  const claimShift = async (shiftId: number, shiftDate: string, shiftStartTime: string, shiftEndTime: string, shiftRole: string) => {
    const { error: claimError } = await supabase
      .from('shifts')
      .update({ status: 'claimed' })
      .eq('id', shiftId)
    
    if (claimError) {
      console.error('Error claiming shift:', claimError)
      return
    }

    const { data: scheduleData, error: scheduleError } = await supabase
      .from('schedule')
      .select('*')
      .eq('date', shiftDate)
      .eq('role', shiftRole)
      .gte('start_time', shiftStartTime)
      .lte('end_time', shiftEndTime)

    if (scheduleError) {
      console.error('Error finding schedule shift:', scheduleError)
      return
    }

    if (scheduleData && scheduleData.length > 0) {
      const { error: updateError } = await supabase
        .from('schedule')
        .update({ user_id: userId })
        .eq('id', scheduleData[0].id)
      
      if (updateError) {
        console.error('Error updating schedule:', updateError)
      }
    } else {
      const { error: insertError } = await supabase
        .from('schedule')
        .insert([{
          bar_id: selectedBar,
          date: shiftDate,
          start_time: shiftStartTime,
          end_time: shiftEndTime,
          role: shiftRole,
          user_id: userId
        }])
      
      if (insertError) {
        console.error('Error creating schedule shift:', insertError)
      }
    }

    loadShifts()
  }

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

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar 
        activePage={activePage}
        setActivePage={setActivePage}
        isDark={isDark}
        toggleTheme={toggleTheme}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <main className="flex-1 p-4 lg:p-8">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden mb-4 text-3xl"
        >
          <i className="ri-menu-line"></i>
        </button>

        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold">
            Hello, {getDisplayName()}
          </h1>
        </div>

        {activePage === 'dashboard' && (
          <Dashboard
            selectedBar={selectedBar}
            setSelectedBar={setSelectedBar}
            showBarDropdown={showBarDropdown}
            setShowBarDropdown={setShowBarDropdown}
            userBars={userBars}
            isDark={isDark}
            openShiftsCount={shifts.filter(s => s.status === 'open').length}
            activeAlerts={activeAlerts}
            unreadCount={unreadCount}
            onNavigateToMessages={() => setActivePage('messages')}
            onNavigateToShifts={() => setActivePage('shifts')}
          />
        )}

        {activePage === 'shifts' && (
          <ShiftsPage
            shifts={shifts}
            isDark={isDark}
            onClaimShift={claimShift}
            onOpenPostModal={() => setShowPostModal(true)}
          />
        )}

        {activePage === 'schedule' && (
          <SchedulePage isDark={isDark} barName={selectedBar} />
        )}

        {activePage === 'alerts' && (
          <AlertsPage isDark={isDark} barName={selectedBar} userId={userId} isManager={true} />
        )}

        {activePage === 'messages' && (
          <MessagesPage 
            isDark={isDark} 
            barName={selectedBar}
            userBars={userBars}
            userId={userId} 
            userName={userName || getDisplayName()}
          />
        )}

        {activePage === 'profile' && (
          <ProfilePage
            userName={userName}
            setUserName={setUserName}
            userPosition={userPosition}
            setUserPosition={setUserPosition}
            userBars={userBars}
            setUserBars={setUserBars}
            isDark={isDark}
            onLogout={handleLogout}
            onSave={saveProfile}
            isSaving={isSaving}
          />
        )}

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          isLogin={isLogin}
          setIsLogin={setIsLogin}
          email={authEmail}
          setEmail={setAuthEmail}
          password={authPassword}
          setPassword={setAuthPassword}
          error={authError}
          onSubmit={handleAuth}
          isDark={isDark}
        />

        <PostShiftModal
          isOpen={showPostModal}
          onClose={() => setShowPostModal(false)}
          newShift={newShift}
          setNewShift={setNewShift}
          onSubmit={postShift}
          isDark={isDark}
        />
      </main>
    </div>
  )
}

export default App