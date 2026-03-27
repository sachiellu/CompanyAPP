import type { Company } from '../companies/types';

export const EmployeeStatus = {
    Unregistered: 0,
    Active: 1,
    Disabled: 2
} as const;

export type EmployeeStatus = typeof EmployeeStatus[keyof typeof EmployeeStatus];

export interface Employee {
    id: number;
    staffId: string;
    name: string;
    position?: string;
    email?: string;
    status: EmployeeStatus; // 這裡會自動對應到 0 | 1 | 2
    userId?: string;
    companyId: number;
    company?: Company;
    companyName?: string;
    processStatus?: string;
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