'use client'
import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../../lib/config'

export default function ProfilePage() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE_URL}/auth/session`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then(setUser)
  }, [])

  if (!user) {
    return <div className="p-8 text-center text-stone-600 dark:text-stone-400">Please sign in to view your profile.</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-6">My Profile</h1>
      <div className="bg-white dark:bg-stone-800 rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Name</label>
          <p className="text-stone-900 dark:text-stone-100">{user.fullName || user.name || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Email</label>
          <p className="text-stone-900 dark:text-stone-100">{user.email}</p>
        </div>
      </div>
    </div>
  )
}
