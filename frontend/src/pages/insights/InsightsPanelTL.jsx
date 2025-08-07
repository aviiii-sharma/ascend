import React, { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar, Cell, PolarRadiusAxis
} from 'recharts';
import { 
    ExclamationTriangleIcon,
    ChartBarIcon,
    UsersIcon,
    StarIcon,
    ShieldCheckIcon,
    ArrowTrendingUpIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';

// Consistent color palette from the HR Insights panel
const COLORS = {
  primary: '#4f46e5', // Indigo 600
  accent: '#10b981',  // Emerald 500
  text: '#1f2937',      // Gray 800
  subtleText: '#6b7280', // Gray 500
  background: '#f9fafb', // Gray 50
  border: '#e5e7eb',      // Gray 200
  stack: ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'], // Shades of Indigo
  performance: {
    low: '#f87171', // Red 400
    mid: '#facc15', // Yellow 400
    high: '#4ade80', // Green 400
  }
};

// --- Mock Data for Team Lead Insights ---
const mockTeamData = {
    teamName: "Alpha Squad",
    averageScore: 4.1,
    completionRate: 92,
    topPerformer: { name: "Priya Sharma", score: 4.8 },
    lowPerformer: { name: "Rohan Mehta", score: 3.2 },
    performanceDistribution: [
        { name: 'Needs Improvement (1-3)', count: 1 },
        { name: 'Meets Expectations (3-4)', count: 4 },
        { name: 'Exceeds Expectations (4-5)', count: 3 },
    ],
    categoryScores: [
        { category: 'Technical Skills', score: 4.2 },
        { category: 'Communication', score: 3.9 },
        { category: 'Teamwork', score: 4.5 },
        { category: 'Problem Solving', score: 4.0 },
        { category: 'Leadership', score: 3.8 },
    ],
    employeeComparison: [
        { name: "Priya S.", "Technical": 5, "Communication": 4, "Teamwork": 5 },
        { name: "Amit K.", "Technical": 4, "Communication": 4, "Teamwork": 4 },
        { name: "Sunita R.", "Technical": 4, "Communication": 5, "Teamwork": 4 },
        { name: "Rohan M.", "Technical": 3, "Communication": 3, "Teamwork": 4 },
        { name: "Kavita N.", "Technical": 5, "Communication": 4, "Teamwork": 5 },
        { name: "Vikas G.", "Technical": 4, "Communication": 3, "Teamwork": 4 },
    ],
    skillBalance: [
      { skill: 'ReactJS', value: 4.5 },
      { skill: 'Node.js', value: 4.1 },
      { skill: 'MongoDB', value: 3.8 },
      { skill: 'System Design', value: 3.5 },
      { skill: 'CI/CD', value: 4.0 },
    ]
};

// --- Reusable Components (from InsightsPanel.jsx for consistency) ---

const ChartCard = ({ title, icon: Icon, children, data, colSpan = 'lg:col-span-1' }) => (
  <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200/80 ${colSpan}`}>
    <div className="flex items-center text-gray-800 mb-4">
      <Icon className="h-6 w-6 mr-3 text-indigo-500" />
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <div className="h-72">
      {!data || data.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          <span>No data available</span>
        </div>
      ) : (
        children
      )}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-sm p-3 shadow-md rounded-lg border border-gray-200">
        <p className="font-bold text-gray-800 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const StatCard = ({ title, value, icon: Icon, subtext }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200/80">
        <div className="flex items-center">
            <div className="flex-shrink-0">
                <div className="bg-indigo-100 p-3 rounded-full">
                    <Icon className="h-6 w-6 text-indigo-600" />
                </div>
            </div>
            <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
                <p className="text-2xl font-semibold text-gray-900">{value}</p>
            </div>
        </div>
        {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}
    </div>
);


// --- Main Team Lead Insights Panel Component ---

function InsightsPanelTL() {
  const [insights, setInsights] = useState(mockTeamData);

  // In a real app, you would fetch this data
  // useEffect(() => {
  //   fetch('/api/manager/insights')
  //     .then(res => res.json())
  //     .then(data => setInsights(data));
  // }, []);

  if (!insights) return null;

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Insights: {insights.teamName}</h1>
          <p className="mt-1 text-md text-gray-600">
            A detailed performance overview of your direct reports.
          </p>
        </header>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard title="Team Average Score" value={insights.averageScore} icon={ArrowTrendingUpIcon} subtext="Out of 5" />
            <StatCard title="Completion Rate" value={`${insights.completionRate}%`} icon={ShieldCheckIcon} subtext="Evaluations finished" />
            <StatCard title="Top Performer" value={insights.topPerformer.name} icon={StarIcon} subtext={`Score: ${insights.topPerformer.score}`} />
            <StatCard title="Needs Attention" value={insights.lowPerformer.name} icon={ExclamationTriangleIcon} subtext={`Score: ${insights.lowPerformer.score}`} />
        </div>

        {/* Grid Layout for Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Performance Distribution */}
          <ChartCard title="Performance Distribution" icon={ChartBarIcon} data={insights.performanceDistribution} colSpan="lg:col-span-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights.performanceDistribution} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: COLORS.subtleText }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} />
                <Bar dataKey="count" name="Employees" radius={[0, 6, 6, 0]}>
                    {insights.performanceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={Object.values(COLORS.performance)[index]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          
          {/* Category-wise Team Scores */}
          <ChartCard title="Category-wise Team Scores" icon={ChartBarIcon} data={insights.categoryScores} colSpan="lg:col-span-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights.categoryScores} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="category" tick={{ fontSize: 12, fill: COLORS.subtleText }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: COLORS.subtleText }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} />
                <Bar dataKey="score" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Employee Performance Comparison */}
          <ChartCard title="Employee Performance Comparison" icon={UsersIcon} data={insights.employeeComparison} colSpan="lg:col-span-3">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insights.employeeComparison} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: COLORS.subtleText }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: COLORS.subtleText }} tickLine={false} axisLine={false}/>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: '20px' }} />
                  <Bar dataKey="Technical" stackId="a" fill={COLORS.stack[0]} />
                  <Bar dataKey="Communication" stackId="a" fill={COLORS.stack[1]} />
                  <Bar dataKey="Teamwork" stackId="a" fill={COLORS.stack[2]} radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Skill Balance Radar Chart */}
          <ChartCard title="Team Skill Balance" icon={UserGroupIcon} data={insights.skillBalance} colSpan="lg:col-span-1">
             <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={insights.skillBalance}>
                    <PolarGrid stroke={COLORS.border} />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: COLORS.subtleText }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar name="Team Average" dataKey="value" stroke={COLORS.accent} fill={COLORS.accent} fillOpacity={0.6} />
                    <Tooltip content={<CustomTooltip />} />
                </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
          
        </div>
      </div>
    </div>
  );
}

export default InsightsPanelTL;
