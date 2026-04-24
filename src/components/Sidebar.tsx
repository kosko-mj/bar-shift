interface SidebarProps {
  activePage: string
  setActivePage: (page: string) => void
  isDark: boolean
  toggleTheme: () => void
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
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
    { id: 'messages', label: 'Messages' },
    { id: 'profile', label: 'Profile' },
  ]

  // Inline the JSX instead of creating a separate component
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