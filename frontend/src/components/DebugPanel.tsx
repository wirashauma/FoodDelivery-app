'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  data?: unknown;
  stack?: string;
}

const LOG_COLORS = {
  debug: 'text-gray-400 bg-gray-900/50',
  info: 'text-blue-400 bg-blue-900/30',
  warn: 'text-amber-400 bg-amber-900/30',
  error: 'text-red-400 bg-red-900/30',
};

const LOG_BADGES = {
  debug: 'bg-gray-600',
  info: 'bg-blue-600',
  warn: 'bg-amber-600',
  error: 'bg-red-600',
};

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const updateLogs = () => {
      setLogs(logger.getRecentLogs(100));
    };

    updateLogs();

    if (autoRefresh) {
      const interval = setInterval(updateLogs, 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const filteredLogs = logs.filter((log) => {
    const categoryMatch = filter === 'all' || log.category === filter;
    const levelMatch = levelFilter === 'all' || log.level === levelFilter;
    return categoryMatch && levelMatch;
  });

  const categories = [...new Set(logs.map((log) => log.category))];
  const summary = logger.getSummary();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
      >
        <span className="text-lg">🐛</span>
        <span>Debug</span>
        {summary.byLevel.error > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            {summary.byLevel.error}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="h-full flex flex-col bg-gray-900 text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>🐛</span> Debug Panel
            </h2>
            <div className="flex gap-2 text-sm">
              <span className="bg-gray-600 px-2 py-1 rounded">
                Total: {summary.total}
              </span>
              <span className="bg-blue-600 px-2 py-1 rounded">
                Info: {summary.byLevel.info}
              </span>
              <span className="bg-amber-600 px-2 py-1 rounded">
                Warn: {summary.byLevel.warn}
              </span>
              <span className="bg-red-600 px-2 py-1 rounded">
                Error: {summary.byLevel.error}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto Refresh
            </label>
            <button
              onClick={() => {
                logger.downloadLogs();
              }}
              className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-sm"
            >
              📥 Download Logs
            </button>
            <button
              onClick={() => {
                logger.clearLogs();
                setLogs([]);
              }}
              className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-sm"
            >
              🗑️ Clear
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 p-4 border-b border-gray-700">
          <div>
            <label className="text-sm text-gray-400 mr-2">Category:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm"
            >
              <option value="all">All</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({summary.byCategory[cat] || 0})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 mr-2">Level:</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm"
            >
              <option value="all">All</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div className="text-sm text-gray-400 self-center">
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-auto p-4 font-mono text-sm">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No logs to display. Try performing some actions.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className={`p-2 rounded cursor-pointer hover:opacity-80 ${LOG_COLORS[log.level]}`}
                  onClick={() => setExpandedLog(expandedLog === index ? null : index)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold uppercase shrink-0 ${LOG_BADGES[log.level]}`}
                    >
                      {log.level}
                    </span>
                    <span className="text-purple-400 shrink-0">[{log.category}]</span>
                    <span className="break-all">{log.message}</span>
                  </div>
                  {expandedLog === index && log.data !== undefined ? (
                    <div className="mt-2 ml-4 p-2 bg-black/50 rounded overflow-auto max-h-60">
                      <pre className="text-xs text-gray-300">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                      {log.stack && (
                        <pre className="text-xs text-red-300 mt-2 border-t border-gray-700 pt-2">
                          {log.stack}
                        </pre>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
          <p>
            💡 Tips: Click on a log entry to expand details. Logs are stored in localStorage and persist across page refreshes.
          </p>
        </div>
      </div>
    </div>
  );
}
