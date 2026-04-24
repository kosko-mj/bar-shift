interface ProfilePageProps {
  userName: string
  setUserName: (name: string) => void
  userPosition: string
  setUserPosition: (position: string) => void
  userBars: string[]
  setUserBars: (bars: string[]) => void
  isDark: boolean
  onLogout: () => void
  onSave: () => void
  isSaving: boolean
}

export function ProfilePage({
  userName,
  setUserName,
  userPosition,
  setUserPosition,
  userBars,
  setUserBars,
  isDark,
  onLogout,
  onSave,
  isSaving
}: ProfilePageProps) {
  const addBar = () => {
    const input = document.getElementById('newBarInput') as HTMLInputElement
    if (input.value.trim()) {
      setUserBars([...userBars, input.value.trim()])
      input.value = ''
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      
      <div className="space-y-6">
        {/* Personal Info Section */}
        <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="ri-user-line"></i>
            Personal Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Name</label>
              <input 
                type="text" 
                className={`w-full max-w-md rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
                placeholder="Your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Position</label>
              <input 
                type="text" 
                className={`w-full max-w-md rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
                placeholder="e.g., Bartender, Manager, Server"
                value={userPosition}
                onChange={(e) => setUserPosition(e.target.value)}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Avatar</label>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  {userName ? userName.charAt(0).toUpperCase() : '?'}
                </div>
                <button className={`px-3 py-1 rounded-lg text-sm ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}>
                  Upload Photo
                </button>
              </div>
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Photo upload coming soon. Using initials for now.</p>
            </div>
          </div>
        </div>

        {/* Bars Section */}
        <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="ri-store-line"></i>
            My Bars
          </h3>
          <div className="space-y-3">
            {userBars.map((bar, index) => (
              <div key={index} className="flex items-center justify-between">
                <span>{bar}</span>
                <button 
                  onClick={() => setUserBars(userBars.filter(b => b !== bar))}
                  className="text-red-500 hover:text-red-600"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <input 
                type="text" 
                className={`flex-1 rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
                placeholder="Add a bar (e.g., 'The Local')"
                id="newBarInput"
              />
              <button 
                onClick={addBar}
                className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Save and Logout Buttons */}
        <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex gap-4">
            <button 
              onClick={onSave}
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              <i className="ri-save-line"></i>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              onClick={onLogout}
              className="px-4 py-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
            >
              <i className="ri-logout-box-line"></i>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}