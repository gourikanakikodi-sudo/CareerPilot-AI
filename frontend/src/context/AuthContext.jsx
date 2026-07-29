import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (!token) {
      setLoading(false)
      return
    }
    api.get('/auth/profile/')
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const response = await api.post('/auth/login/', { email, password })
    localStorage.setItem('access', response.data.access)
    localStorage.setItem('refresh', response.data.refresh)
    setUser(response.data.user)
    return response.data
  }

  const register = async (payload) => {
    const response = await api.post('/auth/register/', payload)
    localStorage.setItem('access', response.data.access)
    localStorage.setItem('refresh', response.data.refresh)
    setUser(response.data.user)
    return response.data
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout/', { refresh: localStorage.getItem('refresh') })
    } catch (e) {
      // continue with local cleanup
    }
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    setUser(null)
  }

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
