import Navbar from '../components/Navbar'
import { Outlet } from 'react-router-dom'

function BaseLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default BaseLayout

