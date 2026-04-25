import { useState, useEffect, useCallback } from 'react'
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

const formatTimeShort = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours, 10)
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
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingShift, setEditingShift] = useState<ScheduleShift | null>(null)
  const [startDate, setStartDate] = useState(new Date())
  const [draggedShift, setDraggedShift] = useState<ScheduleShift | null>(null)
  const [newShift, setNewShift] = useState({
    date: '',
    start_time: '',
    end_time: '',
    role: 'bartender',
    user_id: ''
  })

  const getStartOfWeek = useCallback((date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }, [])

  const getWeekDates = useCallback((weekStart: Date): Date[] => {
    const dates: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      dates.push(d)
    }
    return dates
  }, [])

  const currentWeekStart = getStartOfWeek(startDate)
  const nextWeekStart = new Date(currentWeekStart)
  nextWeekStart.setDate(currentWeekStart.getDate() + 7)

  const currentWeekDates = getWeekDates(currentWeekStart)
  const nextWeekDates = getWeekDates(nextWeekStart)

  useEffect(() => {
    const loadProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
      if (!error && data) {
        setProfiles(data)
      }
    }
    loadProfiles()
  }, [])

  useEffect(() => {
    const loadSchedule = async () => {
      const firstDay = currentWeekDates[0]?.toISOString().split('T')[0]
      const lastDay = nextWeekDates[6]?.toISOString().split('T')[0]
      
      if (!firstDay || !lastDay || profiles.length === 0) return

      const { data, error } = await supabase
        .from('schedule')
        .select('*')
        .eq('bar_id', barName)
        .gte('date', firstDay)
        .lte('date', lastDay)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      if (!error && data) {
        const shiftsWithNames = data.map((shift: ScheduleShift) => ({
          ...shift,
          user_name: profiles.find((p: Profile) => p.id === shift.user_id)?.name || 'Unassigned'
        }))
        setSchedule(shiftsWithNames)
      }
    }

    loadSchedule()
  }, [startDate, barName, profiles, currentWeekDates, nextWeekDates])

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
      setStartDate(prev => new Date(prev))
    }
  }

  const handleEditShift = async () => {
    if (!editingShift) return

    const { error } = await supabase
      .from('schedule')
      .update({ user_id: editingShift.user_id || null })
      .eq('id', editingShift.id)

    if (error) {
      console.error('Error updating shift:', error)
      alert('Failed to update shift')
    } else {
      setShowEditModal(false)
      setEditingShift(null)
      setStartDate(prev => new Date(prev))
    }
  }

  const openEditModal = (shift: ScheduleShift) => {
    setEditingShift(shift)
    setShowEditModal(true)
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
      setStartDate(prev => new Date(prev))
    }
  }

  const handleDragStart = (e: React.DragEvent, shift: ScheduleShift) => {
    setDraggedShift(shift)
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', shift.id.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = async (e: React.DragEvent, targetDate: string) => {
    e.preventDefault()
    if (!draggedShift) return

    if (draggedShift.date === targetDate) {
      setDraggedShift(null)
      return
    }

    const { error } = await supabase
      .from('schedule')
      .insert([{
        bar_id: draggedShift.bar_id,
        date: targetDate,
        start_time: draggedShift.start_time,
        end_time: draggedShift.end_time,
        role: draggedShift.role,
        user_id: draggedShift.user_id
      }])

    if (error) {
      console.error('Error copying shift:', error)
      alert('Failed to copy shift')
    } else {
      setStartDate(prev => new Date(prev))
    }

    setDraggedShift(null)
  }

  const handleDragEnd = () => {
    setDraggedShift(null)
  }

  const goPrevious = () => {
    const newDate = new Date(startDate)
    newDate.setDate(startDate.getDate() - 7)
    setStartDate(newDate)
  }

  const goNext = () => {
    const newDate = new Date(startDate)
    newDate.setDate(startDate.getDate() + 7)
    setStartDate(newDate)
  }

  const goToToday = () => {
    setStartDate(new Date())
  }

  const copyWeekToNext = async () => {
  if (!confirm('Copy all shifts from current week to next week? This will not overwrite existing shifts in next week.')) return

  const firstDay = currentWeekDates[0].toISOString().split('T')[0]
  const lastDay = currentWeekDates[6].toISOString().split('T')[0]

  const { data: currentWeekShifts, error: fetchError } = await supabase
    .from('schedule')
    .select('*')
    .eq('bar_id', barName)
    .gte('date', firstDay)
    .lte('date', lastDay)

  if (fetchError) {
    console.error('Error fetching current week shifts:', fetchError)
    alert('Failed to copy shifts')
    return
  }

  if (!currentWeekShifts || currentWeekShifts.length === 0) {
    alert('No shifts in current week to copy')
    return
  }

  const nextWeekShifts = currentWeekShifts.map(shift => {
    const originalDate = new Date(shift.date)
    const newDate = new Date(originalDate)
    newDate.setDate(originalDate.getDate() + 7)
    
    return {
      bar_id: shift.bar_id,
      date: newDate.toISOString().split('T')[0],
      start_time: shift.start_time,
      end_time: shift.end_time,
      role: shift.role,
      user_id: shift.user_id
    }
  })

  const { error: insertError } = await supabase
    .from('schedule')
    .insert(nextWeekShifts)

  if (insertError) {
    console.error('Error copying shifts:', insertError)
    alert('Failed to copy shifts')
  } else {
    alert(`Copied ${nextWeekShifts.length} shifts to next week`)
    setStartDate(prev => new Date(prev))
  }
}

  const getShiftsForDate = (dateStr: string): ScheduleShift[] => {
    return schedule.filter((shift: ScheduleShift) => shift.date === dateStr)
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const renderWeek = (weekDates: Date[], weekLabel: string) => (
    <div className="mb-8" key={weekLabel}>
      <h3 className="text-lg font-semibold mb-3">{weekLabel}</h3>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDates.map((date) => {
          const dateStr = date.toISOString().split('T')[0]
          const dayShifts = getShiftsForDate(dateStr)
          const isCurrentDay = isToday(date)
          
          return (
            <div
              key={dateStr}
              className={`rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} overflow-hidden`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, dateStr)}
            >
              <div className={`p-2 text-center border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} ${isCurrentDay ? (isDark ? 'bg-blue-900/50' : 'bg-blue-100') : ''}`}>
                <p className="text-sm font-medium">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {date.getMonth() + 1}/{date.getDate()}
                </p>
              </div>
              
              <div className="p-2 min-h-[200px]">
                {dayShifts.length === 0 ? (
                  <div className="text-center text-xs text-gray-500 py-4">
                    Drop shift here
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayShifts.map((shift) => (
                      <div
                        key={shift.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, shift)}
                        onDragEnd={handleDragEnd}
                        className={`p-2 rounded-lg text-xs ${isDark ? 'bg-gray-800' : 'bg-gray-100'} shadow-sm group cursor-copy hover:opacity-80 transition-opacity`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <i className={`${getRoleIcon(shift.role)} text-xs`}></i>
                              <span className="font-medium truncate">{shift.user_name || 'Unassigned'}</span>
                            </div>
                            <p className="text-gray-400 text-xs mt-0.5">
                              {formatTimeShort(shift.start_time)} - {formatTimeShort(shift.end_time)}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(shift)}
                              className="text-blue-500 hover:text-blue-400"
                              type="button"
                            >
                              <i className="ri-edit-line text-sm"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteShift(shift.id)}
                              className="text-red-500 hover:text-red-400"
                              type="button"
                            >
                              <i className="ri-delete-bin-line text-sm"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Schedule</h2>
        <div className="flex gap-2">
            <button
            onClick={copyWeekToNext}
            className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-200 hover:bg-blue-300'}`}
            type="button"
            >
            Copy Week
            </button>
            <button
            onClick={() => setShowAddModal(true)}
            className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            type="button"
            >
            + Add Shift
            </button>
        </div>
    </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button onClick={goPrevious} className="p-2 rounded-lg hover:bg-gray-700" type="button">
            <i className="ri-arrow-left-s-line text-xl"></i>
          </button>
          <button onClick={goNext} className="p-2 rounded-lg hover:bg-gray-700" type="button">
            <i className="ri-arrow-right-s-line text-xl"></i>
          </button>
        </div>
        <button onClick={goToToday} className="text-sm hover:underline" type="button">
          This Week
        </button>
      </div>

      {renderWeek(currentWeekDates, 'Current Week')}
      {renderWeek(nextWeekDates, 'Next Week')}

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
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleAddShift}
                className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                type="button"
              >
                Add Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shift Modal */}
      {showEditModal && editingShift && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-xl w-full max-w-md p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h3 className="text-xl font-bold mb-4">Edit Shift</h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Role</label>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{editingShift.role}</p>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Time</label>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatTimeShort(editingShift.start_time)} - {formatTimeShort(editingShift.end_time)}
                </p>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Assign to</label>
                <select
                  className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                  value={editingShift.user_id || ''}
                  onChange={(e) => setEditingShift({...editingShift, user_id: e.target.value || null, user_name: profiles.find(p => p.id === e.target.value)?.name || 'Unassigned'})}
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
                onClick={() => setShowEditModal(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleEditShift}
                className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                type="button"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}