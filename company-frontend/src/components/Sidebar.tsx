import { Link, useLocation, useNavigate } from 'react-router-dom';

// 引入選單圖示
import DashboardSvg from '../assets/icons/Dashboard.svg';
import CompanySvg from '../assets/icons/company.svg';
import EmployeeSvg from '../assets/icons/employee.svg';
import MissionsSvg from '../assets/icons/missions.svg';
import AuthoritySvg from '../assets/icons/Authority.svg';

// 關鍵：引入 Logo
import EsLogo from '../assets/icons/Logo.svg';

interface MenuItem {
    path: string;
    label: string;
    icon: string;
    roles: string[];
}

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const role = localStorage.getItem('userRole') || "User";

    const menuItems: MenuItem[] = [
        { path: '/', label: '系統概覽', icon: DashboardSvg, roles: ['Admin', 'Manager', 'User'] },
        { path: '/companies', label: '廠商總覽', icon: CompanySvg, roles: ['Admin', 'Manager', 'User'] },
        { path: '/employees', label: '員工管理', icon: EmployeeSvg, roles: ['Admin', 'Manager', 'User'] },
        { path: '/missions', label: '任務派工', icon: MissionsSvg, roles: ['Admin', 'Manager', 'User'] },
        { path: '/users', label: '帳號權限', icon: AuthoritySvg, roles: ['Admin'] },
    ];

    const handleLogout = () => {
        if (window.confirm("確定要登出系統嗎？")) {
            localStorage.clear();
            navigate('/login');
        }
    };

    return (
        <div className="bg-dark text-white vh-100 d-flex flex-column border-end border-secondary shadow flex-shrink-0" style={{ width: '230px' }}>
            <div className="p-3 border-bottom border-secondary mb-2 d-flex align-items-center">
                <img src={EsLogo} alt="Logo" style={{ width: '28px', height: '28px' }} />
                <div className="ms-2">
                    <h6 className="fw-bold m-0 text-primary" style={{ fontSize: '14px' }}>企業管理系統</h6>
                    <small className="opacity-50" style={{ fontSize: '8px' }}>Portal v1.0</small>
                </div>
            </div>

            <div className="nav flex-column px-2 flex-grow-1">
                {menuItems.map(item => {
                    const isActive = location.pathname === item.path;

                    return (
                        item.roles.includes(role) && (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-link text-white py-2.5 px-3 rounded mb-1 d-flex align-items-center transition-all ${isActive ? 'active bg-primary shadow-sm' : 'hover-bg-secondary'
                                    }`}
                                style={{ fontSize: '13.5px' }}
                            >
                                <img
                                    src={item.icon}
                                    alt={item.label}
                                    className="me-3"
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        // 關鍵：不管原始圖案是什麼顏色，這行會強制將其轉為純白色
                                        filter: 'brightness(0) invert(1)',
                                        // 用透明度來區分：選中時 100% 亮，沒選中時 60% 亮（看起來像淺灰色）
                                        opacity: isActive ? 1 : 0.6,
                                        transition: 'opacity 0.2s'
                                    }}
                                />
                                <span className={isActive ? 'fw-bold' : 'opacity-75'}>{item.label}</span>
                            </Link>
                        )
                    );
               })}
            </div>


            <div className="p-3 border-top border-secondary mt-auto bg-dark bg-opacity-50">
                <button onClick={handleLogout} className="btn btn-outline-danger w-100 py-2">
                    <i className="bi bi-box-arrow-left me-2"></i>登出系統
                </button>
            </div>
        </div>
    );
}