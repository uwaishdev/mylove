import React, { useState, useEffect } from 'react';
import {
  Lock,
  LogOut,
  Search,
  RefreshCw,
  Download,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Send,
  Heart,
  Sliders,
  FileCode,
  Calendar,
  MessageSquare,
  AlertTriangle,
  Music,
  MapPin,
  Smile,
  ShieldCheck
} from 'lucide-react';
import { StoredResponse, AppConfig } from '../types';
import {
  loginAdmin,
  fetchAdminResponses,
  deleteAdminResponse,
  fetchAdminConfig,
  saveAdminConfig,
  testWebhookUrl
} from '../services/submissionService';

interface Props {
  onClose: () => void;
  onConfigUpdated: (cfg: AppConfig) => void;
}

export const AdminDashboard: React.FC<Props> = ({ onClose, onConfigUpdated }) => {
  const [token, setToken] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Tabs: 'responses' | 'sheets' | 'customize'
  const [activeTab, setActiveTab] = useState<'responses' | 'sheets' | 'customize'>('responses');

  // Responses state
  const [responses, setResponses] = useState<StoredResponse[]>([]);
  const [stats, setStats] = useState<{ total: number; latestDate: string | null; configuredSheets: boolean }>({
    total: 0,
    latestDate: null,
    configuredSheets: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Config state
  const [config, setConfig] = useState<AppConfig>({
    girlfriendName: 'My Love',
    yourName: 'Yours Forever',
    welcomeMessage: '',
    surpriseMessage: '',
    thankYouMessage: '',
    googleAppsScriptUrl: '',
    adminPin: 'love2026'
  });
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Webhook Test state
  const [testWebhookUrlInput, setTestWebhookUrlInput] = useState('');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Check saved session
  useEffect(() => {
    const savedToken = sessionStorage.getItem('romantic_admin_token');
    if (savedToken) {
      setToken(savedToken);
      loadAdminData(savedToken);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);

    try {
      const res = await loginAdmin(pinInput);
      if (res.success && res.token) {
        setToken(res.token);
        sessionStorage.setItem('romantic_admin_token', res.token);
        await loadAdminData(res.token);
      } else {
        setAuthError(res.error || 'Incorrect PIN. Default is "love2026".');
      }
    } catch {
      setAuthError('Error communicating with authentication server.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('romantic_admin_token');
    setToken(null);
    setPinInput('');
  };

  const loadAdminData = async (activeTok: string) => {
    setIsLoading(true);
    try {
      const data = await fetchAdminResponses(activeTok);
      setResponses(data.responses || []);
      setStats(data.stats || { total: 0, latestDate: null, configuredSheets: false });

      const cfg = await fetchAdminConfig(activeTok);
      if (cfg) {
        setConfig(cfg);
        setTestWebhookUrlInput(cfg.googleAppsScriptUrl || '');
      }
    } catch (err) {
      console.error('Error loading admin responses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to delete this submission?')) return;

    const ok = await deleteAdminResponse(id, token);
    if (ok) {
      setResponses((prev) => prev.filter((r) => r.id !== id && r.submissionId !== id));
      setStats((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setConfigSaving(true);
    setConfigSuccess(false);

    const ok = await saveAdminConfig(config, token);
    if (ok) {
      setConfigSuccess(true);
      onConfigUpdated(config);
      setTimeout(() => setConfigSuccess(false), 3000);
    }
    setConfigSaving(false);
  };

  const handleTestWebhook = async () => {
    if (!token) return;
    setIsTestingWebhook(true);
    setWebhookTestResult(null);

    const result = await testWebhookUrl(testWebhookUrlInput, token);
    setWebhookTestResult(result);
    setIsTestingWebhook(false);
  };

  const handleExportCSV = () => {
    if (responses.length === 0) return;

    const headers = [
      'Submission ID',
      'Date & Time',
      'Girlfriend Name',
      'Best Memory',
      'Dream Destination',
      'Cute Habit',
      'Our Song',
      'Final Message',
      'Status'
    ];

    const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;

    const rows = responses.map((r) => [
      escapeCsv(r.submissionId),
      escapeCsv(r.submissionDate),
      escapeCsv(r.girlfriendName),
      escapeCsv(r.bestMemory),
      escapeCsv(r.dreamDestination),
      escapeCsv(r.cuteHabit),
      escapeCsv(r.ourSong),
      escapeCsv(r.finalMessage),
      escapeCsv(r.status)
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `proposal_responses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const appsScriptCode = `/**
 * ROMANTIC PROPOSAL WEB APP - GOOGLE APPS SCRIPT
 * Paste this in Google Sheets > Extensions > Apps Script
 */
const SHEET_TAB_NAME = "Responses";
const HEADERS = [
  "Submission ID",
  "Submission Date and Time",
  "Girlfriend Name",
  "Best Memory",
  "Dream Destination",
  "Cute Habit",
  "Our Song",
  "Final Message",
  "Submission Status"
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Busy" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_TAB_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_TAB_NAME);
      sheet.appendRow(HEADERS);
      const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#0d0d1a");
      headerRange.setFontColor("#ff007f");
      sheet.setFrozenRows(1);
    }

    function sanitize(v) {
      if (!v) return "";
      let s = String(v).trim();
      if (/^[=+\\-@]/.test(s)) s = "'" + s;
      return s;
    }

    sheet.appendRow([
      sanitize(data.submissionId),
      sanitize(data.submissionDate || new Date().toLocaleString()),
      sanitize(data.girlfriendName || "My Love"),
      sanitize(data.bestMemory),
      sanitize(data.dreamDestination),
      sanitize(data.cuteHabit),
      sanitize(data.ourSong),
      sanitize(data.finalMessage),
      sanitize(data.status || "Submitted with Love ❤️")
    ]);

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Saved!" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}`;

  const copyAppsScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Filter responses
  const filteredResponses = responses
    .filter((r) => {
      const q = searchQuery.toLowerCase();
      return (
        r.girlfriendName?.toLowerCase().includes(q) ||
        r.bestMemory?.toLowerCase().includes(q) ||
        r.dreamDestination?.toLowerCase().includes(q) ||
        r.cuteHabit?.toLowerCase().includes(q) ||
        r.ourSong?.toLowerCase().includes(q) ||
        r.finalMessage?.toLowerCase().includes(q) ||
        r.submissionId?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

  // Login view if not authenticated
  if (!token) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0d0d1a]/95 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-card rounded-3xl p-8 border border-[#ff007f]/40 neon-glow-box text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-pink-300/60 hover:text-pink-100 text-xs px-2.5 py-1 rounded-full bg-white/5"
          >
            ✕ Close
          </button>

          <div className="w-14 h-14 rounded-full bg-[#ff007f]/15 border border-[#ff007f]/40 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-[#ff007f]" />
          </div>

          <h2 className="text-2xl font-dancing font-bold text-white neon-glow-text">
            Private Admin Dashboard
          </h2>
          <p className="text-xs text-pink-200/70 mt-1 mb-6">
            Enter your secret PIN to access your girlfriend's private answers.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter PIN (default: love2026)"
                autoFocus
                required
                className="w-full p-3.5 text-center text-base rounded-2xl bg-black/50 border border-[#ff007f]/40 text-pink-50 placeholder:text-pink-300/30 focus:outline-none focus:border-[#ff007f] tracking-widest"
              />
            </div>

            {authError && (
              <p className="text-xs text-pink-400 bg-pink-950/40 p-2 rounded-xl border border-pink-500/30">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 rounded-full bg-[#ff007f] hover:bg-[#e60073] active:scale-95 text-white font-semibold text-sm tracking-wider transition-all duration-200 neon-glow-box shadow-[0_0_20px_rgba(255,0,127,0.4)] cursor-pointer disabled:opacity-50"
            >
              {isAuthenticating ? 'Unlocking...' : 'Unlock Dashboard 🔑'}
            </button>
          </form>

          <p className="text-[11px] text-pink-300/40 mt-6">
            Default security code is <code className="text-[#ff007f]">love2026</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0d0d1a] overflow-y-auto">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#120e24]/90 backdrop-blur-md border-b border-[#ff007f]/20 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#ff007f]/20 border border-[#ff007f]/50 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-[#ff007f]" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Admin Portal</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ff007f]/20 text-[#ff007f] border border-[#ff007f]/30">
                Private
              </span>
            </h1>
            <p className="text-[11px] text-pink-200/60 hidden sm:block">
              Viewing responses from {config.girlfriendName || 'Girlfriend'}
            </p>
          </div>
        </div>

        {/* Tab Switcher & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setActiveTab('responses')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'responses'
                ? 'bg-[#ff007f] text-white shadow-[0_0_12px_rgba(255,0,127,0.4)]'
                : 'text-pink-200/70 hover:bg-white/5'
            }`}
          >
            Responses ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'sheets'
                ? 'bg-[#ff007f] text-white shadow-[0_0_12px_rgba(255,0,127,0.4)]'
                : 'text-pink-200/70 hover:bg-white/5'
            }`}
          >
            Google Sheets
          </button>
          <button
            onClick={() => setActiveTab('customize')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'customize'
                ? 'bg-[#ff007f] text-white shadow-[0_0_12px_rgba(255,0,127,0.4)]'
                : 'text-pink-200/70 hover:bg-white/5'
            }`}
          >
            Customize
          </button>

          <button
            onClick={handleLogout}
            title="Log out of admin"
            className="p-2 rounded-xl text-pink-300/70 hover:text-pink-100 hover:bg-white/5"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-pink-100"
          >
            View Live Site
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ================= TAB 1: RESPONSES ================= */}
        {activeTab === 'responses' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card rounded-2xl p-5 border border-[#ff007f]/30">
                <p className="text-xs text-pink-300/70">Total Submissions</p>
                <p className="text-3xl font-bold text-white mt-1 font-montserrat">
                  {stats.total}
                </p>
                <p className="text-[11px] text-pink-300/50 mt-1">
                  Heartfelt responses received
                </p>
              </div>

              <div className="glass-card rounded-2xl p-5 border border-[#ff007f]/30">
                <p className="text-xs text-pink-300/70">Latest Response</p>
                <p className="text-base font-semibold text-pink-100 mt-2 truncate">
                  {stats.latestDate || 'No submissions yet'}
                </p>
                <p className="text-[11px] text-pink-300/50 mt-1">
                  Saved with server timestamp
                </p>
              </div>

              <div className="glass-card rounded-2xl p-5 border border-[#ff007f]/30">
                <p className="text-xs text-pink-300/70">Google Sheets Connection</p>
                <p className="text-base font-semibold text-pink-100 mt-2 flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      config.googleAppsScriptUrl ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <span>{config.googleAppsScriptUrl ? 'Connected' : 'Local Storage Only'}</span>
                </p>
                <p className="text-[11px] text-pink-300/50 mt-1">
                  {config.googleAppsScriptUrl
                    ? 'Forwarding to Google Sheet tab'
                    : 'Click "Google Sheets" tab to connect'}
                </p>
              </div>
            </div>

            {/* Filter & Action Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#161023]/60 p-4 rounded-2xl border border-[#ff007f]/20">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-pink-300/50 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search responses..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-[#ff007f]/30 text-xs text-pink-100 placeholder:text-pink-300/40 focus:outline-none focus:border-[#ff007f]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-pink-200/80 font-medium border border-white/10 flex items-center gap-1.5"
                >
                  <span>Sort: {sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
                </button>

                <button
                  onClick={() => loadAdminData(token!)}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-pink-200/80 border border-white/10"
                  title="Refresh responses"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={handleExportCSV}
                  disabled={responses.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-[#ff007f]/20 hover:bg-[#ff007f]/30 border border-[#ff007f]/40 text-[#ff007f] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Submissions List */}
            {isLoading ? (
              <div className="text-center py-16 space-y-3">
                <RefreshCw className="w-8 h-8 text-[#ff007f] animate-spin mx-auto" />
                <p className="text-sm text-pink-200/70">Loading responses...</p>
              </div>
            ) : filteredResponses.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center border border-[#ff007f]/20 space-y-3">
                <Heart className="w-12 h-12 text-pink-400/40 mx-auto" />
                <h3 className="text-lg font-semibold text-white">No submissions yet</h3>
                <p className="text-xs text-pink-200/60 max-w-sm mx-auto">
                  When your girlfriend opens the website and completes the 5 questions, her answers will appear right here in real-time!
                </p>
                <div className="pt-2">
                  <button
                    onClick={onClose}
                    className="px-5 py-2 rounded-full bg-[#ff007f] text-white text-xs font-medium"
                  >
                    Open Girlfriend Experience to Test
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredResponses.map((item) => {
                  const isExpanded = expandedId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="glass-card rounded-2xl p-5 border border-[#ff007f]/30 hover:border-[#ff007f]/60 transition-all duration-200 space-y-4"
                    >
                      {/* Summary Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#ff007f]/20 border border-[#ff007f]/50 flex items-center justify-center shrink-0">
                            <Heart className="w-5 h-5 text-[#ff007f] fill-current" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-bold text-white">
                                {item.girlfriendName || 'My Love'}
                              </h4>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {item.status || 'Submitted'}
                              </span>
                            </div>
                            <p className="text-xs text-pink-300/60 flex items-center gap-2 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              <span>{item.submissionDate}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono text-[10px]">{item.submissionId}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-pink-100 border border-white/10"
                          >
                            {isExpanded ? 'Hide Details' : 'Read All Answers ❤️'}
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-xl text-pink-400/60 hover:text-red-400 hover:bg-white/5"
                            title="Delete submission"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Snippet / Expanded Answers */}
                      {isExpanded ? (
                        <div className="pt-3 border-t border-[#ff007f]/20 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {/* Q1: Best Memory */}
                          <div className="bg-black/40 p-4 rounded-xl border border-pink-500/20 space-y-1">
                            <p className="font-semibold text-[#ff007f] flex items-center gap-1.5">
                              <Smile className="w-3.5 h-3.5" />
                              <span>1. Special Memory With Me:</span>
                            </p>
                            <p className="text-pink-100 leading-relaxed whitespace-pre-wrap">
                              {item.bestMemory || '—'}
                            </p>
                          </div>

                          {/* Q2: Dream Destination */}
                          <div className="bg-black/40 p-4 rounded-xl border border-pink-500/20 space-y-1">
                            <p className="font-semibold text-[#ff007f] flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>2. Weekend Escape Destination:</span>
                            </p>
                            <p className="text-pink-100 leading-relaxed whitespace-pre-wrap">
                              {item.dreamDestination || '—'}
                            </p>
                          </div>

                          {/* Q3: Cute Habit */}
                          <div className="bg-black/40 p-4 rounded-xl border border-pink-500/20 space-y-1">
                            <p className="font-semibold text-[#ff007f] flex items-center gap-1.5">
                              <Smile className="w-3.5 h-3.5" />
                              <span>3. Cute Annoying Habit:</span>
                            </p>
                            <p className="text-pink-100 leading-relaxed whitespace-pre-wrap">
                              {item.cuteHabit || '—'}
                            </p>
                          </div>

                          {/* Q4: Our Song */}
                          <div className="bg-black/40 p-4 rounded-xl border border-pink-500/20 space-y-1">
                            <p className="font-semibold text-[#ff007f] flex items-center gap-1.5">
                              <Music className="w-3.5 h-3.5" />
                              <span>4. Our Special Song:</span>
                            </p>
                            <p className="text-pink-100 leading-relaxed whitespace-pre-wrap">
                              {item.ourSong || '—'}
                            </p>
                          </div>

                          {/* Q5: Final Message from heart (Full width) */}
                          <div className="md:col-span-2 bg-[#ff007f]/10 p-5 rounded-2xl border border-[#ff007f]/30 space-y-2">
                            <p className="font-bold text-[#ff007f] text-sm flex items-center gap-2">
                              <Heart className="w-4 h-4 fill-current" />
                              <span>5. Her Heart's Message:</span>
                            </p>
                            <p className="text-pink-50 text-sm leading-relaxed whitespace-pre-wrap font-light italic">
                              "{item.finalMessage || '—'}"
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-pink-200/80 line-clamp-2 italic pt-1">
                          "{item.finalMessage || item.bestMemory || 'Tap to expand answers'}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: GOOGLE SHEETS ================= */}
        {activeTab === 'sheets' && (
          <div className="space-y-6">
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#ff007f]/30 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Google Sheets Integration</span>
                  <span className="text-xs text-[#ff007f] border border-[#ff007f]/30 px-2.5 py-0.5 rounded-full bg-[#ff007f]/10">
                    Auto-Sync
                  </span>
                </h3>
                <p className="text-xs text-pink-200/70 mt-1 leading-relaxed">
                  Connect your Google Spreadsheet to automatically receive all girlfriend responses in a dedicated "Responses" tab with columns for every question.
                </p>
              </div>

              {/* Webhook URL Input & Test */}
              <div className="space-y-3 bg-black/40 p-5 rounded-2xl border border-[#ff007f]/20">
                <label className="block text-xs font-semibold text-pink-200">
                  Google Apps Script Web App URL:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={testWebhookUrlInput}
                    onChange={(e) => setTestWebhookUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="flex-1 p-3 rounded-xl bg-black/60 border border-[#ff007f]/30 text-xs text-pink-50 placeholder:text-pink-300/30 focus:outline-none focus:border-[#ff007f]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const updated = { ...config, googleAppsScriptUrl: testWebhookUrlInput.trim() };
                        setConfig(updated);
                        await saveAdminConfig(updated, token!);
                        onConfigUpdated(updated);
                        alert('Google Apps Script URL saved!');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white whitespace-nowrap"
                    >
                      Save URL
                    </button>
                    <button
                      type="button"
                      disabled={isTestingWebhook || !testWebhookUrlInput.trim()}
                      onClick={handleTestWebhook}
                      className="px-4 py-2.5 rounded-xl bg-[#ff007f] hover:bg-[#e60073] text-xs font-semibold text-white whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isTestingWebhook ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Test Ping</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {webhookTestResult && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      webhookTestResult.success
                        ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                        : 'bg-red-950/60 border border-red-500/40 text-red-300'
                    }`}
                  >
                    {webhookTestResult.success ? (
                      <Check className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{webhookTestResult.message}</span>
                  </div>
                )}
              </div>

              {/* Instructions Guide */}
              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-semibold text-white">
                  3-Minute Setup Instructions:
                </h4>
                <ol className="list-decimal list-inside space-y-2.5 text-xs text-pink-200/80 leading-relaxed">
                  <li>
                    Create a new Google Sheet at{' '}
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#ff007f] underline font-medium"
                    >
                      sheets.new
                    </a>
                  </li>
                  <li>In the top menu, go to <strong>Extensions &gt; Apps Script</strong>.</li>
                  <li>Delete any existing code in the editor, then paste the script below.</li>
                  <li>Click <strong>Deploy &gt; New deployment</strong>.</li>
                  <li>
                    Select type: <strong>Web app</strong>. Set Execute as: <strong>Me</strong> and Who has access: <strong>Anyone</strong>.
                  </li>
                  <li>Click <strong>Deploy</strong>, authorize permissions, and copy the <strong>Web app URL</strong>.</li>
                  <li>Paste the Web App URL into the box above and click <strong>Save URL</strong>!</li>
                </ol>
              </div>

              {/* Code Box with One-Click Copy */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-pink-200">
                    Apps Script Code (Code.gs):
                  </span>
                  <button
                    onClick={copyAppsScript}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#ff007f]/20 hover:bg-[#ff007f]/30 border border-[#ff007f]/40 text-xs text-[#ff007f]"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-black/70 border border-white/10 text-[11px] font-mono text-pink-200/90 overflow-x-auto max-h-64 scrollbar-thin">
                  {appsScriptCode}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: CUSTOMIZE ================= */}
        {activeTab === 'customize' && (
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#ff007f]/30 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#ff007f]" />
                <span>Personalize Your Proposal</span>
              </h3>
              <p className="text-xs text-pink-200/70 mt-1">
                Customize her name, your signature, and the romantic messages displayed on the website.
              </p>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-pink-200 mb-1">
                    Girlfriend's Name:
                  </label>
                  <input
                    type="text"
                    value={config.girlfriendName}
                    onChange={(e) => setConfig({ ...config, girlfriendName: e.target.value })}
                    placeholder="e.g. Priyu / Sofia / My Love"
                    className="w-full p-3 rounded-xl bg-black/50 border border-[#ff007f]/30 text-xs text-pink-50 focus:outline-none focus:border-[#ff007f]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pink-200 mb-1">
                    Your Name (Signature):
                  </label>
                  <input
                    type="text"
                    value={config.yourName}
                    onChange={(e) => setConfig({ ...config, yourName: e.target.value })}
                    placeholder="e.g. Yours Forever / Rahul"
                    className="w-full p-3 rounded-xl bg-black/50 border border-[#ff007f]/30 text-xs text-pink-50 focus:outline-none focus:border-[#ff007f]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-pink-200 mb-1">
                  Screen 1 Welcome Message:
                </label>
                <textarea
                  rows={3}
                  value={config.welcomeMessage}
                  onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                  className="w-full p-3 rounded-xl bg-black/50 border border-[#ff007f]/30 text-xs text-pink-50 focus:outline-none focus:border-[#ff007f] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-pink-200 mb-1">
                  Screen 2 Surprise Intro Message:
                </label>
                <textarea
                  rows={3}
                  value={config.surpriseMessage}
                  onChange={(e) => setConfig({ ...config, surpriseMessage: e.target.value })}
                  className="w-full p-3 rounded-xl bg-black/50 border border-[#ff007f]/30 text-xs text-pink-50 focus:outline-none focus:border-[#ff007f] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-pink-200 mb-1">
                  Screen 8 Final Thank You Message:
                </label>
                <textarea
                  rows={3}
                  value={config.thankYouMessage}
                  onChange={(e) => setConfig({ ...config, thankYouMessage: e.target.value })}
                  className="w-full p-3 rounded-xl bg-black/50 border border-[#ff007f]/30 text-xs text-pink-50 focus:outline-none focus:border-[#ff007f] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-pink-200 mb-1">
                  Change Admin PIN:
                </label>
                <input
                  type="text"
                  value={config.adminPin || ''}
                  onChange={(e) => setConfig({ ...config, adminPin: e.target.value })}
                  placeholder="e.g. love2026"
                  className="w-full sm:w-64 p-3 rounded-xl bg-black/50 border border-[#ff007f]/30 text-xs text-pink-50 focus:outline-none focus:border-[#ff007f]"
                />
              </div>

              {configSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Personalization settings saved successfully!</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={configSaving}
                  className="px-6 py-3 rounded-full bg-[#ff007f] hover:bg-[#e60073] text-white font-semibold text-xs tracking-wider transition-all duration-200 neon-glow-box shadow-[0_0_20px_rgba(255,0,127,0.4)] cursor-pointer disabled:opacity-50"
                >
                  {configSaving ? 'Saving...' : 'Save Settings 💖'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
