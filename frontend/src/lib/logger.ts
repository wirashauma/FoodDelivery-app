/**
 * Frontend Logger Utility
 * Centralized logging system for debugging and error tracking
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
  stack?: string;
}

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  maxLogs: number;
  persistToStorage: boolean;
  consoleOutput: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '#9CA3AF', // gray
  info: '#3B82F6',  // blue
  warn: '#F59E0B',  // amber
  error: '#EF4444', // red
};

const LOG_ICONS: Record<LogLevel, string> = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
};

class Logger {
  private logs: LogEntry[] = [];
  private config: LoggerConfig = {
    enabled: process.env.NODE_ENV !== 'production',
    minLevel: 'debug',
    maxLogs: 500,
    persistToStorage: true,
    consoleOutput: true,
  };

  private static instance: Logger;

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    return this.config.enabled && LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private createEntry(level: LogLevel, category: string, message: string, data?: unknown): LogEntry {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      category,
      message,
      data,
    };

    if (level === 'error' && data instanceof Error) {
      entry.stack = data.stack;
    }

    return entry;
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.config.maxLogs) {
      this.logs = this.logs.slice(-this.config.maxLogs);
    }

    if (this.config.persistToStorage) {
      this.saveToStorage();
    }

    if (this.config.consoleOutput) {
      this.printToConsole(entry);
    }
  }

  private printToConsole(entry: LogEntry): void {
    const icon = LOG_ICONS[entry.level];
    const color = LOG_COLORS[entry.level];
    const prefix = `${icon} [${entry.timestamp}] [${entry.category}]`;

    const style = `color: ${color}; font-weight: bold;`;
    const resetStyle = 'color: inherit; font-weight: normal;';

    if (entry.data !== undefined) {
      console.groupCollapsed(`%c${prefix}%c ${entry.message}`, style, resetStyle);
      console.log('Data:', entry.data);
      if (entry.stack) {
        console.log('Stack:', entry.stack);
      }
      console.groupEnd();
    } else {
      console.log(`%c${prefix}%c ${entry.message}`, style, resetStyle);
    }
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('app_logs', JSON.stringify(this.logs.slice(-100)));
      } catch (e) {
        // Storage might be full or disabled
      }
    }
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('app_logs');
        if (stored) {
          this.logs = JSON.parse(stored);
        }
      } catch (e) {
        // Invalid or no data
      }
    }
  }

  // Main logging methods
  debug(category: string, message: string, data?: unknown): void {
    if (this.shouldLog('debug')) {
      this.addLog(this.createEntry('debug', category, message, data));
    }
  }

  info(category: string, message: string, data?: unknown): void {
    if (this.shouldLog('info')) {
      this.addLog(this.createEntry('info', category, message, data));
    }
  }

  warn(category: string, message: string, data?: unknown): void {
    if (this.shouldLog('warn')) {
      this.addLog(this.createEntry('warn', category, message, data));
    }
  }

  error(category: string, message: string, data?: unknown): void {
    if (this.shouldLog('error')) {
      this.addLog(this.createEntry('error', category, message, data));
    }
  }

  // Category-specific loggers
  auth = {
    debug: (message: string, data?: unknown) => this.debug('AUTH', message, data),
    info: (message: string, data?: unknown) => this.info('AUTH', message, data),
    warn: (message: string, data?: unknown) => this.warn('AUTH', message, data),
    error: (message: string, data?: unknown) => this.error('AUTH', message, data),
  };

  api = {
    debug: (message: string, data?: unknown) => this.debug('API', message, data),
    info: (message: string, data?: unknown) => this.info('API', message, data),
    warn: (message: string, data?: unknown) => this.warn('API', message, data),
    error: (message: string, data?: unknown) => this.error('API', message, data),
  };

  navigation = {
    debug: (message: string, data?: unknown) => this.debug('NAV', message, data),
    info: (message: string, data?: unknown) => this.info('NAV', message, data),
    warn: (message: string, data?: unknown) => this.warn('NAV', message, data),
    error: (message: string, data?: unknown) => this.error('NAV', message, data),
  };

  component = {
    debug: (message: string, data?: unknown) => this.debug('COMPONENT', message, data),
    info: (message: string, data?: unknown) => this.info('COMPONENT', message, data),
    warn: (message: string, data?: unknown) => this.warn('COMPONENT', message, data),
    error: (message: string, data?: unknown) => this.error('COMPONENT', message, data),
  };

  cart = {
    debug: (message: string, data?: unknown) => this.debug('CART', message, data),
    info: (message: string, data?: unknown) => this.info('CART', message, data),
    warn: (message: string, data?: unknown) => this.warn('CART', message, data),
    error: (message: string, data?: unknown) => this.error('CART', message, data),
  };

  order = {
    debug: (message: string, data?: unknown) => this.debug('ORDER', message, data),
    info: (message: string, data?: unknown) => this.info('ORDER', message, data),
    warn: (message: string, data?: unknown) => this.warn('ORDER', message, data),
    error: (message: string, data?: unknown) => this.error('ORDER', message, data),
  };

  socket = {
    debug: (message: string, data?: unknown) => this.debug('SOCKET', message, data),
    info: (message: string, data?: unknown) => this.info('SOCKET', message, data),
    warn: (message: string, data?: unknown) => this.warn('SOCKET', message, data),
    error: (message: string, data?: unknown) => this.error('SOCKET', message, data),
  };

  // Utility methods
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  getErrorLogs(): LogEntry[] {
    return this.getLogsByLevel('error');
  }

  clearLogs(): void {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('app_logs');
    }
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  downloadLogs(): void {
    if (typeof window !== 'undefined') {
      const blob = new Blob([this.exportLogs()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `app-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  // Summary for quick overview
  getSummary(): { total: number; byLevel: Record<LogLevel, number>; byCategory: Record<string, number> } {
    const byLevel: Record<LogLevel, number> = { debug: 0, info: 0, warn: 0, error: 0 };
    const byCategory: Record<string, number> = {};

    this.logs.forEach(log => {
      byLevel[log.level]++;
      byCategory[log.category] = (byCategory[log.category] || 0) + 1;
    });

    return {
      total: this.logs.length,
      byLevel,
      byCategory,
    };
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export for direct use
export default logger;

// Helper function to wrap async operations with logging
export async function withLogging<T>(
  category: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  logger.debug(category, `Starting: ${operation}`);

  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    logger.info(category, `Completed: ${operation}`, { duration: `${duration}ms` });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(category, `Failed: ${operation}`, { error, duration: `${duration}ms` });
    throw error;
  }
}
