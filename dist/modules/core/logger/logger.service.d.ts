export type LogLevel = 'log' | 'warn' | 'error' | 'debug';
export type LogMeta = {
    userId?: string | null;
    schoolId?: string | null;
    loggerId?: string;
    [key: string]: unknown;
};
export declare class AppLoggerService {
    private readonly sensitiveKeys;
    private sanitizeValue;
    private format;
    log(context: string, message: string, meta?: LogMeta): void;
    warn(context: string, message: string, meta?: LogMeta): void;
    error(context: string, message: string, meta?: LogMeta): void;
    debug(context: string, message: string, meta?: LogMeta): void;
}
