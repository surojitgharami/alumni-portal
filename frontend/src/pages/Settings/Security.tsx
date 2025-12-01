import { useState } from 'react'
import { useAuth } from '../../App'
import { Lock, LogOut } from 'lucide-react'

// Security settings page for password management and session control

export default function SecuritySettings() {
  const { token } = useAuth()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match')
      return
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
      })
      
      if (response.ok) {
        setMessage('Password changed successfully')
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setMessage('Failed to change password')
      }
    } catch (error) {
      setMessage('Error: ' + (error as Error).message)
    }
  }
  
  const handleLogoutAll = async () => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/logout-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Logged out from all devices')
    } catch (error) {
      console.error('Error:', error)
    }
  }
  
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Security Settings</h1>
      
      <div className="bg-white p-6 rounded-lg border mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Lock size={24} /> Change Password</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Current Password</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>
        
        {message && <p className="text-sm mb-4 text-blue-600">{message}</p>}
        
        <button
          onClick={handleChangePassword}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Update Password
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><LogOut size={24} /> Sessions</h2>
        <p className="text-gray-600 mb-4">End all active sessions on other devices</p>
        <button
          onClick={handleLogoutAll}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
        >
          Logout All Sessions
        </button>
      </div>
    </div>
  )
}
