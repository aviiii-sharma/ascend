import React, { useEffect, useState } from 'react';
import {
    PieChart, Pie, Cell, Radar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, BarChart, Bar,
    XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
    ArrowPathIcon, 
    ExclamationTriangleIcon,
    ChartBarIcon,
    CubeTransparentIcon,
    CalendarDaysIcon,
    UsersIcon,
    ScaleIcon
} from '@heroicons/react/24/outline';

// --- New, more professional and cohesive color palette ---
const COLORS = {
  primary: '#4f46e5', // Indigo 600
  accent: '#10b981',  // Emerald 500
  text: '#1f2937',      // Gray 800
  subtleText: '#6b7280', // Gray 500
  background: '#f9fafb', // Gray 50
  border: '#e5e7eb',      // Gray 200
  stack: ['#6366f1', '#818cf8', '#a5b4fc'], // Shades of Indigo
};


// --- Reusable card wrapper for each chart ---
const ChartCard = ({ title, icon: Icon, children, data, colSpan = 'lg:col-span-1' }) => (
  <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200/80 ${colSpan}`}>
    <div className="flex items-center text-gray-800 mb-4">
      <Icon className="h-6 w-6 mr-3 text-indigo-500" />
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <div className="h-72"> {/* Fixed height for container */}
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

// --- A styled custom tooltip for recharts ---
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

// --- New component for the Overall Score Donut Chart ---
const OverallScoreCard = ({ score }) => {
    const data = [
        { name: 'Score', value: score },
        { name: 'Remaining', value: 5 - score },
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/80 lg:col-span-1 flex flex-col justify-between">
            <div className="flex items-center text-gray-800">
                <ScaleIcon className="h-6 w-6 mr-3 text-indigo-500" />
                <h3 className="text-lg font-semibold">Overall Performance</h3>
            </div>
            <div className="relative h-48 w-48 mx-auto my-4">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius="70%"
                            outerRadius="100%"
                            startAngle={90}
                            endAngle={450}
                            paddingAngle={0}
                            dataKey="value"
                        >
                            <Cell key="score" fill={COLORS.primary} stroke={COLORS.primary} />
                            <Cell key="remaining" fill={COLORS.border} stroke={COLORS.border} />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold text-gray-800">{score}</span>
                    <span className="text-sm text-gray-500">out of 5</span>
                </div>
            </div>
            <p className="text-xs text-center text-gray-500">Weighted average of all performance metrics.</p>
        </div>
    );
};

// --- Custom tick for X-Axis to handle word wrapping ---
const CustomizedAxisTick = ({ x, y, payload }) => {
  const { value } = payload;
  const words = value.split(' ');

  if (words.length <= 1) {
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill={COLORS.subtleText} fontSize={11}>
          {value}
        </text>
      </g>
    );
  }

  const line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
  const line2 = words.slice(Math.ceil(words.length / 2)).join(' ');

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={10} textAnchor="middle" fill={COLORS.subtleText} fontSize={11}>
        <tspan x={0} dy="0.6em">{line1}</tspan>
        <tspan x={0} dy="1.2em">{line2}</tspan>
      </text>
    </g>
  );
};


function InsightsPanel() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // This fetch call remains the same, driven by your backend
    fetch('http://localhost:5000/api/insights')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setInsights(data);
      })
      .catch(err => {
        setError(err.message || "Could not fetch insights.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <ArrowPathIcon className="h-8 w-8 text-gray-500 animate-spin" />
        <span className="ml-4 text-gray-600">Loading Insights...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-semibold text-gray-800">Failed to Load Data</h2>
        <p className="mt-1 text-gray-500">{error}</p>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Organizational Insights</h1>
          <p className="mt-1 text-md text-gray-600">
            Performance overview as of {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}.
          </p>
        </header>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Overall Score Card (New Component) */}
          <OverallScoreCard score={insights.overall_score} />
          
          {/* Category Breakdown Chart */}
          <ChartCard title="Category-Wise Average Scores" icon={ChartBarIcon} data={insights.category_scores} colSpan="lg:col-span-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights.category_scores} margin={{ top: 20, right: 20, left: -10, bottom: 7 }}>
                {/* --- FIX: Use custom tick for straight, wrapped labels --- */}
                <XAxis 
                  dataKey="category" 
                  height={40} 
                  interval={0}
                  tickLine={false} 
                  axisLine={false} 
                  tick={<CustomizedAxisTick />}
                />
                <YAxis tick={{ fontSize: 12, fill: COLORS.subtleText }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} />
                <Bar dataKey="score" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Skill Balance Radar Chart */}
          <ChartCard title="Skill Balance Radar" icon={CubeTransparentIcon} data={insights.skill_balance} colSpan="lg:col-span-1">
             <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={insights.skill_balance}>
                    <PolarGrid stroke={COLORS.border} />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12, fill: COLORS.subtleText }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar name="Score" dataKey="value" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.6} />
                    <Tooltip content={<CustomTooltip />} />
                </RadarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Monthly Trends Chart */}
          <ChartCard title="Monthly Performance Trend" icon={CalendarDaysIcon} data={insights.monthly_trends} colSpan="lg:col-span-2">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={insights.monthly_trends} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: COLORS.subtleText }} tickLine={false} axisLine={false}/>
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: COLORS.subtleText }} tickLine={false} axisLine={false}/>
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} />
                  <Bar dataKey="avg_score" fill={COLORS.accent} radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Team Heatmap Chart */}
          <ChartCard title="Team Performance Heatmap" icon={UsersIcon} data={insights.team_heatmap} colSpan="lg:col-span-3">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insights.team_heatmap} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="team" width={80} tick={{ fontSize: 12, fill: COLORS.subtleText }} tickLine={false} axisLine={false}/>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: '20px' }} />
                  {Object.keys(insights.team_heatmap[0] || {})
                    .filter(key => key !== 'team')
                    .map((metric, idx) => (
                      <Bar key={metric} dataKey={metric} stackId="a" fill={COLORS.stack[idx % COLORS.stack.length]} />
                  ))}
                </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          
        </div>
      </div>
    </div>
  );
}

export default InsightsPanel;