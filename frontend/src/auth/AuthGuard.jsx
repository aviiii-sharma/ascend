import { useContext } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { RoleContext } from '../components/RoleContext'

function AuthGuard({ allowedRoles }) {
  const { role } = useContext(RoleContext)

  if (!role) {
    return <Navigate to="/" />
  }

  if (!allowedRoles.includes(role)) {
    return <div className="p-10 text-red-600 text-xl font-bold">🚫 Access Denied</div>
  }

  return <Outlet />
}

export default AuthGuard
