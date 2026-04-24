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

export function ShiftsPage({ shifts, isDark, onClaimShift, onOpenPostModal }: ShiftsPageProps) {
  const openShifts = shifts.filter(shift => shift.status === 'open')

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
      
      <div className="mt-6 space-y-3">
        {openShifts.length === 0 ? (
          <div className={`rounded-xl p-4 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No open shifts at the moment.
            </p>
          </div>
        ) : (
          openShifts.map((shift) => (
            <div key={shift.id} className={`rounded-xl p-4 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{shift.role}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {shift.date} • {shift.start_time} - {shift.end_time}
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
          ))
        )}
      </div>
    </div>
  )
}