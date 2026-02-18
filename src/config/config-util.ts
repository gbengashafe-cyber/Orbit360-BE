import config from 'config';

const getConfigValue = <T>(key: string, fallback: T): T => {
  try {
    return config.get<T>(key);
  } catch {
    return fallback;
  }
};

export const configUtil = {
  ldapsUrl: () => getConfigValue<string>('ldapsUrl', 'ldaps://domain.com:639'),
  tokenExpiryAccess: () => getConfigValue<number>('tokenExpiry.access', 1200),
  tokenExpiryRefresh: () => getConfigValue<number>('tokenExpiry.refresh', 86400),
  allowedOrigins: () => getConfigValue<string[]>('allowedOrigins', ['*']),
  payrollReportStoragePath: () => getConfigValue<string>('payrollReport.storagePath', 'payroll-reports'),
  payrollReportMaxFileSizeInMB: () => getConfigValue<number>('payrollReport.maxFileSizeInMB', 5),
  payrollReportStorageServer: () => getConfigValue<string>('payrollReport.storageServer', 'https://localhost:3000/'),
};
