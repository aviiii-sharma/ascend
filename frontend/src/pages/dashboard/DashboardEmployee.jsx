import React, { useState, useEffect, Fragment, useCallback } from 'react';
import {
  UserCircleIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronRightIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  FlagIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  TrophyIcon,
  ShieldExclamationIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  UserGroupIcon,
  HeartIcon,
  ArrowPathIcon,
  StarIcon,
  BookOpenIcon,
  PlusIcon,
  TrashIcon,
  ListBulletIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { useRole } from '../../components/RoleContext';

// --- ChatMessage Component (No changes) ---
const ChatMessage = ({ msg }) => {
    if (msg.sender === 'user') {
      return (
        <div className="flex justify-end">
          <div className="rounded-lg px-4 py-2 max-w-xs bg-indigo-600 text-white">
            {msg.text}
          </div>
        </div>
      );
    }
    const messageParts = msg.text.split(/(\*\*.*?\*\*)/g).filter(Boolean);
    return (
      <div className="flex flex-col items-start space-y-2">
        {messageParts.map((part, index) => {
          const isTitle = part.startsWith('**') && part.endsWith('**');
          if (isTitle) {
            return (
              <div key={index} className="rounded-lg px-4 py-2 max-w-xs bg-gray-200 text-gray-800 flex items-center">
                <StarIcon className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                <span className="font-semibold">{part.replaceAll('**', '')}</span>
              </div>
            );
          } else {
            return (
              <div key={index} className="rounded-lg px-4 py-2 max-w-xs bg-gray-200 text-gray-800">
                {part}
              </div>
            );
          }
        })}
      </div>
    );
};

// --- Main Employee Dashboard Component ---
function DashboardEmployee() {
  const { user, token } = useRole();
  const [employeeData, setEmployeeData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState([
    { id: 1, text: "Prepare for Q2 presentation" },
    { id: 2, text: "Follow up with John on project specs" },
  ]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user || !user.employee_id || !token) {
        setError("Could not find employee ID or authentication token.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [employeeResponse, tasksResponse] = await Promise.all([
        fetch(`http://localhost:5000/manual-entry/hr/${user.employee_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:5000/api/employee/tasks`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!employeeResponse.ok) {
        const errData = await employeeResponse.json();
        throw new Error(errData.error || 'Failed to fetch employee data.'); 
      }
      const data = await employeeResponse.json();
      
      if (!tasksResponse.ok) {
          console.error("Could not fetch tasks:", await tasksResponse.text());
          setTasks([]);
      } else {
          const tasksData = await tasksResponse.json();
          setTasks(tasksData.tasks || []);
      }

      const isHrComplete = data.total_experience != null;
      const isTlComplete = data.tenure_in_current_role != null;

      setEmployeeData({
        name: data.name,
        employee_id: data.employee_id,
        designation: data.designation,
        manager: data.reporting_manager,
        email: data.email,
        role: data.role,
        evaluation: {
            status: isTlComplete ? 'Completed' : 'In Progress',
            stage: isTlComplete ? 'Manager Review Complete' : 'Self-Assessment Pending'
        },
        self_assessment: {
            accomplishments: data.accomplishments || '',
            challenges: data.challenges || '',
            collaboration: data.collaboration || '',
            skills_developed: data.skills_developed || '',
            voluntary_contributions: data.voluntary_contributions || '',
            feedback: data.feedback || '',
        },
        todos: [
            { id: 1, text: isHrComplete ? 'HR has updated your record' : 'HR has to update your record', completed: isHrComplete },
            { id: 2, text: isTlComplete ? 'Your Team Lead has evaluated you' : 'Your Team Lead has to evaluate you', completed: isTlComplete },
        ],
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- START: THIS FUNCTION IS NOW PASSED TO THE TASKS CARD ---
  const handleTaskUpdate = (updatedTask) => {
    setTasks(currentTasks => 
      currentTasks.map(task => 
        task._id === updatedTask._id ? updatedTask : task
      )
    );
  };
  // --- END: THIS FUNCTION IS NOW PASSED TO THE TASKS CARD ---

  const handleFormSubmit = async (formData) => {
    try {
        const response = await fetch(`http://localhost:5000/manual-entry/tl/${user.employee_id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        if (!response.ok) throw new Error("Failed to submit assessment.");
        setIsFormOpen(false);
        fetchData(); 
    } catch (err) {
        setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50/50">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !employeeData) {
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-50/50 text-center">
            <XMarkIcon className="h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-xl font-semibold text-gray-800">Failed to Load Dashboard</h2>
            <p className="mt-2 text-gray-600">{error || "An unexpected error occurred."}</p>
        </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50/50 min-h-screen font-sans">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {employeeData.name}!</h1>
            <p className="mt-1 text-md text-gray-600">Here's your personal evaluation and performance dashboard.</p>
          </header>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <EvaluationStatusCard evaluation={employeeData.evaluation} />
              {/* --- FIX: PASSING onTaskUpdate and token PROPS --- */}
              <TasksCard tasks={tasks} onTaskUpdate={handleTaskUpdate} token={token} />
              <TodoList todos={employeeData.todos} />
            </div>
            <div className="space-y-8">
              <ProfileCard user={employeeData} />
              <NotesCenter notes={notes} setNotes={setNotes} />
            </div>
          </div>
        </div>
        <Chatbot isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} token={token} />
      </div>
      <SelfAssessmentForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={employeeData.self_assessment}
      />
    </>
  );
}

// --- TasksCard Component (No changes needed here, but shown for context) ---
const TasksCard = ({ tasks, onTaskUpdate, token }) => {
    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'High': return 'bg-red-100 text-red-800';
        case 'Medium': return 'bg-yellow-100 text-yellow-800';
        case 'Low': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const handleStatusChange = async (task, isChecked) => {
        const newStatus = isChecked ? 'Completed' : 'Pending';
        try {
            const response = await fetch(`http://localhost:5000/api/tasks/${task._id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error('Failed to update task status.');
            }
            // Notify parent component of the change
            onTaskUpdate({ ...task, status: newStatus });

        } catch (error) {
            console.error(error);
            // Optionally: show an error toast to the user
        }
    };
  
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <ListBulletIcon className="h-6 w-6 mr-3 text-indigo-600" />
            My Tasks
          </h2>
          <p className="text-sm text-gray-500 mt-1">Tasks assigned to you by your manager.</p>
        </div>
        <div className="divide-y divide-gray-200">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <div key={task._id} className={`p-4 px-6 transition-colors ${task.status === 'Completed' ? 'bg-green-50/50' : 'hover:bg-gray-50/80'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                      checked={task.status === 'Completed'}
                      onChange={(e) => handleStatusChange(task, e.target.checked)}
                    />
                    <div className="ml-3">
                      <p className={`font-semibold ${task.status === 'Completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{task.task_title}</p>
                      <p className={`text-sm mt-1 ${task.status === 'Completed' ? 'text-gray-400' : 'text-gray-600'}`}>{task.task_description}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2 flex items-center justify-between pl-8">
                    <span>Assigned by: <span className="font-medium">{task.assigned_by_name}</span></span>
                    <span className="flex items-center">
                        <CalendarDaysIcon className="h-4 w-4 mr-1.5"/>
                        Due: {new Date(task.due_date).toLocaleDateString()}
                    </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 text-center p-6">You have no pending tasks.</p>
          )}
        </div>
      </div>
    );
};

// --- Other components (SelfAssessmentForm, EvaluationStatusCard, etc.) remain unchanged ---
// ... (rest of the unchanged components)
const SelfAssessmentForm = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState({
        accomplishments: '',
        challenges: '',
        collaboration: '',
        skills_developed: '',
        voluntary_contributions: '',
        feedback: ''
    });
    
    useEffect(() => {
        if(initialData) {
            setFormData(initialData);
        }
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const FormSection = ({ icon: Icon, title, name, placeholder, value, onChange }) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 flex items-center mb-1">
                <Icon className="h-5 w-5 mr-2 text-gray-400" />
                {title}
            </label>
            <textarea id={name} name={name} rows={4} value={value || ''} onChange={onChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder={placeholder}></textarea>
        </div>
    );

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 flex items-center">
                                    <PencilSquareIcon className="h-6 w-6 mr-2 text-indigo-600" />
                                    Self-Assessment Form
                                </Dialog.Title>
                                <form onSubmit={handleSubmit} className="mt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormSection icon={TrophyIcon} title="Key Accomplishments & Task Ownership" name="accomplishments" placeholder="Describe your major achievements..." value={formData.accomplishments} onChange={handleChange} />
                                        <FormSection icon={ShieldExclamationIcon} title="Challenges & Areas for Improvement" name="challenges" placeholder="What challenges did you face?" value={formData.challenges} onChange={handleChange} />
                                        <FormSection icon={UserGroupIcon} title="Collaboration & Peer Interaction" name="collaboration" placeholder="Describe your collaboration with team members..." value={formData.collaboration} onChange={handleChange} />
                                        <FormSection icon={AcademicCapIcon} title="Skills & Professional Development" name="skills_developed" placeholder="List any new skills, certifications, or training..." value={formData.skills_developed} onChange={handleChange} />
                                        <FormSection icon={HeartIcon} title="Voluntary Contributions" name="voluntary_contributions" placeholder="Describe any contributions outside your core role..." value={formData.voluntary_contributions} onChange={handleChange} />
                                        <FormSection icon={ChatBubbleLeftRightIcon} title="Feedback for Manager/Company" name="feedback" placeholder="Provide any constructive feedback (optional)..." value={formData.feedback} onChange={handleChange} />
                                    </div>
                                    <div className="mt-8 flex justify-end space-x-3">
                                        <button type="button" className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50" onClick={onClose}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
                                            Submit Assessment
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

const EvaluationStatusCard = ({ evaluation, onStartAssessment }) => {
    const getStatusInfo = () => {
        switch (evaluation.status) {
            case 'Completed': return { icon: CheckCircleIcon, color: 'green', title: 'Evaluation Complete', description: 'Your evaluation for this cycle is finalized.' };
            case 'In Progress': return { icon: ClockIcon, color: 'blue', title: 'Evaluation In Progress', description: `Your performance evaluation is currently underway and pending completion by the assigned manager.` };
            default: return { icon: ClipboardDocumentListIcon, color: 'gray', title: 'Evaluation Not Started', description: 'Keep an eye out for the next evaluation cycle to begin.' };
        }
    };

    const statusInfo = getStatusInfo();
    const Icon = statusInfo.icon;

    return (
        <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80`}>
             <div className="flex items-start">
                <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-${statusInfo.color}-100`}>
                    <Icon className={`h-6 w-6 text-${statusInfo.color}-600`} aria-hidden="true" />
                </div>
                <div className="ml-4">
                    <h2 className="text-xl font-semibold text-gray-800">{statusInfo.title}</h2>
                    <p className="mt-1 text-sm text-gray-500">{statusInfo.description}</p>
                     
                </div>
            </div>
        </div>
    );
};

const ProfileCard = ({ user }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80">
    <div className="flex items-center">
        <UserCircleIcon className="h-16 w-16 text-gray-300" />
        <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.designation}</p>
        </div>
    </div>
    <div className="mt-4 border-t border-gray-200 pt-4">
        <dl className="text-sm space-y-1">
            <div className="flex justify-between py-1">
                <dt className="text-gray-500">Employee ID</dt>
                <dd className="font-medium text-gray-800">{user.employee_id}</dd>
            </div>
            <div className="flex justify-between py-1">
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-gray-800">{user.email}</dd>
            </div>
            <div className="flex justify-between py-1">
                <dt className="text-gray-500">Role</dt>
                <dd className="font-medium text-gray-800">{user.role}</dd>
            </div>
            <div className="flex justify-between py-1">
                <dt className="text-gray-500">Manager</dt>
                <dd className="font-medium text-gray-800">{user.manager}</dd>
            </div>
        </dl>
    </div>
  </div>
);

const TodoList = ({ todos, onStartAssessment }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80">
    <div className="p-6 border-b border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 flex items-center">
        <ClipboardDocumentListIcon className="h-6 w-6 mr-3 text-indigo-600" />
        Evaluation Status
      </h2>
      <p className="text-sm text-gray-500 mt-1">Status of your current evaluation cycle.</p>
    </div>
    <ul role="list" className="divide-y divide-gray-200">
      {todos.map(todo => (
        <li key={todo.id} className="flex items-center justify-between p-4 px-6 hover:bg-gray-50/80">
          <span className={`text-sm ${todo.completed ? 'text-gray-500' : 'text-gray-800'}`}>
            {todo.text}
          </span>
          {todo.completed ? (
            <CheckCircleIcon className="h-6 w-6 text-green-500" />
          ) : (
            <ClockIcon className="h-6 w-6 text-yellow-500" />
          )}
        </li>
      ))}
    </ul>
  </div>
);

const NotesCenter = ({ notes, setNotes }) => {
  const [newNote, setNewNote] = useState('');

  const handleAddNote = () => {
    if (newNote.trim() !== '') {
      const noteToAdd = { id: Date.now(), text: newNote };
      setNotes(prevNotes => [...prevNotes, noteToAdd]);
      setNewNote('');
    }
  };

  const handleDeleteNote = (id) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <BookOpenIcon className="h-6 w-6 mr-3 text-indigo-600" />
          Notes & To-Do
        </h2>
        <p className="text-sm text-gray-500 mt-1">Jot down personal reminders and tasks.</p>
      </div>
      <div className="p-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a new note..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
          />
          <button
            onClick={handleAddNote}
            className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 flex items-center justify-center shrink-0"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
        <ul role="list" className="divide-y divide-gray-200 mt-4 max-h-48 overflow-y-auto">
          {notes.length > 0 ? (
            notes.map(note => (
              <li key={note.id} className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-800 break-all">{note.text}</span>
                <button onClick={() => handleDeleteNote(note.id)} className="text-gray-400 hover:text-red-500 ml-2 shrink-0">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </li>
            ))
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No notes yet.</p>
          )}
        </ul>
      </div>
    </div>
  );
};


const Chatbot = ({ isChatOpen, setIsChatOpen, token }) => {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello! How can I help you with your evaluation today?', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  const handleSend = async () => {
    if (input.trim() === '' || isBotTyping) return;

    const userMsg = { id: Date.now(), text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsBotTyping(true);

    if (!token) {
      setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, text: 'Authentication error. Please log in again.', sender: 'bot' },
      ]);
      setIsBotTyping(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/chatbot-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ query: currentInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'The server returned an error.');
      }

      const data = await response.json();
      const botReply = data.response || 'Sorry, I couldn’t understand that.';
      const botMsg = { id: Date.now() + 1, text: botReply, sender: 'bot' };
      setMessages((prev) => [...prev, botMsg]);

    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: error.message || 'Something went wrong. Try again later.', sender: 'bot' },
      ]);
    } finally {
      setIsBotTyping(false);
    }
  };

  if (!isChatOpen) {
    return (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-110"
          aria-label="Open chatbot"
        >
          <ChatBubbleOvalLeftEllipsisIcon className="h-8 w-8" />
        </button>
      );
  }

  return (
    <div className="fixed bottom-8 right-8 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200/80">
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-2xl">
        <h3 className="font-semibold text-lg flex items-center gap-2">
            <SparklesIcon className="h-6 w-6 text-indigo-500"/>
            EvalMate Assistant
        </h3>
        <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        
        {messages.map(msg => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}
        
        {isBotTyping && (
          <div className="flex justify-start">
            <div className="rounded-lg px-4 py-2 max-w-xs bg-gray-200 text-gray-800">
                <div className="flex items-center justify-center space-x-1">
                    <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></span>
                </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-white rounded-b-2xl">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="w-full pr-12 pl-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isBotTyping}
          />
          <button onClick={handleSend} className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:bg-gray-400" disabled={isBotTyping}>
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardEmployee;
