interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  isLogin: boolean
  setIsLogin: (isLogin: boolean) => void
  email: string
  setEmail: (email: string) => void
  password: string
  setPassword: (password: string) => void
  error: string
  onSubmit: () => void
  isDark: boolean
}

export function AuthModal({
  isOpen,
  onClose,
  isLogin,
  setIsLogin,
  email,
  setEmail,
  password,
  setPassword,
  error,
  onSubmit,
  isDark
}: AuthModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl shadow-xl w-full max-w-md p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h3 className="text-xl font-bold mb-4">{isLogin ? 'Login' : 'Sign Up'}</h3>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
            <input 
              type="email" 
              className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
            <input 
              type="password" 
              className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-6">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-blue-500 hover:text-blue-400"
          >
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
          </button>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              Cancel
            </button>
            <button 
              onClick={onSubmit}
              className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              {isLogin ? 'Login' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}