import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface ScheduleShift {
  id: number
  bar_id: string
  date: string
  start_time: string
  end_time: string
  role: string
  user_id: string | null
  user_name?: string
}

interface Profile {
  id: string
  name: string
}

interface SchedulePageProps {
  isDark: boolean
  barName: string
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const formatTimeShort = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'pm' : 'am'
  const hour12 = hour % 12 || 12
  const minuteStr = minutes !== '00' ? `:${minutes}` : ''
  return `${hour12}${minuteStr}${ampm}`
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

export function SchedulePage({ isDark, barName }: SchedulePageProps) {
  const [schedule, setSchedule] = useState<ScheduleShift[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [newShift, setNewShift] = useState({
    date: '',
    start_time: '',
    end_time: '',
    role: 'bartender',
    user_id: ''
  })

  // Get start of week (Monday)
  const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const startOfWeek = getStartOfWeek(selectedWeek)
  const weekDates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    weekDates.push(d)
  }

  // Load profiles (employees)
  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name')
    if (!error && data) {
      setProfiles(data)
    }
  }

  // Load schedule for current week
  const loadSchedule = async () => {
    const startStr = startOfWeek.toISOString().split('T')[0]
    const endDate = new Date(startOfWeek)
    endDate.setDate(startOfWeek.getDate() + 7)
    const endStr = endDate.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('schedule')
      .select('*')
      .eq('bar_id', barName)
      .gte('date', startStr)
      .lt('date', endStr)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (!error && data) {
      // Join with profile names
      const shiftsWithNames = data.map(shift => ({
        ...shift,
        user_name: profiles.find(p => p.id === shift.user_id)?.name || 'Unassigned'
      }))
      setSchedule(shiftsWithNames)
    }
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  useEffect(() => {
    if (profiles.length > 0) {
      loadSchedule()
    }
  }, [selectedWeek, barName, profiles])

  const handleAddShift = async () => {
    if (!newShift.date || !newShift.start_time || !newShift.end_time) {
      alert('Please fill in all fields')
      return
    }

    const { error } = await supabase
      .from('schedule')
      .insert([{
        bar_id: barName,
        date: newShift.date,
        start_time: newShift.start_time,
        end_time: newShift.end_time,
        role: newShift.role,
        user_id: newShift.user_id || null
      }])

    if (error) {
      console.error('Error adding shift:', error)
      alert('Failed to add shift')
    } else {
      setShowAddModal(false)
      setNewShift({ date: '', start_time: '', end_time: '', role: 'bartender', user_id: '' })
      loadSchedule()
    }
  }

  const handleDeleteShift = async (shiftId: number) => {
    if (!confirm('Delete this shift?')) return

    const { error } = await supabase
      .from('schedule')
      .delete()
      .eq('id', shiftId)

    if (error) {
      console.error('Error deleting shift:', error)
      alert('Failed to delete shift')
    } else {
      loadSchedule()
    }
  }

  const prevWeek = () => {
    const newDate = new Date(selectedWeek)
    newDate.setDate(selectedWeek.getDate() - 7)
    setSelectedWeek(newDate)
  }

  const nextWeek = () => {
    const newDate = new Date(selectedWeek)
    newDate.setDate(selectedWeek.getDate() + 7)
    setSelectedWeek(newDate)
  }

  const currentWeek = () => {
    setSelectedWeek(new Date())
  }

  // Group shifts by date
  const getShiftsForDate = (date: string): ScheduleShift[] => {
    return schedule.filter(shift => shift.date === date)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Schedule</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          + Add Shift
        </button>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-gray-700">
            <i className="ri-arrow-left-s-line text-xl"></i>
          </button>
          <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-gray-700">
            <i className="ri-arrow-right-s-line text-xl"></i>
          </button>
        </div>
        <button onClick={currentWeek} className="text-sm hover:underline">
          This Week
        </button>
      </div>

      {/* Week grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header row */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDates.map((date, index) => (
              <div key={index} className="text-center p-2">
                <p className="font-medium">{daysOfWeek[date.getDay()]}</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {date.getMonth() + 1}/{date.getDate()}
                </p>
              </div>
            ))}
          </div>

          {/* Shifts grid */}
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date, index) => {
              const dateStr = date.toISOString().split('T')[0]
              const shiftsForDate = getShiftsForDate(dateStr)
              
              return (
                <div key={index} className={`min-h-[300px] p-2 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                  {shiftsForDate.length === 0 ? (
                    <div className="text-center text-xs text-gray-500 mt-4">
                      No shifts
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {shiftsForDate.map((shift) => (
                        <div
                          key={shift.id}
                          className={`p-2 rounded-lg text-sm ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-1">
                                <i className={`${getRoleIcon(shift.role)} text-xs`}></i>
                                <span className="font-medium capitalize">{shift.role}</span>
                              </div>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatTimeShort(shift.start_time)} - {formatTimeShort(shift.end_time)}
                              </p>
                              <p className="text-xs mt-1">
                                {shift.user_name || 'Unassigned'}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteShift(shift.id)}
                              className="text-red-500 hover:text-red-600 text-sm"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Add Shift Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-xl w-full max-w-md p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h3 className="text-xl font-bold mb-4">Add Shift</h3>
            
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
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Start</label>
                  <input
                    type="time"
                    className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                    value={newShift.start_time}
                    onChange={(e) => setNewShift({...newShift, start_time: e.target.value})}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>End</label>
                  <input
                    type="time"
                    className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                    value={newShift.end_time}
                    onChange={(e) => setNewShift({...newShift, end_time: e.target.value})}
                  />
                </div>
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
                  <option value="host">Host</option>
                  <option value="cook">Cook</option>
                  <option value="bar back">Bar Back</option>
                  <option value="door">Door / Security</option>
                  <option value="sound">Sound Engineer</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Assign to</label>
                <select
                  className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                  value={newShift.user_id}
                  onChange={(e) => setNewShift({...newShift, user_id: e.target.value})}
                >
                  <option value="">Unassigned</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>{profile.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddShift}
                className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Add Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}