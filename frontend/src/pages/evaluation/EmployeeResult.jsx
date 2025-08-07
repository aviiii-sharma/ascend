import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  UserCircleIcon,
  ChartBarIcon,
  ArrowUpCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckBadgeIcon,
  PrinterIcon, // Import PrinterIcon for the new button
} from '@heroicons/react/24/outline';

function EmployeeResult() {
  const location = useLocation();
  const [resultData, setResultData] = useState(location.state?.result_data || null);

  // Restore from localStorage if the page is refreshed
  useEffect(() => {
    if (!resultData) {
      const saved = localStorage.getItem('result_data');
      if (saved) {
        setResultData(JSON.parse(saved));
      }
    } else {
      localStorage.setItem('result_data', JSON.stringify(resultData));
    }
  }, [resultData]);

  // --- New Feature: Print Functionality ---
  // This function triggers the browser's print dialog.
  const handlePrint = () => {
    window.print();
  };
  // --- End of New Feature ---

  if (!resultData) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50/50">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200/80 text-red-600 font-semibold flex items-center">
          <ExclamationTriangleIcon className="h-6 w-6 mr-3" />
          No report data found. Please generate a report first.
        </div>
      </div>
    );
  }

  const { promotion, attrition, anomaly, feedback_summary } = resultData;

  const getStatusBadge = (level) => {
    switch (level) {
      case 'Highly Ready':
      case 'Low':
      case 'Normal':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'High':
      case 'Anomaly Detected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {/* --- New Feature: Print-Specific Styles --- */}
      {/* These styles apply only when the user prints the page. */}
      {/* They format the report into a formal, single-column document. */}
      <style jsx="true" global="true">{`
        @media print {
          /* Hide elements not needed for the print version, like the header and print button */
          .no-print {
            display: none !important;
          }

          /* Show the formal print header only when printing */
          .print-header {
            display: block;
            text-align: center;
            margin-bottom: 2rem;
            border-bottom: 2px solid #666;
            padding-bottom: 1rem;
          }

          /* General print reset for a clean document look */
          body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            background-color: #fff;
            padding: 0;
            margin: 0;
          }

          /* Remove web-specific styling like shadows, backgrounds, and borders */
          .bg-white, .bg-gray-50\/50 {
            background-color: #fff !important;
          }
          
          .shadow-sm {
            box-shadow: none !important;
          }

          .border, .border-gray-200\/80, .rounded-2xl {
            border: none !important;
            border-radius: 0 !important;
          }

          /* Force a single-column layout for all sections */
          .grid {
            display: block !important;
          }
          .lg\:col-span-2, .space-y-8 {
             display: block;
          }

          /* Ensure sections are spaced out vertically on the page */
          .p-6, .mt-8 {
             padding: 0 0 1.5rem 0 !important;
             margin: 0 !important;
          }

          /* Reset badge styles for formal, black-and-white printing */
          .inline-flex.items-center.px-3 {
            background-color: transparent !important;
            color: #000 !important;
            border: 1px solid #999;
            padding: 2px 6px;
            font-weight: normal;
          }

          /* Make sure text is black for readability */
          .text-green-800, .text-yellow-800 {
            color: #000 !important;
          }
        }
        .print-header {
            display: none;
        }
      `}</style>
      {/* --- End of New Feature --- */}

      <div className="bg-gray-50/50 min-h-full p-4 md:p-8">
        {/* --- New Feature: Formal Print Header (Hidden on screen) --- */}
        <div className="print-header">
            <h1 className="text-2xl font-bold">Confidential Employee Performance Report</h1>
            <p className="text-sm">Date Generated: {new Date().toLocaleDateString()}</p>
        </div>
        {/* --- End of New Feature --- */}

        {/* Page Header - Added a no-print class and the print button */}
        <header className="mb-8 flex justify-between items-center no-print">
          <h1 className="text-3xl font-bold text-gray-900">
            📋 Employee Performance Report
          </h1>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors duration-200"
          >
            <PrinterIcon className="h-5 w-5" />
            <span>Print Report</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Employee Info & KPIs */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80">
              <div className="flex items-center mb-4">
                <UserCircleIcon className="h-6 w-6 text-gray-400 mr-3" />
                <h2 className="text-xl font-semibold text-gray-800">Employee Details</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6 ml-7 text-sm">
                <p><strong>Name:</strong> {promotion.employee_name}</p>
                <p><strong>ID:</strong> {promotion.employee_id || '—'}</p>
                <p><strong>Department:</strong> {promotion.department || '—'}</p>
                <p><strong>Role:</strong> {promotion.role || '—'}</p>
              </div>
              <hr className="my-6 border-gray-200" />
              <div className="flex items-center mb-4">
                <ChartBarIcon className="h-6 w-6 text-gray-400 mr-3" />
                <h2 className="text-xl font-semibold text-gray-800">KPI Breakdown</h2>
              </div>
              <ul className="space-y-2 text-sm">
                {promotion.kpi_scores && Object.entries(promotion.kpi_scores).map(([k, v]) => (
                  <li key={k} className="flex justify-between items- ml-7 mt-5">
                    <span className="font-medium text-gray-700">{k.replace(/_/g, ' ').replace('score', '').trim().toUpperCase()}</span>
                    <span className="font-semibold text-gray-900">{v}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Feedback Summary */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80">
              <div className="flex items-center mb-4">
                <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-gray-400 mr-3" />
                <h2 className="text-xl font-semibold text-gray-800">Feedback Summary</h2>
              </div>
              <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap text-sm text-gray-700 font-sans h-full">
                        {feedback_summary.replace(/\*/g, '')}
                    </pre>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Promotion Readiness */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80">
              <div className="flex items-center mb-4">
                <ArrowUpCircleIcon className="h-6 w-6 text-gray-400 mr-3" />
                <h2 className="text-xl font-semibold text-gray-800">Promotion Readiness</h2>
              </div>
              <div className="space-y-2">
                <p className="flex justify-between text-sm">Level: <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(promotion.level)}`}>{promotion.level} {promotion.icon}</span></p>
                <p className="flex justify-between text-sm">Score: <span className="font-bold">{promotion.score}</span></p>
                <p className="text-sm pt-2 text-gray-600"><strong>Recommendation:</strong> {promotion.recommendation}</p>
              </div>
            </div>

            {/* Attrition Risk */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-gray-400 mr-3" />
                <h2 className="text-xl font-semibold text-gray-800">Attrition Risk</h2>
              </div>
              <div className="space-y-2">
                <p className="flex justify-between text-sm">Risk Level: <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(attrition.risk_level)}`}>{attrition.risk_level} {attrition.icon}</span></p>
                <p className="text-sm pt-2 text-gray-600"><strong>Recommendation:</strong> {attrition.recommendation}</p>
              </div>
            </div>

            {/* Anomaly Status */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80">
              <div className="flex items-center mb-4">
                <ShieldCheckIcon className="h-6 w-6 text-gray-400 mr-3" />
                <h2 className="text-xl font-semibold text-gray-800">Anomaly Status</h2>
              </div>
              <div className="space-y-2">
                <p className="flex justify-between text-sm">Status: <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(anomaly.anomaly_status)}`}>{anomaly.anomaly_status} {anomaly.icon}</span></p>
                <p className="flex justify-between text-sm">Score: <span className="font-bold">{anomaly.anomaly_score}</span></p>
                {anomaly.description && <p className="text-sm pt-2 text-gray-600"><strong>Reason:</strong> {anomaly.description}</p>}
              </div>
            </div>
          </div>
        </div>

         {/* Final Verdict */}
         
      </div>
    </>
  );
}

export default EmployeeResult;