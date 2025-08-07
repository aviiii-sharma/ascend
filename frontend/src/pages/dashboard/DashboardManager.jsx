// src/pages/DashboardManager.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PencilSquareIcon,
  UsersIcon,
  XCircleIcon,      // <-- IMPORTED ICON
  CheckCircleIcon,  // <-- IMPORTED ICON
  BriefcaseIcon,
  DocumentChartBarIcon,
  ArrowPathIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useRole } from '../../components/RoleContext';

// --- START: TOAST COMPONENT ADDED ---
const Toast = ({ message, type, onclose }) => {
  useEffect(() => {
    const timer = setTimeout(onclose, 5000);
    return () => clearTimeout(timer);
  }, [onclose]);

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-50' : 'bg-red-50';
  const textColor = isSuccess ? 'text-green-800' : 'text-red-800';
  const iconColor = isSuccess ? 'text-green-400' : 'text-red-400';
  const Icon = isSuccess ? CheckCircleIcon : XCircleIcon;

  return (
    <div className={`fixed top-5 right-5 z-50 rounded-md p-4 shadow-lg ${bgColor}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
        </div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${textColor}`}>{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={onclose}
              className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${bgColor} ${isSuccess ? 'text-green-500 hover:bg-green-100 focus:ring-offset-green-50 focus:ring-green-600' : 'text-red-500 hover:bg-red-100 focus:ring-offset-red-50 focus:ring-red-600'}`}
            >
              <span className="sr-only">Dismiss</span>
              <XCircleIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// --- END: TOAST COMPONENT ADDED ---

function DashboardManager() {
  const navigate = useNavigate();
  const { user } = useRole();

  const [team, setTeam] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingReportFor, setGeneratingReportFor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  // --- START: STATE AND HELPER FOR TOAST ---
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
  };
  // --- END: STATE AND HELPER FOR TOAST ---

  const [stats, setStats] = useState([
    { name: 'Evaluations Completed', stat: 0, icon: ClipboardDocumentCheckIcon },
    { name: 'Pending Reviews', stat: 0, icon: ClockIcon },
  ]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const response = await fetch('http://localhost:5000/api/manager/team', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch team data.');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setTeam(data.team || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching team data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (team && team.length > 0) {
      const completedCount = team.filter(e => e.status === 'Completed').length;
      const pendingCount = team.length - completedCount;
      setStats([
        { name: 'Evaluations Completed', stat: completedCount, icon: ClipboardDocumentCheckIcon },
        { name: 'Pending Reviews', stat: pendingCount, icon: ClockIcon },
      ]);
    } else {
      setStats([
        { name: 'Evaluations Completed', stat: 0, icon: ClipboardDocumentCheckIcon },
        { name: 'Pending Reviews', stat: 0, icon: ClockIcon },
      ]);
    }
  }, [team]);

  const filteredTeam = useMemo(() => {
    if (!searchQuery) {
      return team;
    }
    return team.filter(employee =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [team, searchQuery]);

  // --- START: MODIFIED FUNCTION ---
  const handleGenerateReport = async (employeeName, employeeStatus) => {
    if (employeeStatus === 'In Progress') {
      showToast("Details Incomplete: Cannot generate a report while the evaluation is still in progress.", "error");
      return;
    }

    if (!employeeName) {
      console.error("Employee name is required to generate a report.");
      return;
    }
    setGeneratingReportFor(employeeName);
    const formData = new FormData();
    formData.append('employee_name', employeeName);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Authentication token not found.");
      }
      
      const response = await fetch('http://localhost:5000/api/generate-report', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Report generation failed.');
      }

      const reportData = await response.json();
      localStorage.setItem('result_data', JSON.stringify(reportData));
      navigate('/generate-report', { state: { result_data: reportData } });

    } catch (err) {
      showToast(err.message, "error");
      console.error("Error generating report:", err);
    } finally {
      setGeneratingReportFor(null);
    }
  };
  // --- END: MODIFIED FUNCTION ---


  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTeamList = () => {
    if (isLoading) {
      return (
        <div className="text-center text-gray-500 py-10">
          <ArrowPathIcon className="h-6 w-6 mx-auto animate-spin text-indigo-600" />
          <p className="mt-2">Loading Team Members...</p>
        </div>
      );
    }
    if (error) {
        return (
            <div className="text-center py-10 px-6">
              <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to Load Team</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
            </div>
        );
    }
    if (filteredTeam.length === 0) {
      return (
        <div className="text-center text-gray-500 py-10 px-6">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchQuery ? 'No Employees Found' : 'No Team Members Found'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? `Your search for "${searchQuery}" did not match any team members.` : 'No employees are currently assigned to you.'}
          </p>
        </div>
      );
    }
    return (
      <ul role="list" className="divide-y divide-gray-200">
        {filteredTeam.map((employee) => (
          <li key={employee.employee_id} className="flex items-center justify-between gap-x-6 p-5 hover:bg-gray-50/80 transition-colors duration-150">
            <div className="flex items-center min-w-0">
                <div className="flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                    <BriefcaseIcon className="h-6 w-6" />
                </div>
                <div className="ml-4 min-w-0">
                    <p className="text-md font-semibold text-gray-900 truncate">{employee.name}</p>
                    <p className="text-sm text-gray-500 truncate">{employee.designation || 'No designation'}</p>
                </div>
            </div>
            <div className="flex items-center gap-x-4">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(employee.status)}`}>{employee.status}</span>
                <button onClick={() => handleGenerateReport(employee.name, employee.status)} disabled={generatingReportFor === employee.name} className="p-2.5 border border-transparent rounded-full text-indigo-600 bg-indigo-100 hover:bg-indigo-200 disabled:bg-gray-200 disabled:cursor-wait" title="Generate Report">
                    <span className="sr-only">Generate Report</span>
                    {generatingReportFor === employee.name ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <DocumentChartBarIcon className="h-5 w-5" />}
                </button>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    // --- START: WRAPPER AND TOAST RENDER ---
    <>
      {toast.show && <Toast message={toast.message} type={toast.type} onclose={() => setToast({ ...toast, show: false })} />}
      <div className="bg-gray-50/50 min-h-screen p-4 md:p-8">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
              <p className="mt-1 text-md text-gray-600">Welcome, {user?.name || 'Manager'}! Here's your team's overview.</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button onClick={() => navigate('/manual-complete')} className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                <PencilSquareIcon className="-ml-0.5 h-5 w-5" />
                Manual Entry
              </button>
            </div>
        </header>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((item) => (
            <div key={item.name} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500 truncate">{item.name}</p>
                <item.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="mt-1"><p className="text-3xl font-semibold text-gray-900">{item.stat}</p></div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden">
            <div className="border-b border-gray-200 bg-white px-6 py-5">
              <h3 className="text-xl font-semibold leading-6 text-gray-900 flex items-center"><UsersIcon className="h-6 w-6 text-indigo-600 mr-3" />My Team</h3>
              <p className="mt-1 text-sm text-gray-500">A list of all employees who report to you.</p>
              <div className="mt-4 relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                      type="search"
                      name="search-team"
                      id="search-team"
                      className="block w-full rounded-md border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      placeholder="Search your team by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
            </div>
            {renderTeamList()}
          </div>
        </div>
      </div>
    </>
    // --- END: WRAPPER AND TOAST RENDER ---
  );
}

export default DashboardManager;