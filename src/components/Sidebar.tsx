import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface SidebarProps {
  activePage: string
  setActivePage: (page: string) => void
  isDark: boolean
  toggleTheme: () => void
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}

interface UserShift {
  id: number
  barName: string
  date: string
  role: string
  start_time: string
  end_time: string
}

const formatTimeShort = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'pm' : 'am'
  const hour12 = hour % 12 || 12
  const minuteStr = minutes !== '00' ? `:${minutes}` : ''
  return `${hour12}${minuteStr}${ampm}`
}

const formatDateShort = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'numeric', 
    day: 'numeric',
    timeZone: 'UTC'
  })
}

const getRoleIcon = (role: string): string => {
  const r = role.toLowerCase()
  if (r === 'bartender') return 'ri-goblet-line'
  if (r === 'server') return 'ri-goblet-2-fill'
  if (r === 'host') return 'ri-book-open-line'
  if (r === 'cook') return 'ri-knife-line'
  if (r === 'bar back') return 'ri-cup-line'
  return 'ri-user-smile-line'
}

export function Sidebar({ 
  activePage, 
  setActivePage, 
  isDark, 
  toggleTheme, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen 
}: SidebarProps) {
  const [userShifts, setUserShifts] = useState<UserShift[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'shifts', label: 'Shift Swaps' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'messages', label: 'Messages' },
    { id: 'profile', label: 'Profile' },
  ]

  // Get current user ID
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUserId()
  }, [])

  // Load user's upcoming shifts from schedule table
  useEffect(() => {
    if (!userId) return

    const loadUserShifts = async () => {
      const today = new Date()
      const endDate = new Date()
      endDate.setDate(today.getDate() + 5)
      
      const todayStr = today.toISOString().split('T')[0]
      const endStr = endDate.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('schedule')
        .select('*')
        .eq('user_id', userId)
        .gte('date', todayStr)
        .lte('date', endStr)
        .order('date', { ascending: true })

      if (!error && data) {
        const shifts: UserShift[] = data.map((item: any) => ({
          id: item.id,
          barName: item.bar_id,
          date: item.date,
          role: item.role,
          start_time: item.start_time,
          end_time: item.end_time
        }))
        setUserShifts(shifts)
      }
    }

    loadUserShifts()
  }, [userId])

  // Group shifts by date
  const groupedShifts = new Map<string, UserShift[]>()
  userShifts.forEach(shift => {
    const existing = groupedShifts.get(shift.date) || []
    existing.push(shift)
    groupedShifts.set(shift.date, existing)
  })

  const sidebarContent = (
    <>
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-red-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] tracking-wide mb-8">
          BarShift
        </h1>
        
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActivePage(item.id)
                setIsMobileMenuOpen(false)
              }}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activePage === item.id 
                  ? isDark ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
                  : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Your Shifts Section */}
        {userShifts.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Your Shifts
            </p>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {Array.from(groupedShifts.entries()).map(([date, shifts]) => (
                <div key={date}>
                  <p className="text-xs text-gray-500 mb-1">{formatDateShort(date)}</p>
                  <div className="space-y-2">
                    {shifts.map((shift) => (
                      <div key={shift.id} className="text-sm">
                        <div className="flex items-center gap-1.5">
                          <i className={`${getRoleIcon(shift.role)} text-xs w-4`}></i>
                          <span className="font-medium">{shift.barName}</span>
                        </div>
                        <p className="text-xs text-gray-400 ml-5">
                          {formatTimeShort(shift.start_time)} - {formatTimeShort(shift.end_time)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center pt-4 border-t border-gray-700 mt-4">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors hover:bg-gray-700 text-xl"
          aria-label="Toggle theme"
        >
          <i className={`ri-${isDark ? 'sun-line' : 'moon-line'}`}></i>
        </button>
      </div>
    </>
  )

  return (
    <>
      <aside className={`
        hidden lg:flex lg:flex-col w-64 p-4 shadow-lg border-r
        ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
      `}>
        {sidebarContent}
      </aside>

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
        {sidebarContent}
      </aside>
    </>
  )
}