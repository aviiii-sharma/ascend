// src/pages/DashboardHR.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UsersIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  ArrowPathIcon,
  UserCircleIcon,
  XCircleIcon,      // <-- IMPORTED ICON
  CheckCircleIcon,  // <-- IMPORTED ICON
} from '@heroicons/react/24/outline';

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


function DashboardHRManager() {
  const [stats, setStats] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [managerList, setManagerList] = useState([]);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [generatingReportFor, setGeneratingReportFor] = useState(null);
  const [loading, setLoading] = useState(true);
  // --- START: STATE AND HELPER FOR TOAST ---
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
  };
  // --- END: STATE AND HELPER FOR TOAST ---

  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/dashboard-data');
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setStats([
        { name: 'Total Personnel', stat: data.total_personnel || 0, icon: UserGroupIcon },
        { name: 'Total Employees', stat: data.employee_total || 0, icon: UsersIcon },
        { name: 'Total Managers', stat: data.manager_total || 0, icon: UserCircleIcon },
        { name: 'Evaluations Completed', stat: data.employee_completed || 0, icon: ClipboardDocumentCheckIcon },
        { name: 'Evaluations In Progress', stat: data.employee_in_progress || 0, icon: ClockIcon },
      ]);

      const total = data.employee_total || 0;
      const completed = data.employee_completed || 0;
      
      const percentCompleted = total > 0 ? Math.round((completed / total) * 100) : 0;
      setCompletionPercent(percentCompleted);

      setEmployeeList(data.employee_list?.slice(0, 4) || []);
      setManagerList(data.manager_list?.slice(0, 3) || []);

    } catch (error) {
      showToast(error.message || "Could not fetch dashboard data.", "error");
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      const data = await response.json();
      localStorage.setItem('result_data', JSON.stringify(data));
      navigate('/generate-report', { state: { result_data: data } });
    } catch (err) {
      showToast(err.message, "error");
      console.error("Error generating report:", err);
    } finally {
      setGeneratingReportFor(null);
    }
  };
  // --- END: MODIFIED FUNCTION ---

  const PersonnelList = ({ title, list, icon: Icon, viewAllText, viewAllLink }) => {
    const navigate = useNavigate();

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 flex flex-col">
        <div className="p-6">
          <div className="flex items-center">
              <Icon className="h-6 w-6 mr-3 text-indigo-600"/>
              <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">A snapshot of recent progress.</p>
        </div>
        <ul role="list" className="divide-y divide-gray-200 flex-grow">
          {list.length > 0 ? (
            list.map((person) => (
              <li key={person.name} className="flex items-center justify-between p-4 px-6 hover:bg-gray-50/80">
                <div>
                  <p className="text-md font-medium text-gray-900">{person.name}</p>
                  <p className="text-sm text-gray-500">
                    {person.role === 'Manager' ? 'Role: Manager' : `Reporting to: ${person.reporting_manager}`}
                  </p>
                </div>
                {person.role !== 'Manager' && (
                  <div className="flex items-center space-x-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold leading-none ${
                        person.status === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {person.status}
                    </span>
                    <button
                      onClick={() => handleGenerateReport(person.name, person.status)}
                      disabled={generatingReportFor === person.name}
                      className="inline-flex items-center justify-center p-2 border border-transparent rounded-full text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-wait transition-colors"
                      title="Generate Report"
                    >
                      <span className="sr-only">Generate Report for {person.name}</span>
                      {generatingReportFor === person.name ? (
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      ) : (
                        <DocumentChartBarIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                )}
              </li>
            ))
          ) : (
            <li className="p-4 px-6 text-center text-gray-500">No data found.</li>
          )}
        </ul>
        {viewAllLink && viewAllText && (
          <div className="p-4 px-6 border-t border-gray-200 text-center">
              <button
              onClick={() => navigate(viewAllLink)}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
              {viewAllText}
              </button>
          </div>
        )}
      </div>
    );
  };

  return (
    // --- START: WRAPPER AND TOAST RENDER ---
    <>
      {toast.show && <Toast message={toast.message} type={toast.type} onclose={() => setToast({ ...toast, show: false })} />}
      <div className="bg-gray-50/50 min-h-full p-4 md:p-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
              <div>
                  <h1 className="text-3xl font-bold text-gray-900">HR Manager Dashboard</h1>
                  <p className="mt-1 text-md text-gray-600">
                    Welcome back! Here's an overview of the current evaluation cycle.
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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((item) => (
            <div key={item.name} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500 truncate">{item.name}</p>
                <item.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="mt-1">
                <p className="text-3xl font-semibold text-gray-900">
                  {item.stat}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <PersonnelList
              title="Employee Evaluation Status"
              list={employeeList}
              icon={UsersIcon}
              viewAllText="View All Employees"
              viewAllLink="/employees"
            />
            <PersonnelList
              title="Team Leader Status"
              list={managerList}
              icon={UserGroupIcon}
              viewAllText="View All Team Leaders"
              viewAllLink="/employees"
            />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Cycle Status Overview</h2>
            <p className="text-sm text-gray-500 mb-6">Real-time status of the employee evaluation cycle.</p>
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9155" className="stroke-current text-gray-200" strokeWidth="3.8" fill="transparent" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    className="stroke-current text-green-500"
                    strokeWidth="3.8"
                    fill="transparent"
                    strokeDasharray={`${completionPercent}, ${100 - completionPercent}`}
                    strokeDashoffset="25"
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-800">{completionPercent}%</span>
                  <span className="text-sm text-gray-500">Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
    // --- END: WRAPPER AND TOAST RENDER ---
  );
}

export default DashboardHRManager;