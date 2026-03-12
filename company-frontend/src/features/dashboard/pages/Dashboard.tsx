    // src/features/dashboard/pages/Dashboard.tsx
    import { useEffect, useState } from 'react';
    import { Link } from 'react-router-dom';
    import { api } from '../../../services/api';

    import { Bar } from 'react-chartjs-2';
    import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

    // 引入選單圖示素材
    import CompanySvg from '../../../assets/icons/company.svg';
    import EmployeeSvg from '../../../assets/icons/employee.svg';
    import MissionsSvg from '../../../assets/icons/missions.svg';

    ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

    interface DashboardStats {
        totalCompanies: number;
        totalEmployees: number;
        pendingMissions: number;
        chartData: { name: string; count: number }[];
    }
        // 修正 1: 定義型別
    interface DashboardCard {
        label: string;
        value: number;
        icon: string;
        color: string;
        to: string;
    }

    export default function Dashboard() {
        const [stats, setStats] = useState<DashboardStats | null>(null);
        const userEmail = localStorage.getItem('userEmail');

        useEffect(() => {
            api.get<DashboardStats>('/dashboard/stats').then(res => {
                if (res.ok) setStats(res.data);
            });
        }, []);

        // 修正 2: 移除全螢幕載入，改用精緻提示
        if (!stats) return <div className="page-container p-5 text-center text-muted">正在同步數據...</div>;

        // Dashboard 卡片設定
        const dashboardCards: DashboardCard[] = [
            {
                label: '廠商總數',
                value: stats.totalCompanies,
                icon: CompanySvg,
                color: 'primary',
                to: '/companies'
            },
            {
                label: '在職員工',
                value: stats.totalEmployees,
                icon: EmployeeSvg,
                color: 'success',
                to: '/employees'
            },
            {
                label: '待處理任務',
                value: stats.pendingMissions,
                icon: MissionsSvg,
                color: 'warning',
                to: '/missions'
            }
        ];

        const chartConfig = {
            labels: stats.chartData.map(d => d.name),
            datasets: [{
                label: '員工人數',
                data: stats.chartData.map(d => d.count),
                backgroundColor: 'rgba(13, 110, 253, 0.7)',
                borderRadius: 6
            }]
        };

        return (
            <div className="page-container position-relative px-4 pt-3 text-start">
                <div className="page-header-wrapper mb-3">
                    <h2 className="text-dark fw-bold mb-0" style={{ fontSize: '1.25rem' }}>系統概覽</h2>
                    <div className="text-muted small">登入帳號: {userEmail}</div>
                </div>


                {/* Dashboard Cards */}
                <div className="row g-3 mb-4">
                    {dashboardCards.map((card, i) => (
                        <div key={i} className="col-md-4">
                            <Link to={card.to} className="text-decoration-none text-dark">
                                <div className="card dashboard-card shadow-sm border-0 p-3">
                                    <div className="d-flex align-items-center">

                                        <div
                                            className={`bg-${card.color}-subtle p-2 rounded-3 me-3 d-flex align-items-center justify-content-center`}
                                        >
                                            <img
                                                src={card.icon}
                                                alt={card.label}
                                                style={{
                                                    width: '22px',
                                                    height: '22px'
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <div className="text-muted small fw-bold">
                                                {card.label}
                                            </div>

                                            <div className="fs-4 fw-bold">
                                                {card.value}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>

                <div className="row g-3">
                    <div className="col-lg-8">
                        <div className="card shadow-sm border-0 p-3">
                            <h6 className="fw-bold mb-3">廠商員工分佈分析</h6>
                            <div style={{ height: '260px' }}>
                                <Bar data={chartConfig} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4">
                        <div className="card shadow-sm border-0 p-4 bg-primary text-white h-auto">
                            <h6 className="fw-bold mb-3">快捷功能</h6>
                            <div className="d-grid gap-2">
                                <Link to="/missions/create" className="btn btn-light btn-sm text-primary fw-bold py-2">發布新任務</Link>
                                <button className="btn btn-primary border-white btn-sm py-2">查看報表</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }