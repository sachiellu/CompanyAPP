import type { Company } from '../companies/types';

export enum EmployeeStatus {
    Unregistered = 0,
    Active = 1,
    Disabled = 2
}

export interface Employee {
    id: number;
    staffId: string;
    name: string;
    position?: string;
    email?: string;
    status: EmployeeStatus;  // 狀態 (當下狀態)
    userId?: string;
    companyId: number;
    company?: Company;

    companyName?: string;    // 所屬廠商名稱 (問號代表選填)
    processStatus?: string;  // 後續處理狀態 (例如：待交接)
}

export interface RowReport {
    rowNumber: number;
    name: string;
    email: string;
    status: string;
    message: string;
}

export interface ImportResult {
    successCount: number;
    reports: RowReport[]; 
}