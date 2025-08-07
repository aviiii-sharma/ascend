import React, { useState, useEffect, Fragment, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Combobox, Transition } from '@headlessui/react';
import {
  UserPlusIcon,
  PencilSquareIcon,
  XCircleIcon,
  CheckCircleIcon,
  UserCircleIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ChevronUpDownIcon,
  CheckIcon,
  HashtagIcon,
  UserIcon,
  IdentificationIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  ClockIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  RectangleStackIcon,
  ArrowUpOnSquareIcon,
  TrophyIcon,
  ChatBubbleBottomCenterTextIcon,
  WrenchScrewdriverIcon,
  InformationCircleIcon,
  PaperClipIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

// Toast component
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

// Input component
const Input = React.memo(({ name, config, register, errors, isNewEmployee, roleValue, trigger }) => {
  // START: ===== MODIFIED FOR ROLE-SPECIFIC FIELD VISIBILITY (CREATE & EDIT) =====
  // This logic now controls field visibility for Managers in BOTH new entry and edit modes.
  if (roleValue === 'Manager') {
      const visibleForManager = [
          'employee_id',
          'name',
          'role',
          'department',
          'date_of_joining'
      ];
      // For a new manager, email and password are also required and visible.
      if (isNewEmployee) {
          visibleForManager.push('email', 'password');
      }
      // If the current field is not in the allowed list for a manager, hide it.
      if (!visibleForManager.includes(name)) {
          return null;
      }
  }
  // END: ===== MODIFIED FOR ROLE-SPECIFIC FIELD VISIBILITY (CREATE & EDIT) =====

  // This check remains to hide email/password fields for any user type during an edit operation.
  if (!isNewEmployee && (name === 'email' || name === 'password')) {
      return null;
  }

  const commonClasses = "block w-full rounded-md border-gray-300 py-3 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100";
  const errorClasses = errors[name] ? "border-red-500" : "";
  const IconComponent = config.icon;

  const renderInput = () => {
    switch (config.type) {
      case 'textarea':
        return <textarea {...register(name, { required: config.required })} rows={4} className={`${commonClasses} ${errorClasses}`} />;
      case 'select':
        return (
          <select {...register(name, { required: config.required })} className={`${commonClasses} ${errorClasses}`} disabled={(!isNewEmployee && name === 'role') || config.disabled}>
            <option value="">Select...</option>
            {config.options && config.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case 'rating':
        return (
          <select {...register(name, { required: config.required })} className={`${commonClasses} ${errorClasses}`}>
            <option value="">Select a rating...</option>
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{`${n} - ${['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][n-1]}`}</option>)}
          </select>
        );
      case 'checkbox':
           return (
               <label key={name} className="flex items-center space-x-3 sm:col-span-2">
                   <input type="checkbox" {...register(name)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                   <span className="text-sm font-medium text-gray-700">{config.label}</span>
               </label>
           );
      default:
        if (name === 'employee_id' && isNewEmployee) {
          const prefix = roleValue === 'Manager' ? 'TL' : 'EMP';
          const { onChange, onBlur, ...rest } = register(name, {
            required: config.required,
            pattern: {
              value: new RegExp(`^${prefix}\\d{4}$`),
              message: `ID must be '${prefix}' followed by exactly 4 digits.`,
            },
          });

          const handleIdChange = (e) => {
            let value = e.target.value;
            if (!value.startsWith(prefix)) {
                value = prefix;
            } else {
                let numericPart = value.substring(prefix.length).replace(/[^0-9]/g, '');
                if (numericPart.length > 4) {
                    numericPart = numericPart.substring(0, 4);
                }
                value = prefix + numericPart;
            }
            e.target.value = value;
            onChange(e);
          };

          const handleBlur = (e) => {
              onBlur(e);
              trigger(name);
          }

          return (
            <input
              type="text"
              {...rest}
              onChange={handleIdChange}
              onBlur={handleBlur}
              placeholder={`${prefix}1234`}
              className={`${commonClasses} ${errorClasses}`}
            />
          );
        }

        return (
          <input
            type={config.type || 'text'}
            {...register(name, {
              required: config.required,
              valueAsNumber: config.type === 'number',
            })}
            className={`${commonClasses} ${errorClasses}`}
            disabled={!isNewEmployee && name === 'employee_id'}
          />
        );
    }
  };

  if (config.type === 'checkbox') return <div className="sm:col-span-1">{renderInput()}</div>;

  return (
    <div className={config.type === 'textarea' ? 'sm:col-span-2' : ''}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">{config.label}</label>
      <div className="relative mt-1 rounded-md shadow-sm">
          {IconComponent && (
              <div className={`pointer-events-none absolute left-0 flex items-center pl-3 ${config.type === 'textarea' ? 'top-3.5' : 'inset-y-0'}`}>
                  <IconComponent className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
          )}
        {renderInput()}
      </div>
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name].message}</p>}
    </div>
  );
});

