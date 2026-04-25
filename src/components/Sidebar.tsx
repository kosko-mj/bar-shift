import { mockUserShifts, formatDateShort, formatTimeShort, UserShift } from '../mocks/userShifts'

interface SidebarProps {
  activePage: string
  setActivePage: (page: string) => void
  isDark: boolean
  toggleTheme: () => void
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}

// Helper to get shifts for next 5 days
const getUpcomingShifts = (): UserShift[] => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const fiveDaysLater = new Date(today)
  fiveDaysLater.setDate(today.getDate() + 5)
  
  return mockUserShifts.filter(shift => {
    const shiftDate = new Date(shift.date)
    return shiftDate >= today && shiftDate < fiveDaysLater
  })
}

// Group shifts by date
const groupShiftsByDate = (shifts: UserShift[]): Map<string, UserShift[]> => {
  const grouped = new Map<string, UserShift[]>()
  shifts.forEach(shift => {
    const existing = grouped.get(shift.date) || []
    existing.push(shift)
    grouped.set(shift.date, existing)
  })
  return grouped
}

const getShiftTypeColor = (shiftType: string): string => {
  switch(shiftType) {
    case 'open': return 'text-green-500'
    case 'swing': return 'text-yellow-500'
    case 'close': return 'text-red-500'
    default: return 'text-gray-400'
  }
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

export function Sidebar({ 
  activePage, 
  setActivePage, 
  isDark, 
  toggleTheme, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen 
}: SidebarProps) {
  
  const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'shifts', label: 'Shift Swaps' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'messages', label: 'Messages' },
  { id: 'profile', label: 'Profile' },
]

  const upcomingShifts = getUpcomingShifts()
  const groupedShifts = groupShiftsByDate(upcomingShifts)

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
        {upcomingShifts.length > 0 && (
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
                          <span className={`text-xs ${getShiftTypeColor(shift.shiftType)}`}>
                            {shift.shiftType}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 ml-5">
                          {formatTimeShort(shift.startTime)} - {formatTimeShort(shift.endTime)}
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
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`
        hidden lg:flex lg:flex-col w-64 p-4 shadow-lg border-r
        ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
      `}>
        {sidebarContent}
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
        {sidebarContent}
      </aside>
    </>
  )
}