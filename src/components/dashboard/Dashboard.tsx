import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface DashboardProps {
  selectedBar: string
  setSelectedBar: (bar: string) => void
  showBarDropdown: boolean
  setShowBarDropdown: (show: boolean) => void
  userBars: string[]
  isDark: boolean
  openShiftsCount: number
  activeAlerts: DbAlert[]
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

interface ScheduleItem {
  id: number
  bar_id: string
  date: string
  start_time: string
  end_time: string
  role: string
  user_id: string | null
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

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
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

const formatRemainingTime = (endTime: string | null): string => {
  if (!endTime) return ''
  const end = new Date(endTime)
  const now = new Date()
  const hoursLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60))
  if (hoursLeft <= 0) return 'Expired'
  if (hoursLeft < 24) return `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} left`
  const daysLeft = Math.ceil(hoursLeft / 24)
  return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
}

const getAlertIcon = (alertType: string): string => {
  switch(alertType) {
    case '86': return 'ri-restaurant-line'
    case 'staff_meeting': return 'ri-calendar-event-line'
    case 'doh': return 'ri-government-line'
    case 'incident': return 'ri-alert-line'
    case 'customer_86': return 'ri-user-forbid-line'
    case 'maintenance': return 'ri-tools-line'
    case 'staff_notice': return 'ri-team-line'
    case 'shift_handoff': return 'ri-exchange-line'
    default: return 'ri-notification-line'
  }
}

const getAlertTextColor = (alertType: string): string => {
  if (alertType === '86') return 'text-red-500'
  if (alertType === 'staff_meeting') return 'text-blue-500'
  if (alertType === 'customer_86') return 'text-purple-500'
  if (alertType === 'incident') return 'text-red-600'
  return 'text-yellow-500'
}

export function Dashboard({
  selectedBar,
  setSelectedBar,
  showBarDropdown,
  setShowBarDropdown,
  userBars,
  isDark,
  openShiftsCount,
  activeAlerts,
  onNavigateToMessages,
  onNavigateToShifts
}: DashboardProps) {
  const [userSchedule, setUserSchedule] = useState<UserScheduleShift[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUserId()
  }, [])

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
        const shifts: UserScheduleShift[] = data.map((item: ScheduleItem) => ({
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

  const groupedSchedule = new Map<string, UserScheduleShift[]>()
  userSchedule.forEach(shift => {
    const existing = groupedSchedule.get(shift.date) || []
    existing.push(shift)
    groupedSchedule.set(shift.date, existing)
  })

  const customerAlerts = activeAlerts.filter(alert => alert.type === 'customer_86')
  const menuAlerts = activeAlerts.filter(alert => alert.type === '86')
  const otherAlerts = activeAlerts.filter(alert => alert.type !== 'customer_86' && alert.type !== '86')

  return (
    <div>
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

      {activeAlerts.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customerAlerts.length > 0 && (
              <div className={`rounded-xl border-l-4 border-l-purple-500 p-4 ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  <i className="ri-user-forbid-line text-xl text-purple-500"></i>
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-500">86'd Customers</h3>
                    <div className="mt-2 space-y-1">
                      {customerAlerts.map((alert) => (
                        <div key={alert.id} className="text-sm">
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                            {alert.title.replace('86 Customer: ', '')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {menuAlerts.length > 0 && (
              <div className={`rounded-xl border-l-4 border-l-red-500 p-4 ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  <i className="ri-restaurant-line text-xl text-red-500"></i>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-500">86'd Items</h3>
                    <div className="mt-2 space-y-1">
                      {menuAlerts.map((alert) => (
                        <div key={alert.id} className="flex justify-between items-center text-sm">
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                            {alert.title}
                          </span>
                          {alert.end_time && (
                            <span className="text-xs text-yellow-500">
                              {formatRemainingTime(alert.end_time)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {otherAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-xl p-4 border-l-4 ${alert.type === 'staff_meeting' ? 'border-l-blue-500' : alert.type === 'incident' ? 'border-l-red-600' : 'border-l-yellow-500'} ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}
              >
                <div className="flex items-start gap-3">
                  <i className={`${getAlertIcon(alert.type)} text-xl ${getAlertTextColor(alert.type)}`}></i>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{alert.title}</h4>
                    {alert.type === 'staff_meeting' && alert.end_time && (
                      <p className="text-xs text-blue-400 mt-0.5">
                        {formatDateTime(alert.end_time)}
                      </p>
                    )}
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {alert.message.length > 80 ? alert.message.slice(0, 80) + '...' : alert.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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