// src/features/companies/types.ts
import type { Employee } from '../employees/types'; // 引入員工型別

export interface Contact {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    remark?: string;
}

export interface Company {
    id: number;
    name: string;
    taxId?: string;
    industry?: string;
    address?: string;
    logoPath?: string;
    foundedDate?: string;

    Name?: string;     
    Industry?: string;
    Address?: string;
    LogoPath?: string;
    TaxId?: string;
    FoundedDate?: string;

    employees?: Employee[];
    contacts?: Contact[];
}

