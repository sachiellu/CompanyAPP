// 直接叫 types.ts 即可，不需要資料夾也不需要 index
export interface AuditLog {
    id: number;
    userId: string;
    userName: string;
    action: string;
    entityName: string;
    keyValues: string;
    changes: string;
    timestamp: string;
}

export interface AuditLogQuery {
    searchTerm?: string;
    action?: string;
    // 預留給分頁或篩選用的型別
}