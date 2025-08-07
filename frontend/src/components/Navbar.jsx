import { Link } from 'react-router-dom'
import { useContext } from 'react'
import { RoleContext } from './RoleContext'

function Navbar() {
  const { role, logout } = useContext(RoleContext)

  let linksToRender = [];

  // --- Define links for each role ---

  const hrLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/upload', label: 'Upload CSV' },
    { path: '/manual-entry', label: 'Manual Entry' },
    { path: '/insights', label: 'Insights' },
  ];

  const managerLinks = [
    // This new, specific path resolves the access conflict.
    { path: '/manager-dashboard', label: 'Dashboard' },
    { path: '/assigntask', label: 'Assign Task' },
    { path: '/insightstl', label: 'Insights' },
  ];
  
  const employeeLinks = [
    { path: '/employee-dashboard', label: 'Dashboard' }
  ];

  // --- Select the correct set of links based on the current role ---
  switch (role) {
    case 'HR':
      linksToRender = hrLinks;
      break;
    case 'Manager':
      linksToRender = managerLinks;
      break;
    case 'Employee':
      linksToRender = employeeLinks;
      break;
    default:
      // Fallback for when a role is not set (e.g., on a login page)
      linksToRender = []; 
  }

  return (
    <nav className="bg-white shadow-md px-6 py-3 flex justify-between items-center border-b border-gray-200">
      <div className="text-2xl font-semibold text-blue-700 tracking-tight">
        Ascend
      </div>
      <div className="flex gap-4 items-center text-sm text-gray-700">
        {linksToRender.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className="px-3 py-1 rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200"
          >
            {link.label}
          </Link>
        ))}
        {/* Only show the logout button if a role is active */}
        {role && (
          <button
            onClick={logout}
            className="ml-2 px-4 py-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition duration-200"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  )
}

export default Navbar;