import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSelection } from '../../hooks/useSelection';
import { useDragSelect } from '../../hooks/useDragSelect';
import { useContextMenu } from '../../hooks/useContextMenu';

interface Employee {
    id: number;
    name: string;
    position: string;
    email: string;
    companyName: string;
    [key: string]: string | number | undefined;
}

export default function EmployeeList() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isShiftPressed, setIsShiftPressed] = useState(false);

    // 排序與選單
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    // 🔥 檔案拖曳匯入
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5203/api';
    const apiUrl = `${baseUrl}/employees`;

    // 1. 載入資料
    const fetchData = useCallback(async (searchString = "") => {
        const token = localStorage.getItem('token');
        try {
            setLoading(true);
            const url = searchString ? `${apiUrl}?searchString=${searchString}` : apiUrl;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.status === 401) { alert("請登入"); navigate('/login'); return; }
            const data = await res.json();
            setEmployees(data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [apiUrl, navigate]);

    useEffect(() => {
        const timer = setTimeout(() => fetchData(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm, fetchData]);

    // 2. 排序
    const sortedEmployees = useMemo(() => {
        if (!sortConfig) return employees;
        const sortableItems = [...employees];
        sortableItems.sort((a, b) => {
            const valA = a[sortConfig.key] ?? "";
            const valB = b[sortConfig.key] ?? "";

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [employees, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' | null = 'asc';
        if (sortConfig && sortConfig.key === key) {
            if (sortConfig.direction === 'asc') direction = 'desc';
            else if (sortConfig.direction === 'desc') direction = null;
        }
        setSortConfig(direction ? { key, direction } : null);
    };

    const getSortArrow = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return <span className="text-muted small ms-1">↕</span>;
        return sortConfig.direction === 'asc' ? <span className="text-primary ms-1">↑</span> : <span className="text-primary ms-1">↓</span>;
    };

    // 🔥 3. 使用 Hooks
    const {
        selectedIds, setSelectedIds, previewIds, setPreviewIds,
        rowDragStartId, setRowDragStartId, isRowSelected,
        handleCheck, handleCheckAll, handleRowMouseDown, handleRowMouseEnter
    } = useSelection(sortedEmployees);

    const {
        selectionBox, handleContainerMouseDown, handleContainerMouseMove
    } = useDragSelect({
        containerRef, selectedIds, setSelectedIds, previewIds, setPreviewIds, rowDragStartId, setRowDragStartId
    });

    const { contextMenu, handleContextMenu } = useContextMenu();


    // 4. 功能函式 (Export, Delete, Import)
    const handleExport = async () => {
        const token = localStorage.getItem('token');
        const count = selectedIds.length > 0 ? selectedIds.length : "所有";
        if (!confirm(`確定要匯出 ${count} 筆員工資料嗎？`)) return;
        try {
            const res = await fetch(`${baseUrl}/employees/export`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(selectedIds)
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Employees.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else { alert("匯出失敗"); }
        } catch (error) { console.error(error); alert("匯出發生錯誤"); }
    };

    const handleBatchDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`確定刪除 ${selectedIds.length} 筆資料？`)) return;
        const token = localStorage.getItem('token');
        await fetch(`${baseUrl}/employees/delete-batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(selectedIds)
        });
        fetchData(searchTerm);
        setSelectedIds([]); // 刪除後清空選取
    };

    const handleDelete = async (id: number) => {
        if (!confirm("確定刪除?")) return;
        const token = localStorage.getItem('token');
        await fetch(`${apiUrl}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        setEmployees(prev => prev.filter(e => e.id !== id));
    };

    const handleSmartDelete = (targetId: number) => {
        if (selectedIds.includes(targetId)) handleBatchDelete();
        else handleDelete(targetId);
    };

    // 匯入相關
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
    const handleDragLeave = () => setIsDragOver(false);
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && confirm(`確定要匯入檔案：${file.name} 嗎？`)) uploadFile(file);
    };
    const triggerImport = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
    };
    const uploadFile = async (file: File) => {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append("excelFile", file);
        try {
            setLoading(true);
            const res = await fetch(`${baseUrl}/employees/import`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const text = await res.text();
            let result;
            try { result = JSON.parse(text); } catch { throw new Error(text); }

            if (res.ok) {
                let msg = result.message || "匯入成功";
                if (result.errors && result.errors.length > 0) msg += "\n\n⚠️ 部分錯誤：\n" + result.errors.join("\n");
                alert(msg);
                fetchData(searchTerm);
            } else {
                let msg = "匯入失敗：" + (result.message || "");
                if (result.errors) msg += "\n\n詳細：\n" + result.errors.join("\n");
                alert(msg);
            }
        } catch (error) { console.error(error); alert("匯入發生錯誤"); } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // 鍵盤 Shift 監聽
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShiftPressed(true); };
        const handleKeyUp = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShiftPressed(false); };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, []);

    return (
        <div
            ref={containerRef}
            className="w-100 px-4 pt-3 position-relative"
            style={{ minHeight: '90vh', userSelect: 'none' }}
            onMouseDown={handleContainerMouseDown}
            onMouseMove={handleContainerMouseMove}
            onContextMenu={(e) => handleContextMenu(e, null)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isDragOver && (
                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, color: 'white', fontSize: '2rem', pointerEvents: 'none' }}>
                    <div className="border border-3 border-white p-5 rounded"><i className="bi bi-cloud-upload me-3"></i>放開滑鼠以匯入 Excel</div>
                </div>
            )}

            {selectionBox && (
                <div style={{ position: 'absolute', left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h, border: '2px solid #0d6efd', backgroundColor: 'rgba(13, 110, 253, 0.2)', pointerEvents: 'none', zIndex: 9999 }} />
            )}

            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx" onChange={handleFileChange} />

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 pt-3">
                <h2 className="mb-0 text-dark fw-bold">員工管理</h2>
                <div className="d-flex align-items-center gap-2">
                    <input className="form-control" placeholder="搜尋員工..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '300px' }} />
                    <div className="dropdown" onMouseEnter={() => setShowDropdown(true)} onMouseLeave={() => setShowDropdown(false)}>
                        <button className="btn btn-outline-secondary dropdown-toggle" type="button">更多功能</button>
                        <ul className={`dropdown-menu ${showDropdown ? 'show' : ''}`} style={{ marginTop: 0 }}>
                            <li><button className="dropdown-item" onClick={handleExport}>匯出 Excel {selectedIds.length > 0 ? `(選取 ${selectedIds.length})` : "(全部)"}</button></li>
                            <li><button className="dropdown-item" onClick={triggerImport}>匯入資料</button></li>
                        </ul>
                    </div>
                    {selectedIds.length > 0 && <button className="btn btn-danger fade-in" onClick={handleBatchDelete}>刪除選取 ({selectedIds.length})</button>}
                    <Link to="/employees/create" className="btn btn-primary"><i className="bi bi-plus-lg me-1"></i> 新增員工</Link>
                </div>
            </div>

            {/* Table */}
            <div className="card shadow-sm border-0">
                <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                        <tr>
                            <th style={{ width: '40px' }} className="text-center">
                                <input type="checkbox" className="form-check-input" checked={employees.length > 0 && selectedIds.length === employees.length} onChange={handleCheckAll} />
                            </th>
                            <th onClick={() => requestSort('name')} style={{ cursor: 'pointer' }}>姓名 {getSortArrow('name')}</th>
                            <th onClick={() => requestSort('position')} style={{ cursor: 'pointer' }}>職位 {getSortArrow('position')}</th>
                            <th onClick={() => requestSort('email')} style={{ cursor: 'pointer' }}>Email {getSortArrow('email')}</th>
                            <th onClick={() => requestSort('companyName')} style={{ cursor: 'pointer' }}>所屬廠商 {getSortArrow('companyName')}</th>
                            <th className="text-end">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-5">載入中...</td></tr>
                        ) : (
                            sortedEmployees.map(emp => {
                                const active = isRowSelected(emp.id);
                                return (
                                    <tr
                                        key={emp.id}
                                        data-id={emp.id}
                                        className={active ? "table-primary" : ""}
                                        onContextMenu={(e) => handleContextMenu(e, emp.id)}
                                        onMouseDown={(e) => handleRowMouseDown(emp.id, e)}
                                        onMouseEnter={() => handleRowMouseEnter(emp.id)}
                                        onClick={(e) => {
                                            const target = e.target as HTMLElement;
                                            if (target.tagName !== 'BUTTON' && !target.closest('a') && target.tagName !== 'INPUT' && !e.shiftKey) {
                                                handleCheck(emp.id);
                                            }
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td className="text-center">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={active}
                                                onChange={() => { }}
                                                onClick={(e) => {
                                                    if (!e.shiftKey) {
                                                        e.stopPropagation();
                                                        handleCheck(emp.id);
                                                    }
                                                }}
                                                style={{ pointerEvents: isShiftPressed ? 'none' : 'auto' }}
                                            />
                                        </td>
                                        <td className="fw-bold">{emp.name}</td>
                                        <td>{emp.position}</td>
                                        <td>{emp.email}</td>
                                        <td><span className="badge bg-info text-dark">{emp.companyName}</span></td>
                                        <td className="text-end">
                                            <Link to={`/employees/edit/${emp.id}`} className="btn btn-sm btn-outline-success me-2">編輯</Link>
                                            <button className="btn btn-sm btn-outline-danger" onClick={(e) => { e.stopPropagation(); handleDelete(emp.id) }}>刪除</button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Context Menu */}
            {contextMenu.visible && (
                <div className="dropdown-menu show shadow" style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 10000 }}>
                    {contextMenu.id !== null && (
                        <>
                            <Link to={`/employees/edit/${contextMenu.id}`} className="dropdown-item"><i className="bi bi-pencil-square me-2"></i> 編輯資料</Link>
                            <Link to={`/employees/${contextMenu.id}`} className="dropdown-item"><i className="bi bi-info-circle me-2"></i> 查看詳情</Link>
                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item text-danger" onClick={() => contextMenu.id && handleSmartDelete(contextMenu.id)}>
                                <i className="bi bi-trash me-2"></i>
                                {selectedIds.includes(contextMenu.id) ? `刪除已選 (${selectedIds.length} 筆)` : "刪除此筆"}
                            </button>
                            <div className="dropdown-divider"></div>
                        </>
                    )}
                    <Link to="/employees/create" className="dropdown-item"><i className="bi bi-plus-lg me-2"></i> 新增員工</Link>
                    <button className="dropdown-item" onClick={handleExport}><i className="bi bi-file-earmark-excel me-2"></i> 匯出 Excel {selectedIds.length > 0 ? `(選取 ${selectedIds.length})` : "(全部)"}</button>
                    <button className="dropdown-item" onClick={triggerImport}><i className="bi bi-upload me-2"></i> 匯入資料</button>
                </div>
            )}
        </div>
    );
}