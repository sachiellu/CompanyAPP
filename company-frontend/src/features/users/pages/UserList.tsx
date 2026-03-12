// src/features/users/pages/UserList.tsx
import { useEffect, useState, useCallback } from 'react';
import { userApi, type User } from '../api/userApi';

export default function UserList() {
    const userRole = localStorage.getItem('userRole');
    const isAdmin = userRole === 'Admin';

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchData = useCallback(async () => {
        // 如果不是 Admin，根本不用浪費效能去 call API
        if (!isAdmin) return;

        setLoading(true);
        try {
            const res = await userApi.getUsers();
            if (res.ok) {
                setUsers(res.data || []);
            }
        } catch (err) {
            console.error("載入失敗:", err);
        } finally {
            setLoading(false);
        }
    }, [isAdmin]); // 記得把 isAdmin 加進依賴

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 處理角色變更
    const handleRoleChange = async (userId: string, newRole: string) => {
        if (!confirm(`確定要將此帳號更改為 ${newRole} 權限嗎？`)) return;

        try {
            setLoading(true);
            const res = await userApi.changeRole(userId, newRole);
            if (res.ok) {
                alert("權限更新成功！");
                fetchData(); // 重新整理列表
            }
        } catch (err) {
            console.error(err);
            alert("更新失敗");
        } finally {
            setLoading(false);
        }
    };

    // 簡單的前端搜尋過濾
    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.linkedEmployeeName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 畫面渲染邏輯：在這裡才進行權限判斷
    if (!isAdmin) {
        return (
            <div className="p-5 text-center mt-5 text-danger">
                <h2>⛔ 拒絕存取</h2>
                <p>親，您沒有權限進入此頁面。</p>
            </div>
        );
    }

    return (
        // 如果是 Admin，就渲染正常畫面
        <div className="page-container position-relative px-4 pt-3" style={{ minHeight: '90vh' }}>

            {/* Header 對齊 */}
            <div className="page-header-wrapper d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-dark fw-bold mb-0" style={{ fontSize: '1.25rem' }}>
                    帳號權限 {loading && <span className="spinner-border spinner-border-sm ms-2 text-primary"></span>}
                </h2>

                <div className="d-flex align-items-center gap-2">
                    <input
                        className="form-control form-control-sm shadow-sm"
                        style={{ width: '300px' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="搜尋 Email 或綁定員工..."
                    />
                    <button className="btn btn-sm btn-outline-secondary" onClick={fetchData}>
                        重新整理
                    </button>
                    {/* 這個頁面通常不能 "新增帳號"，帳號是由註冊來的，所以不放藍色新增按鈕 */}
                </div>
            </div>

            {/* 表格內容區 */}
            <div className="page-content bg-white shadow-sm rounded overflow-hidden">
                <table className="table table-hover align-middle mb-0 text-start" style={{ fontSize: '13.5px' }}>
                    <thead className="table-light">
                        <tr style={{ fontSize: '13px' }}>
                            <th className="ps-4">登入 Email</th>
                            <th>綁定員工</th>
                            <th>目前權限 (Role)</th>
                            <th className="text-end px-4">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td className="ps-4 fw-bold text-secondary">{user.email}</td>
                                    <td>
                                        <span className={`badge ${user.linkedEmployeeName === '尚未綁定' ? 'bg-warning text-dark' : 'bg-light text-dark border'}`}>
                                            {user.linkedEmployeeName}
                                        </span>
                                    </td>
                                    <td>
                                        {/* 用顏色區分權限高低 */}
                                        <span className={`badge ${user.role === 'Admin' ? 'bg-danger' : user.role === 'Manager' ? 'bg-primary' : 'bg-secondary'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="text-end px-4">
                                        {user.email === 'admin@default.com' ? (
                                            // 如果是超級管理員，顯示保護標籤，不給下拉選單
                                            <span className="badge bg-dark fst-italic shadow-sm">
                                                <i className="bi bi-shield-lock me-1"></i>由系統保護
                                            </span>
                                        ) : (
                                            // 如果是一般人，才顯示下拉選單
                                            <select
                                                className="form-select form-select-sm d-inline-block w-auto shadow-sm"
                                                style={{ fontSize: '12px' }}
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            >
                                                <option value="User">一般員工 (User)</option>
                                                <option value="Manager">主管 (Manager)</option>
                                                <option value="Admin">管理員 (Admin)</option>
                                            </select>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="text-center py-4 text-muted">
                                    找不到任何帳號資料
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}