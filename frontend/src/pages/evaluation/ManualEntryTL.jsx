import React, { useState, useEffect, Fragment } from "react";
import { useForm } from "react-hook-form";
import { Combobox, Transition } from '@headlessui/react';
import {
  BriefcaseIcon, LightBulbIcon, ChatBubbleLeftRightIcon, ChartBarIcon, StarIcon,
  UserCircleIcon, ChevronUpDownIcon, CheckIcon, XCircleIcon, CheckCircleIcon,
  HashtagIcon, UserIcon, IdentificationIcon, BuildingOffice2Icon, UserGroupIcon,
  ClockIcon, MapPinIcon, CalendarDaysIcon, PencilIcon, ChatBubbleBottomCenterTextIcon,
  ListBulletIcon, ArrowTrendingUpIcon, ClockIcon as ClockSolidIcon, CalendarIcon,
  DocumentTextIcon, ScaleIcon, LinkIcon, BeakerIcon, ArrowPathIcon, EyeIcon, StarIcon as StarSolidIcon, QuestionMarkCircleIcon, PaperClipIcon
} from "@heroicons/react/24/outline";
import { useRole } from "../../components/RoleContext";

// --- Toast Component ---
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
        <div className="ml-auto pl-3"><div className="-mx-1.5 -my-1.5"><button type="button" onClick={onclose} className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${bgColor} ${isSuccess ? 'text-green-500 hover:bg-green-100 focus:ring-offset-green-50 focus:ring-green-600' : 'text-red-500 hover:bg-red-100 focus:ring-offset-red-50 focus:ring-red-600'}`}><span className="sr-only">Dismiss</span><XCircleIcon className="h-5 w-5" aria-hidden="true" /></button></div></div>
      </div>
    </div>
  );
};

// --- Data & Config Constants ---
const roleBasedKPIs = { "Software Developer": ["code_commits", "bug_fix_count", "sprint_velocity", "deployment_frequency", "code_quality"], "QA Tester": ["test_cases_executed", "bugs_reported", "automation_coverage", "regression_pass_rate", "defect_leakage_rate"], "HR Executive": ["positions_filled", "onboarding_satisfaction", "training_sessions_delivered", "employee_engagement_score", "policy_compliance"], "Sales Executive": ["conversion_rate", "revenue_generated", "upsell_opportunities_closed", "client_retention_rate", "crm_followup_consistency"], "Marketing Specialist": ["campaign_reach", "leads_generated", "social_engagement_rate", "content_delivery_timeliness"], "Product Manager": ["feature_delivery_timeliness", "roadmap_adherence", "cross_team_coordination", "sprint_success_rate", "stakeholder_ratings"], "UI/UX Designer": ["design_delivery_timeliness", "usability_test_score", "rework_count", "visual_consistency", "accessibility_score"], "DevOps Engineer": ["uptime_percentage", "mttr", "successful_deployments", "cicd_pipeline_efficiency", "incident_response_time"], "Data Analyst": ["reports_delivered", "insight_accuracy", "query_efficiency", "dashboard_usage_rate", "data_quality_score"], "AI/ML Engineer": ["model_accuracy", "feature_engineering", "experiment_reproducibility", "model_deployment_count", "tech_debt_reduction"], "Financial Analyst": ["budget_forecasting_accuracy", "variance_analysis_score", "report_timeliness", "cost_saving_suggestions", "financial_modeling_score"], "Accountant": ["ledger_accuracy", "compliance_adherence", "invoice_processing_efficiency", "audit_readiness_score", "report_submission_punctuality"] };
const categories = { WorkAndParticipation: { icon: BriefcaseIcon, title: "Work & Participation", fields: ["active_workdays", "avg_hours_logged_vs_team", "meeting_participation_rate", "task_completion_ratio"] }, SoftSkills: { icon: LightBulbIcon, title: "Soft Skills", fields: ["adaptability_to_change", "conflict_resolution", "initiative_in_projects", "response_to_change"] }, FeedbackAndReview: { icon: ChatBubbleLeftRightIcon, title: "Feedback & Review", fields: ["peer_review_rating", "peer_reviews", "peer_complaints", "manager_feedback", "manager_comments", "client_communication", "client_feedback", "stakeholder_ratings"] }, PerformanceAndMetrics: { icon: ChartBarIcon, title: "Performance & Metrics", fields: ["projects_handled", "score_delta", "tenure_in_current_role", "total_experience_score", "past_ratings_history", "report_submission_punctuality", "report_timeliness", "roadmap_adherence", "communication_effectiveness", "responsiveness"] } };
const logicDerivedFields = [ "adaptability_growth_score", "adherence_to_deadlines", "burnout_risk", "sentiment_score", "collaboration_communication_score", "communication_effectiveness", "effort_engagement_score", "historical_progress_score", "integrity_feedback_score", "leadership_score", "meeting_participation", "overall_weighted_score", "promotion_recommendation", "responsiveness", "retention_suggestion", "skill_development_score", "stress_load_tolerance", "task_ownership", "voluntary_contributions", "work_quality_consistency" ];
const hrReadOnly = [ "employee_id", "name", "designation", "department", "employment_type", "work_location", "date_of_joining" ];
const fieldConfig = { employee_id: { label: "Employee ID", icon: HashtagIcon, type: 'text' }, name: { label: "Name", icon: UserIcon, type: 'text' }, designation: { label: "Designation", icon: IdentificationIcon, type: 'text' }, department: { label: "Department", icon: BuildingOffice2Icon, type: 'text' }, reporting_manager: { label: "Reporting Manager", icon: UserGroupIcon, type: 'text' }, employment_type: { label: "Employment Type", icon: ClockIcon, type: 'text' }, work_location: { label: "Work Location", icon: MapPinIcon, type: 'text' }, date_of_joining: { label: "Date of Joining", icon: CalendarDaysIcon, type: 'date' }, active_workdays: { label: "Active Workdays", icon: CalendarIcon, type: 'number' }, avg_hours_logged_vs_team: { label: "Avg Hours Logged vs Team", icon: ClockSolidIcon, type: 'number' }, meeting_participation_rate: { label: "Meeting Participation Rate", icon: UserGroupIcon, type: 'rating' }, task_completion_ratio: { label: "Task Completion Ratio", icon: CheckCircleIcon, type: 'number' }, adaptability_to_change: { label: "Adaptability To Change", icon: ArrowPathIcon, type: 'rating' }, conflict_resolution: { label: "Conflict Resolution", icon: ChatBubbleLeftRightIcon, type: 'rating' }, initiative_in_projects: { label: "Initiative In Projects", icon: LightBulbIcon, type: 'rating' }, response_to_change: { label: "Response To Change", icon: ArrowPathIcon, type: 'rating' }, peer_review_rating: { label: "Peer Review Rating", icon: StarIcon, type: 'rating' }, peer_reviews: { label: "Peer Reviews", icon: DocumentTextIcon, type: 'textarea' }, peer_complaints: { label: "Peer Complaints", icon: XCircleIcon, type: 'number' }, manager_feedback: { label: "Manager Feedback", icon: ChatBubbleBottomCenterTextIcon, type: 'rating' }, manager_comments: { label: "Manager Comments", icon: PencilIcon, type: 'textarea' }, client_communication: { label: "Client Communication", icon: UserGroupIcon, type: 'rating' }, client_feedback: { label: "Client Feedback", icon: PaperClipIcon, type: 'textarea' }, stakeholder_ratings: { label: "Stakeholder Ratings", icon: StarSolidIcon, type: 'rating' }, projects_handled: { label: "Projects Handled", icon: BriefcaseIcon, type: 'number' }, score_delta: { label: "Score Delta", icon: ArrowTrendingUpIcon, type: 'number' }, tenure_in_current_role: { label: "Tenure In Current Role", icon: ClockIcon, type: 'number' }, total_experience_score: { label: "Total Experience Score", icon: ArrowTrendingUpIcon, type: 'number' }, past_ratings_history: { label: "Past Ratings History", icon: ArrowPathIcon, type: 'number' }, report_submission_punctuality: { label: "Report Submission Punctuality", icon: ClockIcon, type: 'rating' }, report_timeliness: { label: "Report Timeliness", icon: CalendarDaysIcon, type: 'rating' }, roadmap_adherence: { label: "Roadmap Adherence", icon: MapPinIcon, type: 'rating' }, communication_effectiveness: { label: "Communication Effectiveness", icon: ChatBubbleLeftRightIcon, type: 'rating' }, responsiveness: { label: "Responsiveness", icon: ArrowPathIcon, type: 'rating' }, default: { label: "Field", icon: QuestionMarkCircleIcon, type: 'text' } };

const ManagerInput = ({ name, disabled = false, managerList, register }) => {
    const config = fieldConfig[name] || { ...fieldConfig.default, label: name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) };
    const IconComponent = config.icon;

    // --- START: Added conditional classes for styling the disabled state ---
    const conditionalClasses = disabled 
        ? 'appearance-none pr-3' // Removes dropdown arrow and padding
        : 'pr-10';               // Keeps original padding for the arrow
    // --- END: Added conditional classes ---

    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">{config.label}</label>
            <div className="relative mt-1 rounded-md shadow-sm">
                {IconComponent && (<div className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3`}><IconComponent className="h-5 w-5 text-gray-400" aria-hidden="true" /></div>)}
                <select
                    {...register(name)}
                    id={name}
                    disabled={disabled}
                    // --- MODIFIED: The className now uses the conditional classes ---
                    className={`block w-full rounded-md border-gray-300 py-3 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${conditionalClasses}`}
                >
                    <option value="">Select a Manager...</option>
                    {managerList.map(managerName => (
                        <option key={managerName} value={managerName}>{managerName}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};



const ManualEntryTL = () => {
    const { register, handleSubmit, setValue, reset, formState: { isSubmitting, errors } } = useForm();
    const { user } = useRole(); 

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [allEmployees, setAllEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [employeeData, setEmployeeData] = useState(null);
    const [managers, setManagers] = useState([]);

    const showToast = (message, type = 'success') => setToast({ show: true, message, type });

    useEffect(() => {
        const fetchAndFilterEmployees = async () => {
            if (!user) {
                return;
            }
            try {
                const response = await fetch('http://localhost:5000/manual-entry/employees');
                const data = await response.json();
                
                if (response.ok && data.employees) {
                    const myTeam = data.employees.filter(
                        employee => employee.reporting_manager?.trim().toLowerCase() === user.name?.trim().toLowerCase()
                    );
                    setAllEmployees(myTeam);
                } else {
                    showToast(data.error || "Could not load employee list.", "error");
                }
            } catch (err) {
                showToast("Server error while fetching employees.", "error");
            }
        };
        fetchAndFilterEmployees();
    }, [user]);

    useEffect(() => {
        const fetchManagers = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/managers');
                const data = await response.json();
                if (response.ok && data.managers) {
                    setManagers(data.managers);
                }
            } catch (err) {
                console.error("Failed to fetch managers:", err);
            }
        };
        fetchManagers();
    }, []);

    const handleSelectEmployee = async (employee) => {
        setSelectedEmployee(employee);
        if (!employee) {
            setEmployeeData(null);
            reset();
            return;
        }

        try {
            // --- START: FIX - Add Authentication Header ---
            const token = localStorage.getItem('token');
            if (!token) {
                showToast("Authentication token not found. Please log in again.", "error");
                return;
            }

            const response = await fetch(`http://localhost:5000/manual-entry/hr/${employee.employee_id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            // --- END: FIX ---

            const data = await response.json();
            if (!response.ok) {
                showToast(data.error || "Employee not found", "error");
                return;
            }
            
            if (data.date_of_joining) {
                try {
                    const date = new Date(data.date_of_joining);
                    if (!isNaN(date.getTime())) {
                        const year = date.getFullYear();
                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                        const day = date.getDate().toString().padStart(2, '0');
                        data.date_of_joining = `${year}-${month}-${day}`;
                    } else {
                         data.date_of_joining = ''; 
                    }
                } catch (e) {
                    console.error("Could not parse date:", data.date_of_joining);
                    data.date_of_joining = '';
                }
            }

            setEmployeeData(data);
            Object.entries(data).forEach(([key, value]) => setValue(key, value || ''));
            showToast("Employee data loaded.", "success");
        } catch (err) {
            showToast("Server error: " + err.message, "error");
        }
    };

    const handleClear = () => {
        reset();
        setEmployeeData(null);
        setSelectedEmployee(null);
        setSearchQuery('');
    }

    const onSubmit = async (formData) => {
        try {
            const response = await fetch(`http://localhost:5000/manual-entry/tl/${formData.employee_id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
            const result = await response.json();
            if (response.ok) {
                showToast("✅ TL Entry Saved Successfully!", "success");
                handleClear();
            } else {
                showToast("❌ Error: " + result.error, "error");
            }
        } catch (err) {
            showToast("❌ Network Error: " + err.message, "error");
        }
    };

    const Input = ({ name, disabled = false }) => {
        const config = fieldConfig[name] || { ...fieldConfig.default, label: name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) };
        const commonClasses = "block w-full rounded-md border-gray-300 py-3 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm";
        const disabledClasses = "disabled:bg-gray-100 disabled:cursor-not-allowed";
        const IconComponent = config.icon;
        const renderInput = () => {
            let type = config.type || 'text';
            if (!config.type) {
                if (name.toLowerCase().includes("score") || name.toLowerCase().includes("rating") || name.includes("adherence") || name.includes("satisfaction")) type = 'rating';
                else if (name.includes("comment") || name.includes("client_feedback") || name.includes("reviews")) type = 'textarea';
            }
            switch (type) {
                case 'textarea': return <textarea {...register(name)} rows={4} className={`${commonClasses} ${disabledClasses}`} disabled={disabled} />;
                case 'rating': return <select {...register(name)} className={`${commonClasses} ${disabledClasses}`} disabled={disabled}><option value="">Select rating...</option>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{`${n} - ${['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][n - 1]}`}</option>)}</select>;
                default: return <input type={type} {...register(name, { valueAsNumber: type === 'number' })} className={`${commonClasses} ${disabledClasses}`} disabled={disabled} />;
            }
        };
        return (
            <div className={config.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <label htmlFor={name} className="block text-sm font-medium text-gray-700">{config.label}</label>
                <div className="relative mt-1 rounded-md shadow-sm">
                    {IconComponent && (<div className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3`}><IconComponent className="h-5 w-5 text-gray-400" aria-hidden="true" /></div>)}
                    {renderInput()}
                </div>
                {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name].message}</p>}
            </div>
        );
    };

    const filteredEmployees = searchQuery === '' ? allEmployees : allEmployees.filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.employee_id.toString().includes(searchQuery));
    const kpis = employeeData?.designation ? roleBasedKPIs[employeeData.designation] || [] : [];
    
    return (
        <>
            {toast.show && <Toast message={toast.message} type={toast.type} onclose={() => setToast({ ...toast, show: false })} />}
            <div className="bg-gray-50/50 p-4 sm:p-8">
                <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-2xl">
                    <div className="border-b border-gray-200 p-6"><h2 className="text-2xl font-bold text-gray-900">Team Leader Manual Entry</h2><p className="text-sm text-gray-500 mt-1">Search for an employee on your team to fill in their evaluation data.</p></div>
                    <div className="p-6">
                        <Combobox value={selectedEmployee} onChange={handleSelectEmployee} nullable>
                            <div className="relative"><Combobox.Input className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm" onChange={(e) => setSearchQuery(e.target.value)} displayValue={(e) => e ? `${e.name} (ID: ${e.employee_id})` : ''} placeholder="Search by name or ID from your team..." /><Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none"><ChevronUpDownIcon className="h-5 w-5 text-gray-400" /></Combobox.Button>
                                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                    <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                        {filteredEmployees.length === 0 && searchQuery !== '' ? (
                                            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">Nothing found.</div>
                                        ) : filteredEmployees.length === 0 ? (
                                            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">No employees found reporting to you.</div>
                                        ) : (
                                            filteredEmployees.map((e) => (<Combobox.Option key={e.employee_id} value={e} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-600 text-white' : 'text-gray-900'}`}>{({ selected, active }) => (<><span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{e.name}</span><span className={`ml-2 text-xs ${active ? 'text-indigo-200' : 'text-gray-500'}`}>{e.employee_id}</span>{selected && <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-indigo-600'}`}><CheckIcon className="h-5 w-5" /></span>}</>)}</Combobox.Option>))
                                        )}
                                    </Combobox.Options>
                                </Transition>
                            </div>
                        </Combobox>
                    </div>
                    {employeeData && (
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="p-6 space-y-8">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h3 className="text-lg leading-6 font-semibold text-gray-900 flex items-center border-b border-gray-200 pb-4 mb-6"><UserCircleIcon className="h-6 w-6 text-gray-500 mr-3"/>Employee Information</h3>
                                    <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-3">
                                        {hrReadOnly.map(field => <Input key={field} name={field} disabled={true} />)}
                                            {/* Add disabled={true} to make the manager field non-editable */}
                                            <ManagerInput name="reporting_manager" managerList={managers} register={register} disabled={true} />
                                    </div>
                                </div>
                                {Object.values(categories).map(section => { const SectionIcon = section.icon; const fieldsToRender = section.fields.filter(f => !logicDerivedFields.includes(f) && !hrReadOnly.includes(f)); return (<div key={section.title} className="border border-gray-200 rounded-lg p-6"><h3 className="text-lg leading-6 font-semibold text-gray-900 flex items-center border-b border-gray-200 pb-4 mb-6"><SectionIcon className="h-6 w-6 text-gray-500 mr-3"/>{section.title}</h3><div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">{fieldsToRender.map(field => <Input key={field} name={field} />)}</div></div>); })}
                                {kpis.length > 0 && (<div className="border border-gray-200 rounded-lg p-6"><h3 className="text-lg leading-6 font-semibold text-gray-900 flex items-center border-b border-gray-200 pb-4 mb-6"><StarIcon className="h-6 w-6 text-gray-500 mr-3"/>Role-Specific KPIs</h3><div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">{kpis.map(field => <Input key={field} name={field} />)}</div></div>)}
                            </div>
                            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex items-center justify-end space-x-3">
                                 <button type="button" onClick={handleClear} className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300">{isSubmitting ? 'Saving...' : 'Submit Evaluation'}</button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
};

export default ManualEntryTL;