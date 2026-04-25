export interface UserShift {
  id: number
  barName: string
  date: string
  role: string
  shiftType: 'open' | 'swing' | 'close'
  startTime: string
  endTime: string
}

export const mockUserShifts: UserShift[] = [
  // Today
  { id: 1, barName: 'Bonus Room', date: '2026-04-25', role: 'bartender', shiftType: 'close', startTime: '20:00', endTime: '02:00' },
  
  // Tomorrow (Day 2)
  { id: 2, barName: 'Bonus Room', date: '2026-04-26', role: 'bartender', shiftType: 'close', startTime: '20:00', endTime: '02:00' },
  
  // Day 3
  { id: 3, barName: 'The Local', date: '2026-04-27', role: 'bar back', shiftType: 'swing', startTime: '16:00', endTime: '22:00' },
  { id: 4, barName: 'Bonus Room', date: '2026-04-27', role: 'bartender', shiftType: 'close', startTime: '20:00', endTime: '02:00' },
  
  // Day 4
  { id: 5, barName: 'Bonus Room', date: '2026-04-28', role: 'bartender', shiftType: 'close', startTime: '20:00', endTime: '02:00' },
  
  // Day 5
  { id: 6, barName: 'The Local', date: '2026-04-29', role: 'bartender', shiftType: 'swing', startTime: '18:00', endTime: '01:00' },
]

export const formatTimeShort = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'pm' : 'am'
  const hour12 = hour % 12 || 12
  const minuteStr = minutes !== '00' ? `:${minutes}` : ''
  return `${hour12}${minuteStr}${ampm}`
}

export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'numeric', 
    day: 'numeric' 
  })
}