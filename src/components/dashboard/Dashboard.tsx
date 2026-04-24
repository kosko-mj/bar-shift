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

export function Dashboard({
  selectedBar,
  setSelectedBar,
  showBarDropdown,
  setShowBarDropdown,
  userBars,
  alerts,
  isDark,
  openShiftsCount
}: DashboardProps) {
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

      {/* Stats Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Operations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <i className="ri-exchange-line text-xl text-green-500"></i>
              <h3 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Open Shifts</h3>
            </div>
            <p className="text-3xl font-bold">{openShiftsCount}</p>
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
  )
}