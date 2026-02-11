import React from 'react';
import { EmployeeStatus } from '../types';

export const StatusBadge: React.FC<{ status: EmployeeStatus }> = ({ status }) => {
    const configs = {
        [EmployeeStatus.Unregistered]: { label: '待註冊', cls: 'bg-secondary' },
        [EmployeeStatus.Active]: { label: '已啟動', cls: 'bg-success' },
        [EmployeeStatus.Disabled]: { label: '已停用', cls: 'bg-danger' },
    };
    const config = configs[status] || configs[EmployeeStatus.Unregistered];
    return <span className={`badge ${config.cls}`}>{config.label}</span>;
};