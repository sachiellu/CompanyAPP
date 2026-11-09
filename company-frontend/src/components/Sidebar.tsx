import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '../features/auth/authApi';

import DashboardSvg from '../assets/icons/Dashboard.svg';
import CompanySvg from '../assets/icons/company.svg';
import EmployeeSvg from '../assets/icons/employee.svg';
import MissionsSvg from '../assets/icons/missions.svg';
import AuthoritySvg from '../assets/icons/Authority.svg';

import EsLogo from '../assets/icons/Logo.svg';

interface MenuItem {
    path: string;
    label: string;
    icon?: string;
    roles: string[];
}

type SidebarProps = {
    open?: boolean;
    onNavigate?: () => void;
};

export default function Sidebar({ open = false, onNavigate }: SidebarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const role = localStorage.getItem('userRole') || "User";
    const isAdmin = role === 'Admin';

    const generalMenuItems: MenuItem[] = [
        { path: '/', label: '系統概覽', icon: DashboardSvg, roles: ['Admin', 'Manager', 'User'] },
        { path: '/companies', label: '廠商總覽', icon: CompanySvg, roles: ['Admin', 'Manager', 'User'] },
        { path: '/employees', label: '員工管理', icon: EmployeeSvg, roles: ['Admin', 'Manager', 'User'] },
        { path: '/missions', label: '任務派工', icon: MissionsSvg, roles: ['Admin', 'Manager', 'User'] },
    ];

    const adminSubItems: MenuItem[] = [
        { path: '/users', label: '帳號權限', roles: ['Admin'] },
        { path: '/audit-logs', label: '系統操作日誌', roles: ['Admin'] },
    ];

    const [isAdminOpen, setIsAdminOpen] = useState(
        location.pathname === '/users' || location.pathname === '/audit-logs'
    );

    const handleLogout = async () => {
        if (!window.confirm("確定要登出系統嗎？")) return;
        try {
            await authApi.logout();
        } catch {
            // Cookie 清不掉也先離開畫面
        }
        localStorage.clear();
        navigate('/login');
    };

    const getIconStyle = (isActive: boolean) => ({
        width: '18px',
        height: '18px',
        filter: 'brightness(0) invert(1)',
        opacity: isActive ? 1 : 0.6,
        transition: 'opacity 0.2s'
    });

    return (
        <aside className={`app-sidebar bg-dark text-white d-flex flex-column border-end border-secondary shadow ${open ? 'is-open' : ''}`}>
            <div className="p-3 border-bottom border-secondary mb-2 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                    <img src={EsLogo} alt="Logo" style={{ width: '28px', height: '28px' }} />
                    <div className="ms-2">
                        <h6 className="fw-bold m-0 text-primary" style={{ fontSize: '14px' }}>企業管理系統</h6>
                        <small className="opacity-50" style={{ fontSize: '8px' }}>Portal v1.0</small>
                    </div>
                </div>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-light d-md-none"
                    aria-label="關閉選單"
                    onClick={onNavigate}
                >
                    <i className="bi bi-x-lg"></i>
                </button>
            </div>

            <div className="nav flex-column px-2 flex-grow-1">
                {generalMenuItems.map(item => {
                    const isActive = location.pathname === item.path;
                    return item.roles.includes(role) && (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={onNavigate}
                            className={`nav-link text-white py-2 px-3 rounded mb-1 d-flex align-items-center ${isActive ? 'active bg-primary' : ''}`}
                        >
                            <img src={item.icon} style={getIconStyle(isActive)} className="me-3" alt="" />
                            <span style={{ fontSize: '13.5px' }} className={isActive ? 'fw-bold' : 'opacity-75'}>{item.label}</span>
                        </Link>
                    );
                })}

                {isAdmin && (
                    <div className="nav-item">
                        <div
                            className="nav-link text-white py-2 px-3 rounded d-flex align-items-center justify-content-between"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setIsAdminOpen(!isAdminOpen)}
                        >
                            <div className="d-flex align-items-center">
                                <img src={AuthoritySvg} style={getIconStyle(isAdminOpen)} className="me-3" alt="" />
                                <span style={{ fontSize: '13.5px' }} className="opacity-75">權限與安全</span>
                            </div>
                            <i className={`bi bi-chevron-${isAdminOpen ? 'down' : 'right'} small opacity-50`}></i>
                        </div>

                        <div style={{
                            maxHeight: isAdminOpen ? '100px' : '0',
                            overflow: 'hidden',
                            transition: 'max-height 0.3s ease-in-out'
                        }}>
                            {adminSubItems.map(sub => {
                                const isActive = location.pathname === sub.path;
                                return (
                                    <Link
                                        key={sub.path}
                                        to={sub.path}
                                        onClick={onNavigate}
                                        className={`nav-link text-white py-2 px-3 d-flex align-items-center ${isActive ? 'text-primary fw-bold' : 'opacity-50'}`}
                                    >
                                        <div style={{ width: '18px' }} className="me-3"></div>
                                        <span style={{ fontSize: '13px' }}>{sub.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-3 border-top border-secondary mt-auto bg-dark bg-opacity-50">
                <button onClick={handleLogout} className="btn btn-outline-danger w-100 py-2 btn-sm">
                    <i className="bi bi-box-arrow-left me-2"></i>登出系統
                </button>
            </div>
        </aside>
    );
}
