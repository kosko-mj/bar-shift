import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export interface Shift {
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

interface ShiftsPageProps {
  shifts: Shift[]
  isDark: boolean
  onClaimShift: (shiftId: number) => void
  onOpenPostModal: () => void
}

interface ScheduledWorker {
  id: number
  name: string
  role: string
  date: string
  start_time: string
  end_time: string
}

interface Profile {
  id: string
  name: string
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

const formatDate = (dateString: string): string => {
  // Parse the date as UTC to avoid timezone shift
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    timeZone: 'UTC'
  })
}

const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'pm' : 'am'
  const hour12 = hour % 12 || 12
  const minuteStr = minutes !== '00' ? `:${minutes}` : ''
  return `${hour12}${minuteStr}${ampm}`
}

const timeToMinutes = (time: string): number => {
  const parts = time.split(':')
  return parseInt(parts[0]) * 60 + parseInt(parts[1])
}

const doShiftsOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const s1 = timeToMinutes(start1)
  const e1 = timeToMinutes(end1)
  const s2 = timeToMinutes(start2)
  const e2 = timeToMinutes(end2)
  
  const e1Adjusted = e1 <= s1 ? e1 + 24 * 60 : e1
  const e2Adjusted = e2 <= s2 ? e2 + 24 * 60 : e2
  
  return s1 < e2Adjusted && e1Adjusted > s2
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

export function ShiftsPage({ shifts, isDark, onClaimShift, onOpenPostModal }: ShiftsPageProps) {
  const [schedule, setSchedule] = useState<ScheduledWorker[]>([])
  const [loading, setLoading] = useState(true)
  const openShifts = shifts.filter(shift => shift.status === 'open')

  console.log('All schedule data:', schedule)

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setLoading(true)
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
        
        if (profilesError) {
          console.error('Error loading profiles:', profilesError)
          setLoading(false)
          return
        }

        const profileMap = new Map<string, string>()
        profilesData?.forEach((p: Profile) => {
          profileMap.set(p.id, p.name)
        })

        const { data: scheduleData, error: scheduleError } = await supabase
          .from('schedule')
          .select('*')

        if (scheduleError) {
          console.error('Error loading schedule:', scheduleError)
          setLoading(false)
          return
        }

        if (scheduleData) {
          const scheduleWithNames: ScheduledWorker[] = scheduleData.map((item: ScheduleItem) => ({
            id: item.id,
            name: profileMap.get(item.user_id || '') || 'Unassigned',
            role: item.role,
            date: item.date,
            start_time: item.start_time,
            end_time: item.end_time
          }))
          setSchedule(scheduleWithNames)
        }
      } catch (err) {
        console.error('Error in loadSchedule:', err)
      } finally {
        setLoading(false)
      }
    }

    loadSchedule()
  }, [])

  const getCoworkersForShift = (shiftDate: string, shiftStart: string, shiftEnd: string): ScheduledWorker[] => {
    console.log('Looking for date:', shiftDate)
    console.log('Schedule entries for this date:', schedule.filter(c => c.date === shiftDate))
    
    return schedule.filter(coworker => {
      if (coworker.date !== shiftDate) return false
      return doShiftsOverlap(shiftStart, shiftEnd, coworker.start_time, coworker.end_time)
    })
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Shift Swaps</h2>
        <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading schedule...
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Shift Swaps</h2>
      <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Post or claim shifts from your team.
      </p>
      
      <button 
        onClick={onOpenPostModal}
        className={`border px-4 py-2 rounded-lg transition-colors ${
          isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        Post a Shift
      </button>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {openShifts.length === 0 ? (
          <div className={`col-span-full rounded-xl p-4 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No open shifts at the moment.
            </p>
          </div>
        ) : (
          openShifts.map((shift) => {
  console.log('Raw shift object:', shift)
  console.log('Open shift date:', shift.date, 'start:', shift.start_time, 'end:', shift.end_time)
  const coworkers = getCoworkersForShift(shift.date, shift.start_time, shift.end_time)
            return (
              <div key={shift.id} className={`rounded-xl p-4 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} flex flex-col`}>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium capitalize">{shift.role}</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatDate(shift.date)} • {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                      </p>
                      {shift.note && (
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                          Note: {shift.note}
                        </p>
                      )}
                    </div>
                    <button 
                      onClick={() => onClaimShift(shift.id)}
                      className={`px-3 py-1 border text-sm rounded-lg transition-colors ${
                        isDark ? 'border-gray-700 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      Claim
                    </button>
                  </div>
                  
                  <p className="text-xs text-green-500 mt-2">Open</p>
                </div>
                
                {coworkers.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-400 mb-2">Working with:</p>
                    <div className="flex flex-col gap-2">
                      {coworkers.map((coworker) => (
                        <div key={coworker.id} className="flex items-center gap-2">
                          <i className={`${getRoleIcon(coworker.role)} text-sm w-5`}></i>
                          <span className="text-sm">{coworker.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}