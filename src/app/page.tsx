'use client';

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Search, 
  Settings, 
  FileText, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  Building2, 
  DollarSign, 
  Zap, 
  Plus, 
  X, 
  ChevronRight, 
  Inbox,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  UserCheck,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft
} from 'lucide-react';

interface Job {
  jobId: string;
  title: string;
  company: string;
  url: string;
  appliedAt: string;
  method: string;
  status: string;
  minSalary?: number | string;
  maxSalary?: number | string;
  salary?: string;
  location?: string;
  notes?: string;
  resumeUsed?: string;
}

interface EmailItem {
  id: string;
  from: string;
  subject: string;
  date: string;
  classification: string;
  jobTitle?: string;
  company?: string;
  fullBody: string;
  matchedJob?: Job;
}

type SortField = 'title' | 'company' | 'status' | 'minSalary' | 'maxSalary' | 'appliedAt';
type SortDirection = 'asc' | 'desc';

export default function HeadhunterDashboard() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'outreach' | 'feed' | 'resumes' | 'settings'>('tracker');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Table Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sorting State - Default: Applied Date Descending
  const [sortField, setSortField] = useState<SortField>('appliedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Settings State
  const [settings, setSettings] = useState({
    salaryFloor: '$175,000',
    jobTitles: [
      'Solutions Architect',
      'AI Solutions Architect',
      'Senior Sales Engineer',
      'Sales Engineer',
      'Engineering Manager',
      'Lead Data Engineer'
    ],
    newTitleInput: '',
    email: 'Richard.torieal@gmail.com',
    phone: '(863) 513-5131',
    fullName: 'Richard Anderson',
    highestDegree: "Master's degree (M.S. FIU)",
    remoteOnly: true,
    resumeTailoringEnabled: true
  });

  const [resumes, setResumes] = useState<any[]>([]);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', company: '', url: '', minSalary: 180000, maxSalary: 225000, location: 'Remote, US', method: 'Direct' });

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      setJobs(data.appliedJobs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmails = async () => {
    try {
      const res = await fetch('/api/emails');
      const data = await res.json();
      setEmails(data.emails || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.jobTitles) {
        setSettings(prev => ({
          ...prev,
          jobTitles: data.jobTitles || prev.jobTitles,
          salaryFloor: data.minSalary ? `$${data.minSalary.toLocaleString()}` : prev.salaryFloor,
          resumeTailoringEnabled: data.resumeTailoringEnabled ?? true,
          email: data.defaultAnswers?.email || prev.email,
          phone: data.defaultAnswers?.phone || prev.phone,
          fullName: data.defaultAnswers?.fullName || prev.fullName,
          highestDegree: data.defaultAnswers?.educationLevel || prev.highestDegree
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchResumes = async () => {
    try {
      const res = await fetch('/api/resumes');
      const data = await res.json();
      setResumes(data.resumes || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchEmails();
    fetchSettings();
    fetchResumes();
  }, []);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  const handleScanEmails = async () => {
    setScanning(true);
    try {
      await fetch('/api/scan', { method: 'POST' });
      await fetchJobs();
      await fetchEmails();
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'appliedAt' ? 'desc' : 'asc');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitles: settings.jobTitles,
          salaryFloor: settings.salaryFloor,
          resumeTailoringEnabled: settings.resumeTailoringEnabled,
          defaultAnswers: {
            email: settings.email,
            phone: settings.phone,
            fullName: settings.fullName,
            educationLevel: settings.highestDegree
          }
        })
      });
      alert('Settings & preferences saved successfully!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTitle = () => {
    if (settings.newTitleInput.trim() && !settings.jobTitles.includes(settings.newTitleInput.trim())) {
      setSettings(prev => ({
        ...prev,
        jobTitles: [...prev.jobTitles, prev.newTitleInput.trim()],
        newTitleInput: ''
      }));
    }
  };

  const handleRemoveTitle = (titleToRemove: string) => {
    setSettings(prev => ({
      ...prev,
      jobTitles: prev.jobTitles.filter(t => t !== titleToRemove)
    }));
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob)
      });
      setShowAddJobModal(false);
      setNewJob({ title: '', company: '', url: '', minSalary: 180000, maxSalary: 225000, location: 'Remote, US', method: 'Direct' });
      fetchJobs();
    } catch (e) {
      console.error(e);
    }
  };

  const formatCurrency = (val?: number | string) => {
    if (!val) return '—';
    if (typeof val === 'number') return `$${val.toLocaleString()}`;
    if (val.startsWith('$')) return val;
    const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? val : `$${num.toLocaleString()}`;
  };

  // Filter and Sort Logic
  const allFilteredJobs = jobs
    .filter(j => {
      const matchesSearch = j.title.toLowerCase().includes(searchQuery.toLowerCase()) || j.company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let valA: any = a[sortField] || 0;
      let valB: any = b[sortField] || 0;

      if (sortField === 'appliedAt') {
        valA = new Date(a.appliedAt).getTime();
        valB = new Date(b.appliedAt).getTime();
      } else if (sortField === 'minSalary' || sortField === 'maxSalary') {
        valA = typeof a[sortField] === 'number' ? a[sortField] : parseInt(String(a[sortField]).replace(/[^0-9]/g, '') || '0', 10);
        valB = typeof b[sortField] === 'number' ? b[sortField] : parseInt(String(b[sortField]).replace(/[^0-9]/g, '') || '0', 10);
      } else if (sortField === 'title' || sortField === 'company' || sortField === 'status') {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Pagination Math
  const totalPages = Math.ceil(allFilteredJobs.length / pageSize) || 1;
  const paginatedJobs = allFilteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const interviewCount = jobs.filter(j => j.status === 'interview_scheduled' || j.status === 'confirmed').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Left Collapsible Sidebar */}
      <aside className={`
        fixed md:sticky top-0 z-50 h-screen bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 flex flex-col
        ${mobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        ${sidebarCollapsed ? 'md:w-20' : 'md:w-64'}
      `}>
        {/* Sidebar Header (Pinned Top) */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 font-black text-xs tracking-tighter">
              sp.ai
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <h1 className="text-base font-black text-white leading-tight tracking-tight">spray.ai</h1>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider truncate">Executive Pipeline</p>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links (Scrollable Middle Section) */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto min-h-0">
          <button 
            onClick={() => { setActiveTab('tracker'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition min-h-[44px] ${
              activeTab === 'tracker' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Briefcase className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Applications Tracker ({jobs.length})</span>}
          </button>

          <button 
            onClick={() => { setActiveTab('outreach'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition min-h-[44px] ${
              activeTab === 'outreach' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Inbox className="w-4 h-4 shrink-0 text-emerald-400" />
            {!sidebarCollapsed && <span>Email Outreach ({emails.length})</span>}
          </button>

          <button 
            onClick={() => { setActiveTab('feed'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition min-h-[44px] ${
              activeTab === 'feed' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-4 h-4 shrink-0 text-indigo-400" />
            {!sidebarCollapsed && <span>Market Opportunities</span>}
          </button>

          <button 
            onClick={() => { setActiveTab('resumes'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition min-h-[44px] ${
              activeTab === 'resumes' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0 text-purple-400" />
            {!sidebarCollapsed && <span>Resume Engine</span>}
          </button>

          <button 
            onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition min-h-[44px] ${
              activeTab === 'settings' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Settings & Profile</span>}
          </button>
        </nav>

        {/* Sidebar Footer User Info & Bottom Collapse Toggle (Pinned Bottom) */}
        <div className="p-3 border-t border-slate-800 space-y-2 shrink-0 bg-slate-900 z-10">
          {!sidebarCollapsed && (
            <div className="px-2 py-1 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-semibold truncate">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">{settings.fullName}</span>
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{settings.email}</p>
            </div>
          )}

          {/* Desktop Collapse Toggle Button at Bottom (Icon Only) */}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex items-center justify-center w-full p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition text-xs font-semibold min-h-[40px]"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>
      </aside>

      {/* Right Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs h-16 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-slate-900 truncate">
              {activeTab === 'tracker' && 'Applications Tracker'}
              {activeTab === 'outreach' && 'Recruiter Email Outreach'}
              {activeTab === 'feed' && 'Target Market Opportunities'}
              {activeTab === 'resumes' && 'Resume Category Engine'}
              {activeTab === 'settings' && 'Job Preferences & Profile'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleScanEmails}
              disabled={scanning}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition shadow-xs disabled:opacity-50 min-h-[40px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{scanning ? 'Syncing...' : 'Refresh Inbox'}</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top 3 KPI Cards (Resume Variants Card Removed) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Applications</p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{jobs.length}</h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">Direct & Easy Apply</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('outreach')}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-slate-300 transition"
            >
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Interview Outreach</p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{interviewCount}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
                  View responses <ChevronRight className="w-3.5 h-3.5" />
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Inbox className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Min Salary Floor</p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{settings.salaryFloor}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Base target threshold</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* TAB 1: PAGINATED & SCROLLABLE TRACKER TABLE */}
          {activeTab === 'tracker' && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search role or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/20 font-medium min-h-[40px]"
                  />
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none font-semibold text-slate-700 min-h-[40px]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="confirmed">Receipt Confirmed (Email)</option>
                    <option value="applied">Applied (Submitted)</option>
                    <option value="interview_scheduled">Interview Scheduled</option>
                    <option value="rejected">Declined</option>
                  </select>

                  <button 
                    onClick={() => setShowAddJobModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs min-h-[40px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Job</span>
                  </button>
                </div>
              </div>

              {/* Scrollable & Paginated Table Container */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
                {loading ? (
                  <div className="p-12 text-center text-slate-500 text-xs font-medium">Loading tracked applications...</div>
                ) : paginatedJobs.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs font-medium">No applications match your filter.</div>
                ) : (
                  <>
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200/80 shadow-xs">
                          <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                            <th 
                              onClick={() => handleSort('title')}
                              className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition"
                            >
                              <div className="flex items-center gap-1.5">
                                Role & Company
                                {sortField === 'title' ? (
                                  sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-slate-900" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-900" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-300" />
                                )}
                              </div>
                            </th>

                            <th 
                              onClick={() => handleSort('status')}
                              className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition"
                            >
                              <div className="flex items-center gap-1.5">
                                Status
                                {sortField === 'status' ? (
                                  sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-slate-900" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-900" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-300" />
                                )}
                              </div>
                            </th>

                            <th 
                              onClick={() => handleSort('minSalary')}
                              className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition"
                            >
                              <div className="flex items-center gap-1.5">
                                Min Salary
                                {sortField === 'minSalary' ? (
                                  sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-slate-900" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-900" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-300" />
                                )}
                              </div>
                            </th>

                            <th 
                              onClick={() => handleSort('maxSalary')}
                              className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition"
                            >
                              <div className="flex items-center gap-1.5">
                                Max Salary
                                {sortField === 'maxSalary' ? (
                                  sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-slate-900" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-900" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-300" />
                                )}
                              </div>
                            </th>

                            <th 
                              onClick={() => handleSort('appliedAt')}
                              className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition"
                            >
                              <div className="flex items-center gap-1.5">
                                Applied Date
                                {sortField === 'appliedAt' ? (
                                  sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-slate-900" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-900" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-300" />
                                )}
                              </div>
                            </th>

                            <th className="px-6 py-3.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {paginatedJobs.map((job, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/60 transition">
                              <td className="px-6 py-3.5">
                                <div className="font-bold text-slate-900 text-sm">{job.title}</div>
                                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                  {job.company}
                                  <span className="text-slate-300">•</span>
                                  <span className="text-slate-600 font-semibold">{job.method}</span>
                                </div>
                              </td>
                              <td className="px-6 py-3.5">
                                {job.status === 'interview_scheduled' ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Interview Scheduled
                                  </span>
                                ) : job.status === 'confirmed' ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    <Inbox className="w-3 h-3 text-indigo-600" />
                                    Receipt Confirmed
                                  </span>
                                ) : job.status === 'rejected' ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                    Declined
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                    <CheckCircle2 className="w-3 h-3 text-slate-500" />
                                    Applied (Submitted)
                                  </span>
                                )}
                              </td>

                              <td className="px-6 py-3.5 text-xs font-bold text-slate-900">
                                {formatCurrency(job.minSalary || 180000)}
                              </td>

                              <td className="px-6 py-3.5 text-xs font-semibold text-emerald-700">
                                {formatCurrency(job.maxSalary || 225000)}
                              </td>

                              <td className="px-6 py-3.5 text-xs text-slate-700 font-medium">
                                {new Date(job.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="px-6 py-3.5 text-right">
                                {job.url && (
                                  <a 
                                    href={job.url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:text-indigo-600 min-h-[36px] items-center"
                                  >
                                    View Job <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Footer Controls */}
                    <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-medium">Items per page:</span>
                        <select 
                          value={pageSize}
                          onChange={(e) => setPageSize(Number(e.target.value))}
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                        <span className="text-slate-600 font-semibold">
                          Showing {allFilteredJobs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, allFilteredJobs.length)} of {allFilteredJobs.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition min-h-[36px]"
                        >
                          Previous
                        </button>

                        <span className="px-3 py-1.5 font-bold text-slate-900 bg-white border border-slate-200 rounded-lg">
                          Page {currentPage} of {totalPages}
                        </span>

                        <button 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage >= totalPages}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition min-h-[36px]"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RECRUITER EMAIL OUTREACH */}
          {activeTab === 'outreach' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-slate-700" /> Recruiter Email Communications
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Full text messages from recruiters and applicant tracking systems mapped to your applications.
                  </p>
                </div>

                <button 
                  onClick={handleScanEmails}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
                  {scanning ? 'Scanning...' : 'Refresh Inbox'}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                    Received Messages ({emails.length})
                  </h4>

                  {emails.length === 0 ? (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                      No recruiter messages logged yet.
                    </div>
                  ) : (
                    emails.map((emailItem) => (
                      <div 
                        key={emailItem.id}
                        onClick={() => setSelectedEmail(emailItem)}
                        className={`p-4 rounded-2xl border cursor-pointer transition ${
                          selectedEmail?.id === emailItem.id 
                            ? 'bg-slate-100 border-slate-300 shadow-xs' 
                            : 'bg-white border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {emailItem.classification}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{emailItem.date.slice(0, 16)}</span>
                        </div>

                        <h5 className="text-xs font-bold text-slate-900 truncate">{emailItem.subject}</h5>
                        <p className="text-[11px] text-slate-600 font-medium mt-0.5">{emailItem.company || emailItem.from}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 font-sans">
                          {emailItem.fullBody.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>?/gm, '').trim()}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Full Email Body Content */}
                <div className="lg:col-span-2">
                  {selectedEmail ? (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                      <div className="border-b border-slate-100 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {selectedEmail.classification}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{selectedEmail.date}</span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">{selectedEmail.subject}</h2>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                          <span className="font-semibold text-slate-700">From:</span> {selectedEmail.from}
                        </div>
                        {selectedEmail.matchedJob && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                            <div>
                              <p className="text-[11px] font-bold text-slate-900">Mapped Application:</p>
                              <p className="text-xs text-slate-700 font-semibold">{selectedEmail.matchedJob.title} at {selectedEmail.matchedJob.company}</p>
                            </div>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-800">
                              Status: {selectedEmail.matchedJob.status}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                      <div className="bg-slate-100 px-4 py-2 text-[11px] font-bold text-slate-500 border-b border-slate-200 flex items-center justify-between">
                        <span>Original HTML Email Message</span>
                        <span className="text-slate-400 font-mono">Rendered View</span>
                      </div>
                      <iframe 
                        title="Full Email Message Content"
                        srcDoc={`
                          <!DOCTYPE html>
                          <html>
                            <head>
                              <meta charset="utf-8">
                              <style>
                                body, p, div, td, span, li, a, h1, h2, h3, h4 {
                                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
                                  color: #1e293b !important;
                                  line-height: 1.6 !important;
                                }
                                body {
                                  padding: 20px;
                                  margin: 0;
                                  font-size: 13px;
                                  background-color: #ffffff;
                                }
                                a { color: #4f46e5 !important; }
                              </style>
                            </head>
                            <body>
                              ${selectedEmail.fullBody}
                            </body>
                          </html>
                        `}
                        className="w-full h-[550px] border-0 bg-white"
                      />
                    </div>
                    </div>
                  ) : (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-xs text-center text-xs text-slate-400 font-medium">
                      Select an email from the left list to read its complete full body message.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TARGET MARKET OPPORTUNITIES */}
          {activeTab === 'feed' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <h3 className="text-base font-bold text-slate-900">Target Market Opportunities</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Verified direct company career portals (Greenhouse, Lever, Workday) matching your compensation criteria.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Greenhouse Direct
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-2">Senior Sales Engineer - Token Factory</h4>
                      <p className="text-xs text-slate-500 font-semibold">Nebius • Remote, United States</p>
                    </div>
                    <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                      High Match
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    Technical discovery & PoC architect role leading enterprise AI cloud infrastructure adoption. Base compensation: $180,000 - $225,000 USD.
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-800">$180,000 - $225,000 USD</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Applied
                    </span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Lever Direct
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-2">Senior AI Solutions Architect</h4>
                      <p className="text-xs text-slate-500 font-semibold">Scale AI • Remote / Hybrid US</p>
                    </div>
                    <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                      High Match
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    Architecting multi-agent foundation model pipelines and high-throughput evaluation workloads. Base compensation: $190,000 - $240,000 USD.
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-800">$190,000 - $240,000 USD</span>
                    <button className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition shadow-xs min-h-[36px]">
                      View Opportunity
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RESUME TAILORING ENGINE */}
          {activeTab === 'resumes' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Resume Category Matching</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Selects pre-tailored resume variants based on target role categories (Sales Engineer vs Solutions Architect vs Manager).
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.resumeTailoringEnabled} 
                    onChange={(e) => setSettings(prev => ({ ...prev, resumeTailoringEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  <span className="ml-3 text-xs font-bold text-slate-700">
                    {settings.resumeTailoringEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {resumes.map((r, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {r.type}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1.5">{r.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{r.filename}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
                      Florida International Univ. M.S. • Florida State Univ. B.S.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: EDITABLE SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs max-w-4xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Job Preferences & Candidate Profile</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Edit your target job titles, salary floor, remote/hybrid rules, and applicant details directly.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Target Job Titles Editor */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Target Job Titles (Add / Remove)</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {settings.jobTitles.map((title, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-900 border border-slate-200">
                        {title}
                        <button onClick={() => handleRemoveTitle(title)} className="hover:text-rose-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add new job title..."
                      value={settings.newTitleInput}
                      onChange={(e) => setSettings(prev => ({ ...prev, newTitleInput: e.target.value }))}
                      className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400/20 font-medium min-h-[40px]"
                    />
                    <button 
                      onClick={handleAddTitle}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition min-h-[40px]"
                    >
                      Add Title
                    </button>
                  </div>
                </div>

                {/* Salary Floor Editor */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Salary Floor (Minimum Strict Floor)</label>
                  <input 
                    type="text" 
                    value={settings.salaryFloor}
                    onChange={(e) => setSettings(prev => ({ ...prev, salaryFloor: e.target.value }))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400/20 min-h-[40px]"
                  />
                </div>

                {/* Editable Applicant Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Full Name</label>
                    <input 
                      type="text" 
                      value={settings.fullName}
                      onChange={(e) => setSettings(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-medium min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                    <input 
                      type="text" 
                      value={settings.email}
                      onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-medium min-h-[40px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Phone Number</label>
                    <input 
                      type="text" 
                      value={settings.phone}
                      onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-medium min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Highest Degree</label>
                    <select 
                      value={settings.highestDegree}
                      onChange={(e) => setSettings(prev => ({ ...prev, highestDegree: e.target.value }))}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400/20 min-h-[40px]"
                    >
                      <option value="High School Diploma / GED">High School Diploma / GED</option>
                      <option value="Associate's Degree (A.A. / A.S.)">Associate's Degree (A.A. / A.S.)</option>
                      <option value="Bachelor's Degree (B.S. / B.A.)">Bachelor's Degree (B.S. / B.A.)</option>
                      <option value="Master's degree (M.S. FIU)">Master's Degree (M.S. / M.A. / M.B.A.)</option>
                      <option value="Doctorate / Ph.D.">Doctorate / Ph.D.</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={handleSaveSettings}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition shadow-xs min-h-[44px]"
                >
                  Save All Settings & Preferences
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Job Modal */}
      {showAddJobModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-md space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Tracked Application</h3>
            <form onSubmit={handleAddJob} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Job Title</label>
                <input 
                  type="text" 
                  required 
                  value={newJob.title}
                  onChange={(e) => setNewJob(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[38px]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Company</label>
                <input 
                  type="text" 
                  required 
                  value={newJob.company}
                  onChange={(e) => setNewJob(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[38px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Min Salary ($)</label>
                  <input 
                    type="number" 
                    required 
                    value={newJob.minSalary}
                    onChange={(e) => setNewJob(prev => ({ ...prev, minSalary: parseInt(e.target.value, 10) || 180000 }))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[38px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Max Salary ($)</label>
                  <input 
                    type="number" 
                    required 
                    value={newJob.maxSalary}
                    onChange={(e) => setNewJob(prev => ({ ...prev, maxSalary: parseInt(e.target.value, 10) || 225000 }))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[38px]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Job Link / URL</label>
                <input 
                  type="url" 
                  required 
                  value={newJob.url}
                  onChange={(e) => setNewJob(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[38px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddJobModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 min-h-[40px]"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl min-h-[40px]"
                >
                  Add Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
