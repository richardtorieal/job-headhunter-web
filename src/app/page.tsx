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
  Sparkles, 
  Plus, 
  X, 
  ChevronRight, 
  Inbox,
  ArrowUpRight,
  ArrowUpDown,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface Job {
  jobId: string;
  title: string;
  company: string;
  url: string;
  appliedAt: string;
  method: string;
  status: string;
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

type SortField = 'title' | 'company' | 'status' | 'salary' | 'appliedAt';
type SortDirection = 'asc' | 'desc';

export default function HeadhunterDashboard() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'outreach' | 'feed' | 'resumes' | 'settings'>('tracker');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sorting State - Default: Applied Date Descending (Newest First)
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
  const [newJob, setNewJob] = useState({ title: '', company: '', url: '', salary: '$180,000+', location: 'Remote, US', method: 'Direct' });

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
      setNewJob({ title: '', company: '', url: '', salary: '$180,000+', location: 'Remote, US', method: 'Direct' });
      fetchJobs();
    } catch (e) {
      console.error(e);
    }
  };

  // Filter and Sort Logic
  const processedJobs = jobs
    .filter(j => {
      const matchesSearch = j.title.toLowerCase().includes(searchQuery.toLowerCase()) || j.company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let valA: any = a[sortField] || '';
      let valB: any = b[sortField] || '';

      if (sortField === 'appliedAt') {
        valA = new Date(a.appliedAt).getTime();
        valB = new Date(b.appliedAt).getTime();
      } else if (sortField === 'title' || sortField === 'company' || sortField === 'status') {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const interviewCount = jobs.filter(j => j.status === 'interview_scheduled' || j.status === 'confirmed').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Clean Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none">
                Headhunter AI
              </h1>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Executive Career Automation & Application Tracker</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              IMAP Active: {settings.email}
            </div>

            <button 
              onClick={handleScanEmails}
              disabled={scanning}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Syncing...' : 'Sync Inbox'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Applications</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{jobs.length}</h3>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Direct & Easy Apply</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('outreach')}
            className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-300 transition"
          >
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Interview Outreach</p>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{interviewCount}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
                View email responses <ChevronRight className="w-3.5 h-3.5" />
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Inbox className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Salary Floor</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{settings.salaryFloor}</h3>
              <p className="text-xs text-indigo-600 font-medium mt-1">Strict floor filter enforced</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resume Variant Engine</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {settings.resumeTailoringEnabled ? 'Active' : 'Disabled'}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Auto-tailors per role category</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 mb-8 space-x-8">
          <button 
            onClick={() => setActiveTab('tracker')}
            className={`pb-4 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'tracker' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Job Applications Tracker ({jobs.length})
          </button>

          <button 
            onClick={() => setActiveTab('outreach')}
            className={`pb-4 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'outreach' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Inbox className="w-4 h-4 text-emerald-600" />
            Recruiter Email Outreach ({emails.length})
          </button>

          <button 
            onClick={() => setActiveTab('feed')}
            className={`pb-4 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'feed' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-4 h-4 text-indigo-500" />
            Headhunter Match Feed
          </button>

          <button 
            onClick={() => setActiveTab('resumes')}
            className={`pb-4 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'resumes' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-purple-500" />
            Resume Tailoring Engine
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`pb-4 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'settings' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-500" />
            Settings & Preferences
          </button>
        </div>

        {/* TAB 1: SORTABLE TRACKER TABLE */}
        {activeTab === 'tracker' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search role or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-semibold text-slate-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="interview_scheduled">Interview / Confirmed</option>
                  <option value="applied">Applied</option>
                  <option value="rejected">Rejected</option>
                </select>

                <button 
                  onClick={() => setShowAddJobModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Tracked Job
                </button>
              </div>
            </div>

            {/* Interactive Sortable Jobs Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-slate-500 text-xs font-medium">Loading tracked applications...</div>
              ) : processedJobs.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs font-medium">No applications match your search.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                        <th 
                          onClick={() => handleSort('title')}
                          className="px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition"
                        >
                          <div className="flex items-center gap-1.5">
                            Role & Company
                            {sortField === 'title' ? (
                              sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-300" />
                            )}
                          </div>
                        </th>

                        <th 
                          onClick={() => handleSort('status')}
                          className="px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition"
                        >
                          <div className="flex items-center gap-1.5">
                            Status
                            {sortField === 'status' ? (
                              sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-300" />
                            )}
                          </div>
                        </th>

                        <th 
                          onClick={() => handleSort('salary')}
                          className="px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition"
                        >
                          <div className="flex items-center gap-1.5">
                            Salary / Location
                            {sortField === 'salary' ? (
                              sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-300" />
                            )}
                          </div>
                        </th>

                        <th 
                          onClick={() => handleSort('appliedAt')}
                          className="px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition bg-indigo-50/40 text-indigo-900"
                        >
                          <div className="flex items-center gap-1.5">
                            Applied Date (Default: Descending)
                            {sortField === 'appliedAt' ? (
                              sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-300" />
                            )}
                          </div>
                        </th>

                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {processedJobs.map((job, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 text-sm">{job.title}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {job.company}
                              <span className="text-slate-300">•</span>
                              <span className="text-indigo-600 font-semibold">{job.method}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {job.status === 'interview_scheduled' || job.status === 'confirmed' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Interview / Confirmed
                              </span>
                            ) : job.status === 'rejected' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                Declined
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                Applied
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600">
                            <div className="font-bold text-slate-900">{job.salary || '$180,000+'}</div>
                            <div className="text-slate-400 mt-0.5">{job.location || 'Remote, US'}</div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-700 font-bold bg-slate-50/40">
                            {new Date(job.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {job.url && (
                              <a 
                                href={job.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
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
                  <Inbox className="w-5 h-5 text-emerald-600" /> Recruiter Email Outreach & Full Content
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Full content of incoming emails from recruiters and applicant tracking systems mapped to your applications.
                </p>
              </div>

              <button 
                onClick={handleScanEmails}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
                {scanning ? 'Scanning...' : 'Check Inbox'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  Incoming Emails ({emails.length})
                </h4>

                {emails.length === 0 ? (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                    No recruiter emails logged yet.
                  </div>
                ) : (
                  emails.map((emailItem) => (
                    <div 
                      key={emailItem.id}
                      onClick={() => setSelectedEmail(emailItem)}
                      className={`p-4 rounded-2xl border cursor-pointer transition ${
                        selectedEmail?.id === emailItem.id 
                          ? 'bg-indigo-50/80 border-indigo-300 shadow-xs' 
                          : 'bg-white border-slate-200/80 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {emailItem.classification}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{emailItem.date.slice(0, 16)}</span>
                      </div>

                      <h5 className="text-xs font-bold text-slate-900 truncate">{emailItem.subject}</h5>
                      <p className="text-[11px] text-indigo-600 font-medium mt-0.5">{emailItem.company || emailItem.from}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 font-sans">
                        {emailItem.fullBody.replace(/<[^>]*>?/gm, '')}
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
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {selectedEmail.classification}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{selectedEmail.date}</span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900">{selectedEmail.subject}</h2>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span className="font-semibold text-slate-700">From:</span> {selectedEmail.from}
                      </div>
                      {selectedEmail.matchedJob && (
                        <div className="mt-3 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-bold text-indigo-900">Mapped Application:</p>
                            <p className="text-xs text-indigo-700 font-semibold">{selectedEmail.matchedJob.title} at {selectedEmail.matchedJob.company}</p>
                          </div>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                            Status: {selectedEmail.matchedJob.status}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="prose prose-slate max-w-none text-xs text-slate-700 leading-relaxed font-sans bg-slate-50 p-4 rounded-xl border border-slate-200/60 whitespace-pre-wrap">
                      {selectedEmail.fullBody.replace(/<[^>]*>?/gm, '')}
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

        {/* TAB 3: HEADHUNTER FEED */}
        {activeTab === 'feed' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Multi-Source Headhunter Real-Time Feed</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Non-LinkedIn & LinkedIn direct career portals (Greenhouse, Lever, Workday) matching your specifications ($175k+, remote/hybrid).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      Greenhouse Direct
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-2">Senior Sales Engineer - Token Factory</h4>
                    <p className="text-xs text-slate-500 font-semibold">Nebius • Remote, United States</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    98% Match
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Technical discovery & PoC architect role leading enterprise AI cloud infrastructure adoption. Base compensation: $180,000 - $225,000 USD.
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-800">$180k - $225k USD</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Auto-Applied via IMAP Verification
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      Lever Direct
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-2">Senior AI Solutions Architect</h4>
                    <p className="text-xs text-slate-500 font-semibold">Scale AI • Remote / Hybrid US</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    95% Match
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Architecting multi-agent foundation model pipelines and high-throughput evaluation workloads. Base compensation: $190,000 - $240,000 USD.
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-800">$190k - $240k USD</span>
                  <button className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-xs">
                    1-Click Apply
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
                <h3 className="text-base font-bold text-slate-900">Dynamic Resume Tailoring System</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Automatically generates and selects tailored resume variants based on target job categories (Sales Engineer vs Solutions Architect vs Manager).
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.resumeTailoringEnabled} 
                  onChange={(e) => setSettings(prev => ({ ...prev, resumeTailoringEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-3 text-xs font-bold text-slate-700">
                  {settings.resumeTailoringEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {resumes.map((r, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {r.type}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1.5">{r.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{r.filename}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
                    Florida International Univ. M.S. • JPMorgan Chase / Capital One Lead
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
              <h3 className="text-base font-bold text-slate-900">Job Preferences & Account Criteria (Fully Editable)</h3>
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
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
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
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                  />
                  <button 
                    onClick={handleAddTitle}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
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
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                  <input 
                    type="text" 
                    value={settings.email}
                    onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-medium"
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
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Highest Degree</label>
                  <input 
                    type="text" 
                    value={settings.highestDegree}
                    onChange={(e) => setSettings(prev => ({ ...prev, highestDegree: e.target.value }))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={handleSaveSettings}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
              >
                Save All Settings & Preferences
              </button>
            </div>
          </div>
        )}
      </main>

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
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Company</label>
                <input 
                  type="text" 
                  required 
                  value={newJob.company}
                  onChange={(e) => setNewJob(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Job Link / URL</label>
                <input 
                  type="url" 
                  required 
                  value={newJob.url}
                  onChange={(e) => setNewJob(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddJobModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
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
