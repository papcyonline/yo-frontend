// Centralized Logging Service
import { API_CONFIG } from '../constants/api';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

class LoggingService {
  private sessionId: string;
  private userId: string | null = null;
  private logs: LogEntry[] = [];
  private maxLogSize = 100;
  
  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      userId: this.userId || undefined,
      sessionId: this.sessionId
    };
  }

  private addToBuffer(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogSize) {
      this.logs.shift(); // Remove oldest log
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (__DEV__) {
      return true; // Log everything in development
    }
    
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error';
  }

  debug(message: string, data?: any) {
    const entry = this.createLogEntry('debug', message, data);
    this.addToBuffer(entry);
    
    if (this.shouldLog('debug')) {
      if (data) {
        console.log(`🔍 [DEBUG] ${message}`, data);
      } else {
        console.log(`🔍 [DEBUG] ${message}`);
      }
    }
  }

  info(message: string, data?: any) {
    const entry = this.createLogEntry('info', message, data);
    this.addToBuffer(entry);
    
    if (this.shouldLog('info')) {
      if (data) {
        console.log(`ℹ️ [INFO] ${message}`, data);
      } else {
        console.log(`ℹ️ [INFO] ${message}`);
      }
    }
  }

  warn(message: string, data?: any) {
    const entry = this.createLogEntry('warn', message, data);
    this.addToBuffer(entry);
    
    if (this.shouldLog('warn')) {
      if (data) {
        console.warn(`⚠️ [WARN] ${message}`, data);
      } else {
        console.warn(`⚠️ [WARN] ${message}`);
      }
    }
  }

  error(message: string, error?: any) {
    const entry = this.createLogEntry('error', message, error);
    this.addToBuffer(entry);
    
    if (this.shouldLog('error')) {
      if (error) {
        console.error(`❌ [ERROR] ${message}`, error);
      } else {
        console.error(`❌ [ERROR] ${message}`);
      }
    }

    // In production, consider sending critical errors to a logging service
    if (!__DEV__ && API_CONFIG.ENVIRONMENT === 'production') {
      this.sendErrorToServer(entry);
    }
  }

  private async sendErrorToServer(entry: LogEntry) {
    try {
      // Only send in production and only for errors
      if (entry.level === 'error') {
        // Implement your error reporting service here (e.g., Sentry, LogRocket, etc.)
        // await fetch(`${API_CONFIG.BASE_URL}/logs/error`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(entry)
        // });
      }
    } catch (e) {
      // Fail silently - don't want logging to break the app
      if (__DEV__) {
        console.warn('Failed to send error to server:', e);
      }
    }
  }

  // Network request logging with sensitive data filtering
  logApiRequest(url: string, method: string, headers?: any, body?: any) {
    if (!this.shouldLog('debug')) return;

    const filteredHeaders = this.filterSensitiveData(headers);
    const filteredBody = this.filterSensitiveData(body);

    this.debug(`API Request: ${method} ${url}`, {
      headers: filteredHeaders,
      body: filteredBody
    });
  }

  logApiResponse(url: string, status: number, data?: any) {
    if (!this.shouldLog('debug')) return;

    const filteredData = this.filterSensitiveData(data);
    
    if (status >= 400) {
      this.error(`API Error: ${status} ${url}`, filteredData);
    } else {
      this.debug(`API Response: ${status} ${url}`, filteredData);
    }
  }

  private filterSensitiveData(data: any): any {
    if (!data) return data;
    
    const sensitiveKeys = [
      'password', 'token', 'authorization', 'cookie', 'session',
      'secret', 'key', 'auth', 'bearer', 'api_key', 'apikey'
    ];

    if (typeof data === 'object') {
      const filtered = { ...data };
      
      Object.keys(filtered).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          filtered[key] = '[REDACTED]';
        } else if (typeof filtered[key] === 'object') {
          filtered[key] = this.filterSensitiveData(filtered[key]);
        }
      });
      
      return filtered;
    }
    
    return data;
  }

  // Get logs for debugging (development only)
  getLogs(): LogEntry[] {
    return __DEV__ ? [...this.logs] : [];
  }

  clearLogs() {
    this.logs = [];
  }

  // Performance logging
  startTimer(name: string): () => void {
    if (!this.shouldLog('debug')) return () => {};
    
    const start = performance.now();
    return () => {
      const end = performance.now();
      this.debug(`Performance: ${name} took ${(end - start).toFixed(2)}ms`);
    };
  }
}

// Export singleton instance
export const logger = new LoggingService();

// Convenience methods for common logging patterns
export const logApiCall = (url: string, method: string, headers?: any, body?: any) => {
  logger.logApiRequest(url, method, headers, body);
};

export const logApiResponse = (url: string, status: number, data?: any) => {
  logger.logApiResponse(url, status, data);
};

export default logger;