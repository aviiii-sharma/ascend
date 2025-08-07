import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  PencilIcon,
  Bars3Icon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { useRole } from '../components/RoleContext';

// --- Toast Component (No changes) ---
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
        <div className="flex-shrink-0"><Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" /></div>
        <div className="ml-3"><p className={`text-sm font-medium ${textColor}`}>{message}</p></div>
        <div className="ml-auto pl-3"><div className="-mx-1.5 -my-1.5">
          <button type="button" onClick={onclose} className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${bgColor} ${isSuccess ? 'text-green-500 hover:bg-green-100' : 'text-red-500 hover:bg-red-100'}`}>
            <XCircleIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div></div>
      </div>
    </div>
  );
};

// --- START: REUSABLE INPUT COMPONENT ---
const Input = ({ name, label, type = 'text', icon: Icon, value, onChange, children, required, disabled }) => {
    const commonClasses = "block w-full rounded-md border-gray-300 py-3 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100";
    
    const renderInput = () => {
        switch(type) {
            case 'select':
                return (
                    <select name={name} value={value} onChange={onChange} className={commonClasses} required={required} disabled={disabled}>
                        {children}
                    </select>
                );
            case 'textarea':
                return (
                    <textarea name={name} value={value} onChange={onChange} rows={4} className={`${commonClasses} pr-3`} required={required} />
                );
            default:
                return (
                    <input type={type} name={name} value={value} onChange={onChange} className={commonClasses} required={required} />
                );
        }
    };

    return (
        <div className={type === 'textarea' ? 'sm:col-span-2' : ''}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="relative mt-1 rounded-md shadow-sm">
                {Icon && (
                    <div className={`pointer-events-none absolute left-0 flex items-center pl-3 ${type === 'textarea' ? 'top-3.5' : 'inset-y-0'}`}>
                        <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                )}
                {renderInput()}
            </div>
        </div>
    );
};
// --- END: REUSABLE INPUT COMPONENT ---


const TaskHistory = ({ tasks, isLoading }) => {
    if (isLoading) {
        return <div className="text-center p-4"><ArrowPathIcon className="h-5 w-5 animate-spin mx-auto text-gray-400" /></div>;
    }
    if (tasks.length === 0) {
        return <p className="text-center text-sm text-gray-500 p-4">No tasks have been assigned to this employee yet.</p>;
    }
    const getStatusPill = (status) => {
        const isCompleted = status === 'Completed';
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {status}
            </span>
        );
    };
    return (
        <div className="border-t border-gray-200">
            <h3 className="text-lg leading-6 font-semibold text-gray-900 flex items-center p-6 border-b border-gray-200">
                <ClipboardDocumentListIcon className="h-6 w-6 text-gray-500 mr-3"/>
                Assigned Task History
            </h3>
            <ul className="divide-y divide-gray-200">
                {tasks.map(task => (
                    <li key={task._id} className="p-4 px-6">
                        <div className="flex justify-between items-center">
                            <p className="font-medium text-gray-900">{task.task_title}</p>
                            {getStatusPill(task.status)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{task.task_description}</p>
                        <p className="text-xs text-gray-500 mt-2">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};


function AssignTask() {
  const navigate = useNavigate();
  const { token } = useRole();
  const [team, setTeam] = useState([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const [selectedTarget, setSelectedTarget] = useState('all');
  const [taskDetails, setTaskDetails] = useState({
      taskTitle: '',
      taskDescription: '',
      dueDate: '',
      priority: 'Medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
  const [employeeTasks, setEmployeeTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  const showToast = useCallback((message, type = 'error') => {
    setToast({ show: true, message, type });
  }, []);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!token) return;
      setIsLoadingTeam(true);
      try {
        const response = await fetch('http://localhost:5000/api/manager/team', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch team members.');
        const data = await response.json();
        setTeam(data.team || []);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setIsLoadingTeam(false);
      }
    };
    fetchTeam();
  }, [token, showToast]);

  useEffect(() => {
    const fetchEmployeeTasks = async () => {
        if (selectedTarget === 'all' || !token) {
            setEmployeeTasks([]);
            return;
        }
        setIsLoadingTasks(true);
        try {
            const response = await fetch(`http://localhost:5000/api/manager/employee-tasks/${selectedTarget}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Failed to fetch employee's tasks.");
            const data = await response.json();
            setEmployeeTasks(data.tasks || []);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setIsLoadingTasks(false);
        }
    };
    fetchEmployeeTasks();
  }, [selectedTarget, token, showToast]);

  const handleInputChange = (e) => {
      const { name, value } = e.target;
      setTaskDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const isBroadcast = selectedTarget === 'all';
    const taskData = {
      task_title: taskDetails.taskTitle,
      task_description: taskDetails.taskDescription,
      due_date: taskDetails.dueDate,
      priority: taskDetails.priority,
      assigned_to_id: isBroadcast ? null : selectedTarget,
      is_broadcast: isBroadcast,
    };

    try {
      if (!token) throw new Error('Authentication token not found.');
      const response = await fetch('http://localhost:5000/api/manager/assign-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to assign task.');
      }
      showToast('Task assigned successfully!', 'success');
      setTimeout(() => navigate('/dashboard-manager'), 2000);
    } catch (err) {
      showToast(err.message, 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {toast.show && <Toast message={toast.message} type={toast.type} onclose={() => setToast({ ...toast, show: false })} />}
      <div className="bg-gray-50/50 min-h-screen p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <button onClick={() => navigate('/dashboard-manager')} className="flex items-center text-sm font-semibold text-gray-600 hover:text-indigo-600 mb-4">
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
            <div className="flex items-center">
                <UserGroupIcon className="h-8 w-8 text-indigo-600 mr-3"/>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Assign a New Task</h1>
                    <p className="mt-1 text-md text-gray-600">Fill in the details below to assign a new task.</p>
                </div>
            </div>
          </header>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden">
            <form onSubmit={handleSubmit}>
              <div className="p-6 md:p-8">
                <div className="border border-gray-200 rounded-lg p-6">
                    <div className="border-b border-gray-200 pb-4 mb-6">
                        <h3 className="text-lg leading-6 font-semibold text-gray-900 flex items-center">
                            <PencilIcon className="h-6 w-6 text-gray-500 mr-3"/>
                            Task Details
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Input name="assignTo" label="Assign To" type="select" icon={UserGroupIcon} value={selectedTarget} onChange={(e) => setSelectedTarget(e.target.value)} disabled={isLoadingTeam}>
                                <option value="all">All Team Members</option>
                                {isLoadingTeam ? (<option disabled>Loading team...</option>) : (
                                    team.map(employee => (<option key={employee.employee_id} value={employee.employee_id}>{employee.name}</option>))
                                )}
                            </Input>
                        </div>
                        <Input name="taskTitle" label="Task Title" icon={PencilIcon} value={taskDetails.taskTitle} onChange={handleInputChange} required />
                        <Input name="priority" label="Priority" type="select" icon={TagIcon} value={taskDetails.priority} onChange={handleInputChange}>
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                        </Input>
                        <Input name="taskDescription" label="Task Description" type="textarea" icon={Bars3Icon} value={taskDetails.taskDescription} onChange={handleInputChange} required />
                        <Input name="dueDate" label="Due Date" type="date" icon={CalendarDaysIcon} value={taskDetails.dueDate} onChange={handleInputChange} required />
                    </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex items-center justify-end">
                <button type="submit" disabled={isSubmitting || isLoadingTeam} className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-indigo-300">
                  {isSubmitting ? (<><ArrowPathIcon className="h-5 w-5 animate-spin" />Assigning...</>) : (<><PaperAirplaneIcon className="h-5 w-5" />Assign Task</>)}
                </button>
              </div>
            </form>
            {selectedTarget !== 'all' && <TaskHistory tasks={employeeTasks} isLoading={isLoadingTasks} />}
          </div>
        </div>
      </div>
    </>
  );
}

export default AssignTask;
