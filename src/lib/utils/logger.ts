/**
 * Development logging utility
 * Provides conditional logging based on environment
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
  component?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private createLogEntry(level: LogLevel, message: string, data?: any, component?: string): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
    };
    
    if (component !== undefined) {
      entry.component = component;
    }
    
    return entry;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.isDevelopment) {
      // In production, only log errors and warnings
      return level === 'error' || level === 'warn';
    }
    return true;
  }

  private addToHistory(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  debug(message: string, data?: any, component?: string): void {
    if (!this.shouldLog('debug')) return;
    
    const entry = this.createLogEntry('debug', message, data, component);
    this.addToHistory(entry);
    
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.debug(`[${component || 'APP'}] ${message}`, data || '');
    }
  }

  info(message: string, data?: any, component?: string): void {
    if (!this.shouldLog('info')) return;
    
    const entry = this.createLogEntry('info', message, data, component);
    this.addToHistory(entry);
    
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.info(`[${component || 'APP'}] ${message}`, data || '');
    }
  }

  warn(message: string, data?: any, component?: string): void {
    if (!this.shouldLog('warn')) return;
    
    const entry = this.createLogEntry('warn', message, data, component);
    this.addToHistory(entry);
    
    // eslint-disable-next-line no-console
    console.warn(`[${component || 'APP'}] ${message}`, data || '');
  }

  error(message: string, data?: any, component?: string): void {
    if (!this.shouldLog('error')) return;
    
    const entry = this.createLogEntry('error', message, data, component);
    this.addToHistory(entry);
    
    // eslint-disable-next-line no-console
    console.error(`[${component || 'APP'}] ${message}`, data || '');
  }

  // Get recent logs for debugging
  getRecentLogs(count = 10): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Clear log history
  clearLogs(): void {
    this.logs = [];
  }

  // Get logs by level
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Export logs (useful for bug reports)
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create singleton instance
export const logger = new Logger();

// Development-only logging helpers
export const devLog = {
  component: (componentName: string) => ({
    debug: (message: string, data?: any) => logger.debug(message, data, componentName),
    info: (message: string, data?: any) => logger.info(message, data, componentName),
    warn: (message: string, data?: any) => logger.warn(message, data, componentName),
    error: (message: string, data?: any) => logger.error(message, data, componentName),
  }),
};

// Quick access functions
export const logDebug = (message: string, data?: any, component?: string) => 
  logger.debug(message, data, component);
export const logInfo = (message: string, data?: any, component?: string) => 
  logger.info(message, data, component);
export const logWarn = (message: string, data?: any, component?: string) => 
  logger.warn(message, data, component);
export const logError = (message: string, data?: any, component?: string) => 
  logger.error(message, data, component);