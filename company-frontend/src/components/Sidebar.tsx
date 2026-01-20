import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const isLoggedIn = !!localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        alert("已登出");
        navigate('/login');
    };

    return (
        <div className="bg-dark text-white p-3 d-flex flex-column" style={{ width: '250px', flexShrink: 0, minHeight: '100vh' }}>
            <h4 className="mb-4 ps-2">企業管理</h4>
            <hr className="border-secondary" />

            <ul className="nav flex-column gap-2">
                <li className="nav-item">
                    <Link to="/" className={`nav-link w-100 text-start ${location.pathname === '/' ? 'active bg-primary text-white' : 'text-white-50'}`}>
                        廠商總覽
                    </Link>
                </li>
                <li className="nav-item">
                    <Link to="/employees" className={`nav-link w-100 text-start ${location.pathname.startsWith('/employees') ? 'active bg-primary text-white' : 'text-white-50'}`}>
                        員工管理
                    </Link>
                </li>
                <li className="nav-item">
                    <Link to="/missions" className={`nav-link w-100 text-start ${location.pathname.startsWith('/missions') ? 'active bg-primary text-white' : 'text-white-50'}`}>
                        任務派工
                    </Link>
                </li>
                <li className="nav-item">
                    <Link to="/users" className={`nav-link w-100 text-start ${location.pathname.startsWith('/users') ? 'active bg-primary text-white' : 'text-white-50'}`}>
                        帳號權限
                    </Link>
                </li>

                <div className="mt-auto pt-3 border-top border-secondary">
                    {isLoggedIn && (
                        <button className="btn btn-outline-danger w-100" onClick={handleLogout}>
                            <i className="bi bi-box-arrow-right"></i> 登出
                        </button>
                    )}
                </div>
            </ul>
        </div>
    );
}