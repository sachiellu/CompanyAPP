// src/features/missions/types.ts
export interface Mission {
    id: number;
    title: string;
    description: string;
    createDate: string;
    deadline: string;
    status: 'Pending' | 'Progress' | 'Completed' | 'Delayed';
    companyId: number;
    employeeId: number;
    // 顯示用欄位
    companyName?: string;
    employeeName?: string;
}

// 供表單使用的狀態型別
export interface MissionFormData {
    title: string;
    description: string;
    createDate: string;
    deadline: string;
    status: string;
    companyId: string;
    employeeId: string;
}