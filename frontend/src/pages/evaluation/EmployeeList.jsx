import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UsersIcon,
  DocumentChartBarIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  BriefcaseIcon, 
  AcademicCapIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

function EmployeeList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingReportFor, setGeneratingReportFor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/employees/all');
      if (!response.ok) throw new Error('Failed to fetch the employee list');
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      // --- FIX: Ensure every user has a role for consistent display ---
      const usersWithRoles = data.users.map(u => ({ ...u, role: u.role || 'Employee' }));
      setUsers(usersWithRoles || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching employee list:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        if (activeFilter === 'Employees') return user.role !== 'Manager';
        if (activeFilter === 'Team Leaders') return user.role === 'Manager';
        return true; // 'All'
      })
      .filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [users, searchQuery, activeFilter]);

  const handleGenerateReport = async (employeeName) => {
    if (!employeeName) {
      console.error("Employee name is required.");
      return;
    }
    setGeneratingReportFor(employeeName);
    const formData = new FormData();
    formData.append('employee_name', employeeName);
    try {
      const response = await fetch('http://localhost:5000/search', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Report generation failed.');
      }
      const data = await response.json();
      localStorage.setItem('result_data', JSON.stringify(data));
      navigate('/generate-report', { state: { result_data: data } });
    } catch (err) {
      console.error("Error generating report:", err);
    } finally {
      setGeneratingReportFor(null);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50/50">
        <ArrowPathIcon className="h-8 w-8 text-gray-500 animate-spin" />
        <span className="ml-4 text-gray-600">Loading All Personnel...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50/50">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-semibold text-gray-800">Failed to Load Data</h2>
        <p className="mt-1 text-gray-500">{error}</p>
        <Link to="/dashboard" className="mt-6 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <Link to="/dashboard" className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 mb-4">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">All Personnel</h1>
              <p className="mt-2 text-lg text-gray-600">
                Manage and view the evaluation status for everyone in the organization.
              </p>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-300"
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>

        {/* --- MODIFIED: Search and Filter UI --- */}
        <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200/80">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="relative w-full md:max-w-xs">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full rounded-md border-gray-300 pl-10 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                </div>
                <div className="flex items-center justify-center md:justify-end">
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                        {['All', 'Employees', 'Team Leaders'].map((filter) => (
                            <button
                                key={filter}
                                type="button"
                                onClick={() => setActiveFilter(filter)}
                                className={`px-4 py-2 text-sm font-medium border ${activeFilter === filter ? 'bg-indigo-600 text-white border-indigo-600 z-10' : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-100'} ${filter === 'All' ? 'rounded-l-lg' : ''} ${filter === 'Team Leaders' ? 'rounded-r-md' : ''}`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>


        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center">
              <UsersIcon className="h-6 w-6 mr-3 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-800">Personnel List</h2>
            </div>
          </div>
          <ul role="list" className="divide-y divide-gray-200">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <li key={index} className="flex items-center justify-between p-5 hover:bg-indigo-50/50 transition-colors duration-200">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${user.role === 'Manager' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                      {user.role === 'Manager' ? <AcademicCapIcon className="h-6 w-6" /> : <BriefcaseIcon className="h-6 w-6" />}
                    </div>
                    <div className="ml-4">
                      <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">
                        {user.role !== 'Manager' && `Reporting to: ${user.reporting_manager}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${user.role === 'Manager' ? 'bg-purple-200 text-purple-800' : 'bg-blue-200 text-blue-800'}`}>
                      {user.role === 'Manager' ? 'Manager' : 'Employee'}
                    </span>
                    {user.role !== 'Manager' && (
                      <>
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                            user.status === 'Completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {user.status}
                        </span>
                        <button
                          onClick={() => handleGenerateReport(user.name)}
                          disabled={generatingReportFor === user.name}
                          className="inline-flex items-center justify-center p-2.5 border border-transparent rounded-full text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-wait transition-colors"
                          title="Generate Report"
                        >
                          <span className="sr-only">Generate Report for {user.name}</span>
                          {generatingReportFor === user.name ? (
                            <ArrowPathIcon className="h-5 w-5 animate-spin" />
                          ) : (
                            <DocumentChartBarIcon className="h-5 w-5" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))
            ) : (
              <li className="p-8 text-center text-gray-500">
                No personnel data found for the current filter.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default EmployeeList;
