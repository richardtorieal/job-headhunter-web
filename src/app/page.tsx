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
  Mail, 
  Sparkles, 
  Plus, 
  X, 
  ChevronRight, 
  Eye, 
  User, 
  ShieldCheck, 
  Layers, 
  Filter, 
  Check, 
  SlidersHorizontal,
  ArrowUpRight,
  Inbox,
  Clock
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

export default function HeadhunterDashboard() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'feed' | 'outreach' | 'resumes' | 'settings'>('tracker');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fully Editable Settings state
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
    hybridMaxDays: 3,
    resumeTailoringEnabled: true,
    blacklistedKeywords: ['junior', 'intern', 'entry level', 'unpaid', 'c++', 'java'],
    preferredKeywords: ['AI', 'cloud', 'architecture', 'sales engineer', 'solutions architect']
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
          highestDegree: data.defaultAnswers?.educationLevel || prev.highestDegree,
          blacklistedKeywords: data.blacklistedKeywords || prev.blacklistedKeywords,
          preferredKeywords: data.preferredKeywords || prev.preferredKeywords
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

  const handleSaveSettings = async () => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitles: settings.jobTitles,
          salaryFloor: settings.salaryFloor,
          resumeTailoringEnabled: settings.resumeTailoringEnabled,
          blacklistedKeywords: settings.blacklistedKeywords,
          preferredKeywords: settings.preferredKeywords,
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

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(searchQuery.toLowerCase()) || j.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const interviewCount = jobs.filter(j => j.status === 'interview_scheduled' || j.status === 'confirmed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50/50 to-indigo-50/20 text-slate-800 font-sans antialiased">
      {/* Header Bar - Dribbble sise.ai Aesthetic */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-md shadow-indigo-500/15">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  sise.ai
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Headhunter Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Automated Job Application & Recruiter Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/80 text-emerald-700 text-xs font-semibold border border-emerald-200/60 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              IMAP Active: {settings.email}
            </div>

            <button 
              onClick={handleScanEmails}
              disabled={scanning}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:from-indigo-800 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-indigo-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Syncing...' : 'Sync Inbox'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Summary Cards - Dribbble sise.ai Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between group">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Applications</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{jobs.length}</h3>
              <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> Direct & Easy Apply
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50/80 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:scale-105 transition-transform">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('outreach')}
            className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-emerald-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer group"
          >
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Interview Outreach</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1 tracking-tight">{interviewCount}</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1 group-hover:text-emerald-700">
                Click to view email responses <ChevronRight className="w-3.5 h-3.5" />
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
              <Inbox className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between group">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Salary Floor</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{settings.salaryFloor}</h3>
              <p className="text-xs text-indigo-600 font-semibold mt-1">Strict floor filter enforced</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 group-hover:scale-105 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between group">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resume Variant Engine</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
                {settings.resumeTailoringEnabled ? 'Active' : 'Disabled'}
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">Auto-tailors per role category</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Dribbble Pill Style */}
        <div className="flex bg-white/80 p-1.5 rounded-2xl border border-slate-200/80 shadow-xs mb-8 overflow-x-auto gap-2">
          <button 
            onClick={() => setActiveTab('tracker')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'tracker' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Tracker ({jobs.length})
          </button>

          <button 
            onClick={() => setActiveTab('outreach')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'outreach' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Inbox className="w-4 h-4 text-emerald-500" />
            Recruiter Email Outreach ({emails.length})
          </button>

          <button 
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'feed' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Search className="w-4 h-4 text-indigo-500" />
            Headhunter Match Feed
          </button>

          <button 
            onClick={() => setActiveTab('resumes')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'resumes' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <FileText className="w-4 h-4 text-purple-500" />
            Resume Tailoring Engine
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'settings' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-500" />
            Settings & Criteria
          </button>
        </div>

        {/* TAB 1: TRACKER */}
        {activeTab === 'tracker' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/90 p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search role or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
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
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Tracked Job
                </button>
              </div>
            </div>

            {/* Jobs Table */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-slate-500 font-medium">Loading tracked applications...</div>
              ) : filteredJobs.length === 0 ? (
                <div className="p-12 text-center text-slate-500 font-medium">No applications match your search.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Role & Company</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Salary / Location</th>
                        <th className="px-6 py-4">Applied Date</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredJobs.map((job, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition">
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
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Interview / Confirmed
                              </span>
                            ) : job.status === 'rejected' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                Declined
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                Applied
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600">
                            <div className="font-bold text-slate-900">{job.salary || '$180,000+'}</div>
                            <div className="text-slate-400 mt-0.5">{job.location || 'Remote, US'}</div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                            {new Date(job.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {job.url && (
                              <a 
                                href={job.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 transition"
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

        {/* TAB 2: RECRUITER EMAIL OUTREACH & FULL MESSAGES (User Request #1) */}
        {activeTab === 'outreach' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold">Recruiter Outreach & Full Email Content Viewer</h2>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Full text of incoming emails from recruiters, hiring managers, and applicant tracking systems mapped to your applications.
                </p>
              </div>

              <button 
                onClick={handleScanEmails}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
                {scanning ? 'Scanning...' : 'Check Inbox'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Email List Column */}
              <div className="lg:col-span-1 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  Incoming Responses ({emails.length})
                </h3>

                {emails.length === 0 ? (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                    No recruiter emails logged yet. Click "Check Inbox" to sync.
                  </div>
                ) : (
                  emails.map((emailItem) => (
                    <div 
                      key={emailItem.id}
                      onClick={() => setSelectedEmail(emailItem)}
                      className={`p-4 rounded-2xl border cursor-pointer transition ${
                        selectedEmail?.id === emailItem.id 
                          ? 'bg-indigo-50/80 border-indigo-300 shadow-sm' 
                          : 'bg-white/90 border-slate-200/80 hover:border-indigo-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {emailItem.classification}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{emailItem.date.slice(0, 16)}</span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 truncate">{emailItem.subject}</h4>
                      <p className="text-[11px] text-indigo-600 font-medium mt-0.5">{emailItem.company || emailItem.from}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1.5 font-sans leading-relaxed">
                        {emailItem.fullBody.replace(/<[^>]*>?/gm, '')}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Full Email Body Content Viewer */}
              <div className="lg:col-span-2">
                {selectedEmail ? (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
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

                    <div className="prose prose-slate max-w-none text-xs text-slate-700 leading-relaxed font-mono bg-slate-50 p-4 rounded-xl border border-slate-200/60 whitespace-pre-wrap">
                      {selectedEmail.fullBody.replace(/<[^>]*>?/gm, '')}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-xs text-center text-xs text-slate-400">
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
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold">Multi-Source Headhunter Real-Time Feed</h2>
              </div>
              <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
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
                    <h3 className="text-base font-bold text-slate-900 mt-2">Senior Sales Engineer - Token Factory</h3>
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
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-100">
                      Lever Direct
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2">Senior AI Solutions Architect</h3>
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
                  <button className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs">
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
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
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

        {/* TAB 5: FULLY EDITABLE SETTINGS (User Request #2) */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs max-w-4xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Job Preferences & Account Criteria (Fully Editable)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Edit your target job titles, salary floor, remote/hybrid rules, and applicant details directly. Changes persist to your automation config.
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
                    placeholder="Add new job title (e.g. Technical Product Manager)..."
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
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold rounded-xl transition shadow-sm"
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
