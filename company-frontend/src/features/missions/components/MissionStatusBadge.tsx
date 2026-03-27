import React from 'react';

const MISSION_STATUS = {
    Pending: 0,
    Progress: 1,
    Completed: 2,
    Delayed: 3
} as const;

interface Props {
    status: number | string;
}

export const MissionStatusBadge: React.FC<Props> = ({ status }) => {
    const s = Number(status);

    const configs: Record<number, { label: string; cls: string }> = {

        [MISSION_STATUS.Pending]: { label: '測試', cls: 'bg-secondary  text-white opacity-100' },
        [MISSION_STATUS.Progress]: { label: '執行中', cls: 'bg-primary text-white opacity-100' },
        [MISSION_STATUS.Completed]: { label: '已完工', cls: 'bg-success text-white opacity-100' },
        [MISSION_STATUS.Delayed]: { label: '已延遲', cls: 'bg-danger text-white opacity-100' },
    };

    const config = configs[s] || { label: '未知', cls: 'bg-dark text-white' };

    return (
        <span className={`badge ${config.cls}`}>
            {config.label}
        </span>
    );
};