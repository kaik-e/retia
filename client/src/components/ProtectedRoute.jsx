import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null)

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setIsAuthenticated(false)
        return
      }

      try {
        const response = await axios.get('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        setIsAuthenticated(response.data.valid)
      } catch (error) {
        setIsAuthenticated(false)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }

    verifyToken()
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
