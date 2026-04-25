import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Alert {
  id: number
  type: '86' | 'doh' | 'customer' | 'meeting'
  title: string
  message: string
  date: string
}

interface DashboardProps {
  userName: string
  authEmail: string
  selectedBar: string
  setSelectedBar: (bar: string) => void
  showBarDropdown: boolean
  setShowBarDropdown: (show: boolean) => void
  userBars: string[]
  alerts: Alert[]
  isDark: boolean
  openShiftsCount: number
  onNavigateToMessages: () => void
  onNavigateToShifts: () => void
}

interface UserScheduleShift {
  id: number
  date: string
  start_time: string
  end_time: string
  role: string
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
  if (r === 'door') return 'ri-id-card-line'
  if (r === 'sound') return 'ri-headphone-line'
  if (r === 'manager') return 'ri-user-2-line'
  return 'ri-user-smile-line'
}

export function Dashboard({
  selectedBar,
  setSelectedBar,
  showBarDropdown,
  setShowBarDropdown,
  userBars,
  alerts,
  isDark,
  openShiftsCount,
  onNavigateToMessages,
  onNavigateToShifts
}: DashboardProps) {
  const [userSchedule, setUserSchedule] = useState<UserScheduleShift[]>([])
  const [userId, setUserId] = useState<string | null>(null)

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

  // Load user's schedule for selected bar
  useEffect(() => {
    if (!userId) return

    const loadSchedule = async () => {
      const today = new Date()
      const endDate = new Date()
      endDate.setDate(today.getDate() + 7)
      
      const todayStr = today.toISOString().split('T')[0]
      const endStr = endDate.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('schedule')
        .select('*')
        .eq('user_id', userId)
        .eq('bar_id', selectedBar)
        .gte('date', todayStr)
        .lte('date', endStr)
        .order('date', { ascending: true })

      if (!error && data) {
        const shifts: UserScheduleShift[] = data.map((item: any) => ({
          id: item.id,
          date: item.date,
          start_time: item.start_time,
          end_time: item.end_time,
          role: item.role
        }))
        setUserSchedule(shifts)
      }
    }

    loadSchedule()
  }, [userId, selectedBar])

  // Group shifts by date
  const groupedSchedule = new Map<string, UserScheduleShift[]>()
  userSchedule.forEach(shift => {
    const existing = groupedSchedule.get(shift.date) || []
    existing.push(shift)
    groupedSchedule.set(shift.date, existing)
  })

  return (
    <div>
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

      {/* Clickable Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div 
          onClick={onNavigateToMessages}
          className={`rounded-xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg`}
        >
          <div className="flex items-center gap-2 mb-2">
            <i className="ri-mail-line text-xl text-blue-500"></i>
            <h3 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Messages</h3>
          </div>
          <p className="text-3xl font-bold">0</p>
          <p className="text-xs text-gray-400 mt-2">Unread messages</p>
        </div>
        
        <div 
          onClick={onNavigateToShifts}
          className={`rounded-xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg`}
        >
          <div className="flex items-center gap-2 mb-2">
            <i className="ri-exchange-line text-xl text-green-500"></i>
            <h3 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Open Shifts</h3>
          </div>
          <p className="text-3xl font-bold">{openShiftsCount}</p>
          <p className="text-xs text-gray-400 mt-2">Available to claim</p>
        </div>
      </div>

      {/* Your Schedule Section (real data from schedule table) */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Your Schedule</h3>
        {userSchedule.length === 0 ? (
          <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} text-center`}>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No upcoming shifts at {selectedBar}
            </p>
          </div>
        ) : (
          <div className={`rounded-xl p-4 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="space-y-4">
              {Array.from(groupedSchedule.entries()).map(([date, shifts]) => (
                <div key={date}>
                  <p className="text-sm font-medium text-gray-400 mb-2">{formatDateShort(date)}</p>
                  <div className="space-y-2">
                    {shifts.map((shift) => (
                      <div key={shift.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <i className={`${getRoleIcon(shift.role)} text-sm w-5`}></i>
                          <p className="text-sm text-gray-400">
                            {formatTimeShort(shift.start_time)} - {formatTimeShort(shift.end_time)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}