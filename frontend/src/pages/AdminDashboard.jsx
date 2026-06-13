import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { 
  Users, 
  FileText, 
  Bot, 
  Activity, 
  Clock, 
  Cpu, 
  ChevronRight, 
  AlertCircle 
} from 'lucide-react';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [latestDocs, setLatestDocs] = useState([]);
  const [latestUsers, setLatestUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const statsRes = await api.get('/admin/dashboard');
        setStats(statsRes.data.stats);
        setLatestDocs(statsRes.data.latestDocs);
        setLatestUsers(statsRes.data.latestUsers);

        const analyticsRes = await api.get('/admin/analytics');
        setAnalytics(analyticsRes.data.analytics);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
        setError('Failed to fetch administrator console data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-dark-950">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 animate-pulse">Compiling system aggregations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8 bg-slate-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="glass-card p-6 text-center max-w-sm space-y-4">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Admin Access Error</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  // --- Line Chart Configuration (Chats & Documents Over Time) ---
  const lineChartData = {
    labels: analytics?.labels || [],
    datasets: [
      {
        label: 'Questions Asked',
        data: analytics?.chats || [],
        borderColor: '#5c74ff', // Brand primary HSL
        backgroundColor: 'rgba(92, 116, 255, 0.15)',
        tension: 0.35,
        fill: true
      },
      {
        label: 'Documents Uploaded',
        data: analytics?.documents || [],
        borderColor: '#10b981', // Emerald green
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        tension: 0.35,
        fill: true
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 10,
          font: { size: 10, family: 'Outfit' }
        }
      }
    },
    scales: {
      y: {
        ticks: { stepSize: 1 }
      }
    }
  };

  // --- Doughnut Chart Configuration (Popular Topics) ---
  const topicsLabels = analytics?.popularTopics?.map(t => t.topic) || [];
  const topicsCounts = analytics?.popularTopics?.map(t => t.count) || [];

  const doughnutChartData = {
    labels: topicsLabels,
    datasets: [
      {
        data: topicsCounts,
        backgroundColor: [
          '#5c74ff', // Brand
          '#818cf8', // Indigo
          '#a78bfa', // Purple
          '#f472b6', // Pink
          '#10b981', // Emerald
          '#34d399', // Green
          '#fbbf24', // Amber
          '#f87171'  // Rose
        ],
        borderWidth: 1
      }
    ]
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 8,
          font: { size: 9, family: 'Outfit' }
        }
      }
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 bg-slate-50 dark:bg-dark-950 overflow-y-auto h-[calc(100vh-4rem)]">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Dashboard</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Platform overview metrics, document metrics, and audit logs.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-4">
        {/* Total Users */}
        <div className="glass-card p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Users</p>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{stats?.totalUsers || 0}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Total Documents */}
        <div className="glass-card p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Files</p>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{stats?.totalDocuments || 0}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        {/* Total Chats */}
        <div className="glass-card p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Chats</p>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{stats?.totalChats || 0}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
        </div>

        {/* Active Session Users */}
        <div className="glass-card p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Users</p>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{stats?.activeUsers || 0}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Activity className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Line Chart Panel (2/3 width) */}
        <div className="glass-card p-6 shadow-sm md:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-2">
            <Clock className="h-4.5 w-4.5 text-brand-600" />
            Daily System Interaction (Last 7 Days)
          </h3>
          <div className="h-64 relative">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Doughnut Chart Panel (1/3 width) */}
        <div className="glass-card p-6 shadow-sm md:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-2">
            <Cpu className="h-4.5 w-4.5 text-indigo-650" />
            Popular Grounding Search Topics
          </h3>
          <div className="h-64 relative">
            <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
          </div>
        </div>
      </div>

      {/* Audit Log / Tables */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Latest Documents Table */}
        <div className="glass-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-850 dark:text-white uppercase tracking-wider">Latest File Uploads</h3>
            <Link to="/admin/documents" className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-0.5">
              Manage Collection
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-600 dark:text-slate-400">
              <thead>
                <tr className="border-b border-slate-200/55 dark:border-dark-800/40 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">
                  <th className="py-2.5">File Name</th>
                  <th className="py-2.5">Uploader</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-850">
                {latestDocs.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-slate-400">No documents uploaded yet</td>
                  </tr>
                ) : (
                  latestDocs.map((doc) => (
                    <tr key={doc._id} className="hover:bg-slate-50/20 dark:hover:bg-dark-900/10">
                      <td className="py-3 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{doc.fileName}</td>
                      <td className="py-3">{doc.userId?.name || 'N/A'}</td>
                      <td className="py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          doc.processingStatus === 'Completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450' : 
                          doc.processingStatus === 'Failed' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450' :
                          'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450'
                        }`}>
                          {doc.processingStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Latest Signups Table */}
        <div className="glass-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-850 dark:text-white uppercase tracking-wider">Recent User Registrations</h3>
            <Link to="/admin/users" className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-0.5">
              Manage Accounts
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-600 dark:text-slate-400">
              <thead>
                <tr className="border-b border-slate-200/55 dark:border-dark-800/40 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5">Email</th>
                  <th className="py-2.5">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-850">
                {latestUsers.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-slate-400">No registered users</td>
                  </tr>
                ) : (
                  latestUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/20 dark:hover:bg-dark-900/10">
                      <td className="py-3 font-medium text-slate-800 dark:text-slate-200">{u.name}</td>
                      <td className="py-3">{u.email}</td>
                      <td className="py-3 capitalize">{u.role}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}

export default AdminDashboard;
