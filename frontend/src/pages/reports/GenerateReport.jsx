import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  ArrowUpCircleIcon,
  ShieldExclamationIcon,
  ChatBubbleLeftRightIcon,
  PrinterIcon,
  ChartBarSquareIcon // ⭐️ ADDED: New icon for the KPI card
} from '@heroicons/react/24/outline';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

// --- Helper Function ---
const getBadgeColor = (text) => {
    const lowerText = text?.toLowerCase() || '';
    if (lowerText.includes('high') || lowerText.includes('negative') || lowerText.includes('detected')) return 'bg-red-100 text-red-800';
    if (lowerText.includes('medium') || lowerText.includes('moderate') || lowerText.includes('neutral')) return 'bg-yellow-100 text-yellow-800';
    if (lowerText.includes('low') || lowerText.includes('positive') || lowerText.includes('normal')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
};

// --- Main Visible Component (On-Screen UI) ---
function GenerateReport() {
  const location = useLocation();
  const resultData = location.state?.resultData;
  const [isDownloading, setIsDownloading] = useState(false);

  // NOTE: The PDF download feature points to a '/api/download-report' endpoint
  // which is not defined in your app.py. This functionality will require a new
  // backend route capable of creating and serving PDF files.
  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    alert("Note: PDF download functionality is not yet fully implemented on the backend.");
    setIsDownloading(false);
    return; 
    
    // The code below is kept for when the backend functionality is added.
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Authentication token not found.");
      
      const formData = new FormData();
      formData.append('employee_name', resultData.promotion.employee_name);

      const response = await fetch('http://localhost:5000/api/download-report', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate PDF.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${resultData.promotion.employee_name.replace(" ", "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error downloading report:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!resultData) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-xl font-semibold text-gray-800">No Report Data Found</h2>
            <p className="mt-1 text-gray-500">Please generate a prediction first.</p>
        </div>
    );
  }
  
  // ⭐️ MODIFIED: Destructure kpi_scores and feedback_summary directly
  const { promotion, attrition, anomaly, feedback_summary } = resultData;
  const promotionData = [{ name: 'score', value: promotion.score, fill: '#4f46e5' }];
  const kpiScores = promotion?.kpi_scores || {};
  
  // A simple parser for the AI summary which might be a plain string
  let parsed_feedback = {};
  if (typeof feedback_summary === 'string' && feedback_summary.includes(':')) {
      try {
        const lines = feedback_summary.split('\n');
        parsed_feedback.sentiment = lines.find(l => l.toLowerCase().startsWith('1. sentiment'))?.split(':')[1]?.trim() || 'N/A';
        parsed_feedback.key_themes = lines.find(l => l.toLowerCase().startsWith('2. key themes'))?.split(':')[1]?.trim() || 'N/A';
        parsed_feedback.one_line_summary = lines.find(l => l.toLowerCase().startsWith('3. one-line summary'))?.split(':')[1]?.trim() || 'No summary available.';
        parsed_feedback.soft_skills_score = lines.find(l => l.toLowerCase().startsWith('4. soft-skills score'))?.split(':')[1]?.trim() || 'N/A';
      } catch (e) {
          parsed_feedback.one_line_summary = feedback_summary; // Fallback to raw text
      }
  } else {
      parsed_feedback.one_line_summary = feedback_summary || 'No feedback provided.';
  }


  return (
    <div className="bg-gray-50/50 min-h-screen p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
            <header className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Evaluation Report</h1>
                    <p className="text-sm text-gray-500">Generated on {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <button
                    onClick={handleDownloadPdf}
                    disabled={isDownloading}
                    className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-400"
                >
                    <PrinterIcon className="h-5 w-5" />
                    {isDownloading ? 'Generating...' : 'Download Report'}
                </button>
            </header>

            <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-lg border border-gray-200/80">
                <div className="text-center border-b pb-8 mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Confidential Employee Evaluation</h2>
                    <p className="text-lg text-gray-600 mt-2">for</p>
                    <p className="text-4xl font-bold text-indigo-600 mt-1">{promotion.employee_name}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Promotion Card */}
                    <div className="bg-slate-50/50 p-6 rounded-xl border border-gray-200 flex flex-col">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-3 mb-4"><ArrowUpCircleIcon className="h-7 w-7 text-indigo-600" />Promotion Readiness</h3>
                        <div className="flex items-center gap-6">
                            <div className="w-32 h-32 flex-shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadialBarChart innerRadius="75%" outerRadius="100%" barSize={12} data={promotionData} startAngle={90} endAngle={-270}>
                                        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                        <RadialBar background clockWise dataKey="value" cornerRadius={6} />
                                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold fill-gray-800">{promotion.score}</text>
                                        <text x="50%" y="68%" textAnchor="middle" dominantBaseline="middle" className="text-xs font-medium fill-gray-500">/ 100</text>
                                    </RadialBarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-lg text-gray-800">{promotion.level}</p>
                                <p className="text-sm text-gray-600 mt-1">{promotion.recommendation}</p>
                            </div>
                        </div>
                    </div>
                    {/* Attrition & Anomaly Cards */}
                    <div className="space-y-6">
                        <div className="bg-slate-50/50 p-6 rounded-xl border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3"><ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />Attrition Risk</h3>
                            <div className="mt-3">
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${getBadgeColor(attrition.risk_level)}`}>{attrition.risk_level}</span>
                                <p className="text-sm text-gray-600 mt-2">{attrition.recommendation}</p>
                            </div>
                        </div>
                        <div className="bg-slate-50/50 p-6 rounded-xl border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3"><ShieldExclamationIcon className="h-6 w-6 text-red-600" />Anomaly Detection</h3>
                            <div className="mt-3">
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${getBadgeColor(anomaly.anomaly_status)}`}>{anomaly.anomaly_status}</span>
                                {anomaly.description && anomaly.anomaly_status !== "Normal" && 
                                    <p className="text-sm text-gray-600 mt-2"><span className="font-semibold">Reason:</span> {anomaly.description}</p>
                                }
                            </div>
                        </div>
                    </div>

                    {/* ⭐️ START: NEW KPI SCORES CARD */}
                    {Object.keys(kpiScores).length > 0 && (
                        <div className="md:col-span-2 bg-slate-50/50 p-6 rounded-xl border border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-3 mb-4">
                                <ChartBarSquareIcon className="h-7 w-7 text-teal-600" />
                                Key Performance Indicators
                            </h3>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                                {Object.entries(kpiScores).map(([kpi, score]) => (
                                    <li key={kpi} className="flex justify-between items-baseline border-b border-gray-200/80 py-1.5">
                                        <span className="text-sm font-medium text-gray-600">{kpi}</span>
                                        <span className="text-base font-semibold text-gray-800">{score?.toFixed(1) ?? 'N/A'}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {/* ⭐️ END: NEW KPI SCORES CARD */}

                    {/* Feedback Summary Card */}
                    <div className="md:col-span-2 bg-slate-50/50 p-6 rounded-xl border border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-3 mb-4"><ChatBubbleLeftRightIcon className="h-7 w-7 text-green-600" />AI Feedback Summary</h3>
                        <blockquote className="border-l-4 border-indigo-400 pl-4 italic text-gray-700">
                           {parsed_feedback.one_line_summary}
                        </blockquote>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-sm text-gray-500">Sentiment</p>
                                <p className={`mt-1 font-semibold ${getBadgeColor(parsed_feedback.sentiment).replace('bg-', 'text-')}`}>{parsed_feedback.sentiment || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Soft-Skills Score</p>
                                <p className="mt-1 font-semibold text-gray-800">{parsed_feedback.soft_skills_score || 'N/A'}</p>
                            </div>
                            <div className="sm:col-span-3 pt-2 mt-2 border-t">
                                <p className="text-sm text-gray-500 mb-2">Key Themes</p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {(parsed_feedback.key_themes?.split(',') || ['N/A']).map(theme => (
                                        <span key={theme} className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">{theme.trim()}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}

export default GenerateReport;