// Moved constants outside the component to prevent re-creation on each render
const departments = ['Engineering', 'Product', 'Marketing', 'Sales', 'HR', 'Operations', 'Design', 'Finance'];
const designationsByDepartment = {
  'Engineering': ['Software Developer', 'QA Tester', 'DevOps Engineer', 'Data Analyst', 'AI/ML Engineer'],
  'Product': ['Product Manager'],
  'Marketing': ['Marketing Specialist'],
  'Sales': ['Sales Executive'],
  'HR': ['HR Executive'],
  'Operations': ['Operations Manager'],
  'Design': ['UI/UX Designer'],
  'Finance': ['Financial Analyst', 'Accountant']
};

const ManualEntryHR = () => {
  const [isNewEmployee, setIsNewEmployee] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListLoading, setIsListLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting },
    trigger
  } = useForm({
    defaultValues: {
        employment_type: 'Full-Time',
        role: 'Employee',
        department: '',
        designation: ''
    }
  });

  const roleValue = watch('role');
  const employeeIdValue = watch('employee_id');
  const departmentValue = watch('department');

  // This useEffect now uses the official `watch` subscription method
  // to handle the dependency between the department and designation fields.
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      // If the role is changed to Manager, clear the designation field.
      if (name === 'role' && value.role === 'Manager') {
        setValue('designation', '');
      }
      // If the department changes, reset the designation field.
      if (name === 'department') {
        setValue('designation', '', { shouldValidate: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);


  // Effect to manage Employee ID prefix
  useEffect(() => {
    if (isNewEmployee) {
      const prefix = roleValue === 'Manager' ? 'TL' : 'EMP';
      const currentId = watch('employee_id') || '';
      if (!currentId.startsWith(prefix)) {
        setValue('employee_id', prefix, { shouldValidate: false });
      }
    }
  }, [roleValue, isNewEmployee, setValue, watch]);

  // Fetches the list of employees for the search dropdown
  const fetchEmployees = useCallback(async () => {
    setIsListLoading(true);
    try {
      const response = await fetch('http://localhost:5000/manual-entry/employees');
      const data = await response.json();
      if (response.ok && data.employees) {
        setAllEmployees(data.employees);
      } else {
        showToast(data.error || "Could not load employee list.", "error");
      }
    } catch (err) {
      showToast("Server error while fetching employees.", "error");
    } finally {
      setIsListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const availableDesignations = departmentValue ? designationsByDepartment[departmentValue] || [] : [];

  const fieldConfig = {
    employee_id: { label: "Employee ID", type: 'text', required: "Employee ID is required", icon: HashtagIcon },
    name: { label: "Name", type: 'text', required: "Name is required", icon: UserIcon },
    role: { label: "Role", type: 'select', options: ["Employee", "Manager"], icon: UserGroupIcon, required: "Role is required" },
    email: { label: "Email", type: 'email', required: "Email is required", icon: EnvelopeIcon },
    password: { label: "Password", type: 'password', required: "Password is required", icon: LockClosedIcon },
    department: { label: "Department", type: 'select', options: departments, required: "Department is required", icon: BuildingOffice2Icon },
    designation: { label: "Designation", type: 'select', options: availableDesignations, required: "Designation is required", icon: IdentificationIcon, disabled: !departmentValue },
    reporting_manager: { label: "Reporting Manager", type: 'text', icon: UserGroupIcon },
    employment_type: { label: "Employment Type", type: 'select', options: ["Full-Time", "Intern", "Contractor"], icon: ClockIcon },
    work_location: { label: "Work Location", type: 'text', icon: MapPinIcon },
    date_of_joining: { label: "Date of Joining", type: 'date', required: "Date of joining is required", icon: CalendarDaysIcon},
    total_experience: { label: "Total Experience (Years)", type: 'number', icon: ArrowTrendingUpIcon },
    past_roles_held: { label: "Past Roles Held", type: 'text', icon: RectangleStackIcon },
    internal_transfers: { label: "Internal Transfers", type: 'number', icon: ArrowUpOnSquareIcon },
    promotions_achieved: { label: "Promotions Achieved", type: 'number', icon: TrophyIcon },
    certifications_completed: { label: "Certifications Completed", type: 'number', icon: AcademicCapIcon },
    online_courses_attended: { label: "Online Courses Attended", type: 'number', icon: WrenchScrewdriverIcon },
    training_hours_logged: { label: "Training Hours Logged", type: 'number', icon: ClockIcon },
    recognition_received: { label: "Recognition Received", type: 'number', icon: SparklesIcon },
    special_recognitions: { label: "Special Recognitions", type: 'text', icon: TrophyIcon },
    onboarding_satisfaction: { label: "Onboarding Satisfaction", type: 'rating', icon: CheckCircleIcon },
    policy_compliance_x_y: { label: "Policy Compliance", type: 'rating', icon: ShieldCheckIcon },
    ethics_confidentiality: { label: "Ethics & Confidentiality", type: 'rating', icon: ShieldCheckIcon },
    compliance_adherence: { label: "Compliance Adherence", type: 'rating', icon: ShieldCheckIcon },
    hr_warnings: { label: "HR Warnings", type: 'number', icon: InformationCircleIcon },
    hr_notes: { label: "HR Notes", type: 'textarea', icon: PaperClipIcon },
    hackathon_participation: { label: "Hackathon Participation", type: 'checkbox' },
    mentorship_participation: { label: "Mentorship Participation", type: 'checkbox' },
    innovation_submissions: { label: "Innovation Submissions", type: 'checkbox' },
    knowledge_contributions: { label: "Knowledge Contributions", type: 'checkbox' }
  };

  const formStructure = {
    'Basic Information': {
        icon: UserCircleIcon,
        fields: Object.keys(fieldConfig).filter(f => ['employee_id', 'name', 'role', 'email', 'password', 'department', 'designation', 'reporting_manager', 'employment_type', 'work_location', 'date_of_joining'].includes(f))
    },
    'Career History': {
        icon: BriefcaseIcon,
        fields: Object.keys(fieldConfig).filter(f => ['total_experience', 'past_roles_held', 'internal_transfers', 'promotions_achieved'].includes(f))
    },
    'Learning & Development': {
        icon: AcademicCapIcon,
        fields: Object.keys(fieldConfig).filter(f => ['certifications_completed', 'online_courses_attended', 'training_hours_logged', 'recognition_received', 'special_recognitions'].includes(f))
    },
    'Compliance & HR Records': {
        icon: ShieldCheckIcon,
        fields: Object.keys(fieldConfig).filter(f => ['onboarding_satisfaction', 'policy_compliance_x_y', 'ethics_confidentiality', 'compliance_adherence', 'hr_warnings', 'hr_notes'].includes(f))
    },
    'Engagement & Contributions': {
        icon: SparklesIcon,
        fields: Object.keys(fieldConfig).filter(f => ['hackathon_participation', 'mentorship_participation', 'innovation_submissions', 'knowledge_contributions'].includes(f))
    }
  };

  const handleLoadEmployee = async () => {
    if (!selectedEmployee) return showToast("Please select an employee to load.", "error");

    const token = localStorage.getItem('token');
    if (!token) {
        showToast("Authentication error. Please log in again.", "error");
        return;
    }

    try {
      const response = await fetch(`http://localhost:5000/manual-entry/hr/${selectedEmployee.employee_id}`, {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${token}`
          }
      });
      const result = await response.json();
      if (response.ok) {
        setIsNewEmployee(false);
        // Use reset to populate the entire form at once.
        reset(result);
        showToast("Employee record loaded successfully.");
      } else {
        showToast(result.error || "Employee not found.", "error");
        handleClear();
      }
    } catch (err) {
      showToast("A server error occurred. Please try again later.", "error");
    }
  };

  const handleClear = () => {
    reset();
    setIsNewEmployee(true);
    setSelectedEmployee(null);
    setSearchQuery('');
    setValue('role', 'Employee');
    setValue('department', '');
    setValue('designation', '');
  };

  const handleHRSubmit = async (data) => {
    const endpoint = isNewEmployee
      ? "http://localhost:5000/manual-entry/hr"
      : `http://localhost:5000/manual-entry/hr/${data.employee_id}`;
    const method = isNewEmployee ? "POST" : "PUT";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (response.ok) {
        showToast(result.message || `Record ${isNewEmployee ? "created" : "updated"} successfully!`);
        if (isNewEmployee) {
            fetchEmployees();
        }
        handleClear();
      } else {
        showToast(result.error || "An unknown error occurred.", "error");
      }
    } catch (err) {
      showToast("A server error occurred. Please try again later.", "error");
    }
  };

  const handleDelete = async () => {
    const employeeId = getValues('employee_id');
    if (!employeeId) {
        showToast("Cannot delete. No employee is loaded.", "error");
        return;
    }

    const isConfirmed = window.confirm(
        `Are you sure you want to permanently delete employee ${employeeId}? This action cannot be undone.`
    );

    if (!isConfirmed) {
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        showToast("Authentication error. Please log in again.", "error");
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/employees/${employeeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const result = await response.json();
        if (response.ok) {
            showToast(result.message, 'success');
            handleClear();
            fetchEmployees();
        } else {
            showToast(result.error || "An error occurred during deletion.", "error");
        }
    } catch (error) {
        showToast("A server error occurred. Please try again.", "error");
    }
  };

  let sectionsToRender;
  // If we are editing and the user is a manager, only show the Basic Information section.
  if (!isNewEmployee && roleValue === 'Manager') {
      sectionsToRender = ['Basic Information'];
  }
  // If we are creating a new user (of any role), only show Basic Information.
  else if (isNewEmployee) {
      sectionsToRender = ['Basic Information'];
  }
  // Otherwise (editing an employee), show all sections.
  else {
      sectionsToRender = Object.keys(formStructure);
  }


  const filteredEmployees =
    searchQuery === ''
      ? allEmployees
      : allEmployees.filter((employee) =>
          employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          employee.employee_id.toString().includes(searchQuery)
        );

  return (
    <>
      {toast.show && <Toast message={toast.message} type={toast.type} onclose={() => setToast({ ...toast, show: false })} />}
      <div className="bg-gray-50/50 p-4 sm:p-8">
        <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-2xl">
          <div className="border-b border-gray-200 p-6">
             <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center">
                    {isNewEmployee ? <UserPlusIcon className="h-8 w-8 text-indigo-600 mr-3"/> : <PencilSquareIcon className="h-8 w-8 text-indigo-600 mr-3"/>}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {isNewEmployee ? "New Entry" : "Edit Record"}
                        </h2>
                        <p className="text-sm text-gray-500">
                           {isNewEmployee ? "Enter details for a new employee or manager." : `Editing record for ID: ${employeeIdValue || '...'}`}
                        </p>
                    </div>
                </div>
                 <div className="flex items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto sm:max-w-md">
                    <button
                        type="button"
                        onClick={fetchEmployees}
                        disabled={isListLoading}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 disabled:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        title="Refresh Employee List"
                    >
                        <span className="sr-only">Refresh Employee List</span>
                        <ArrowPathIcon className={`h-5 w-5 ${isListLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <Combobox value={selectedEmployee} onChange={setSelectedEmployee} nullable>
                        <div className="relative w-full">
                            <Combobox.Input
                                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                onChange={(event) => setSearchQuery(event.target.value)}
                                displayValue={(employee) => employee ? `${employee.name} (${employee.employee_id})` : ''}
                                placeholder="Search by name or ID..."
                            />
                            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                            </Combobox.Button>
                            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    {isListLoading ? (
                                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                            Loading...
                                        </div>
                                    ) : filteredEmployees.length === 0 && searchQuery !== '' ? (
                                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                            Nothing found.
                                        </div>
                                    ) : (
                                    filteredEmployees.map((employee) => (
                                        <Combobox.Option key={employee.employee_id} value={employee} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-600 text-white' : 'text-gray-900'}`}>
                                            {({ selected, active }) => (
                                                <>
                                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{employee.name}</span>
                                                    <span className={`ml-2 text-xs ${active ? 'text-indigo-200' : 'text-gray-500'}`}>{employee.employee_id}</span>
                                                    {selected && <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-indigo-600'}`}><CheckIcon className="h-5 w-5" /></span>}
                                                </>
                                            )}
                                        </Combobox.Option>
                                    )))}
                                </Combobox.Options>
                            </Transition>
                        </div>
                    </Combobox>
                     <button onClick={handleLoadEmployee} disabled={!selectedEmployee} className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300">
                        Load
                    </button>
                </div>
             </div>
          </div>

          <form onSubmit={handleSubmit(handleHRSubmit)}>
            <div className="p-6 space-y-8">
              {sectionsToRender.map(sectionTitle => {
                const section = formStructure[sectionTitle];
                const SectionIcon = section.icon;
                return (
                    <div key={sectionTitle} className="border border-gray-200 rounded-lg p-6">
                        <div className="border-b border-gray-200 pb-4 mb-6">
                            <h3 className="text-lg leading-6 font-semibold text-gray-900 flex items-center">
                                <SectionIcon className="h-6 w-6 text-gray-500 mr-3"/>
                                {sectionTitle}
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                          {section.fields.map(fieldName => (
                            <Input
                              key={fieldName}
                              name={fieldName}
                              config={fieldConfig[fieldName]}
                              register={register}
                              errors={errors}
                              isNewEmployee={isNewEmployee}
                              roleValue={roleValue}
                              trigger={trigger}
                            />
                          ))}
                        </div>
                    </div>
                );
              })}
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex items-center justify-end space-x-3">
                 {!isNewEmployee && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className="mr-auto inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-red-300"
                    >
                        Delete
                    </button>
                 )}
                 <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300"
                >
                  {isSubmitting ? 'Saving...' : (isNewEmployee ? 'Create Entry' : 'Save Changes')}
                </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ManualEntryHR;