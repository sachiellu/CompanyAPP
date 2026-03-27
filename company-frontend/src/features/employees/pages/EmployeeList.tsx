import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSelection } from '../../../hooks/useSelection';
import { useDragSelect } from '../../../hooks/useDragSelect';
import { useContextMenu } from '../../../hooks/useContextMenu';
import { employeeApi } from '../api/employeeApi';
import { type Employee, type ImportResult, type RowReport } from '../types';
import { StatusBadge } from '../components/EmployeeStatusBadge';
import { extractErrorMessage } from '../../../utils/errorHandler';


export default function EmployeeList() {
    const navigate = useNavigate();

    // 權限邏輯
    const userRole = localStorage.getItem('userRole') || 'User';
    const isAdmin = userRole === 'Admin';
    const isManager = userRole === 'Manager';

    // 權限操作能力
    const canEdit = isAdmin || isManager; // 編輯給 Manager 和 Admin
    const canDelete = isAdmin;            // 刪除給 Admin
    const canExport = isAdmin;            // 匯出給 Admin
    const canImport = isAdmin;            // 匯入給 Admin

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [isInviting, setIsInviting] = useState<number | null>(null); // 新增：追蹤哪一筆正在發送邀請
    const [searchTerm, setSearchTerm] = useState("");
    const [isShiftPressed, setIsShiftPressed] = useState(false);
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Employee; direction: 'asc' | 'desc' } | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [importReports, setImportReports] = useState<RowReport[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchData = useCallback(async (s = "") => {
        setLoading(true);
        try {
            const res = await employeeApi.getEmployees(s);
            setEmployees(res?.data || []);
        } catch (err) {
            console.error("載入失敗", err);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchData(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm, fetchData]);

    const sortedEmployees = useMemo(() => {
        if (!sortConfig) return employees;
        return [...employees].sort((a: Employee, b: Employee) => {
            const valA = a[sortConfig.key] ?? "";
            const valB = b[sortConfig.key] ?? "";
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            return sortConfig.direction === 'asc' ? 1 : -1;
        });
    }, [employees, sortConfig]);

    const { selectedIds, setSelectedIds, previewIds, setPreviewIds, rowDragStartId, setRowDragStartId, handleCheck, handleCheckAll, handleRowMouseDown, handleRowMouseEnter } = useSelection(sortedEmployees);
    const { selectionBox, handleContainerMouseDown, handleContainerMouseMove } = useDragSelect({ containerRef, selectedIds, setSelectedIds, previewIds, setPreviewIds, rowDragStartId, setRowDragStartId });
    const { contextMenu, handleContextMenu } = useContextMenu();    


// 1. 軟刪除 (停用) -> 改狀態為 2 (Disabled)
    const handleDelete = async (id: number) => {
        if (!confirm("確定要停用此員工嗎？")) return;
        try {
            await employeeApi.deleteEmployee(id);
            //  不要用 filter 移除，用 map 更新狀態！
            setEmployees(prev => prev.map(e => 
                e.id === id ? { ...e, status: 2 } : e
            ));
        } catch (err) { console.error("停用出錯", err); }
    };

    // 2. 恢復員工 -> 改狀態為 1 (Active) 或 0 (Unregistered)
    // 這裡我們簡單點，先恢復成待註冊(0)，如果他原本有綁定，後端 restore API 會處理好
    const handleRestore = async (id: number) => {
        if (!confirm("確定要恢復此員工的資料與權限嗎？")) return;
        try {
            await employeeApi.restoreEmployee(id);
            // 重新去跟後端要一次最新資料，確保狀態完全正確
            fetchData(searchTerm); 
        } catch (err) { console.error("恢復出錯", err); }
    };

    // 3. 永久刪除 (物理毀滅) -> 這才是真的要從畫面上移除
    const handleHardDelete = async (id: number) => {
        if (!confirm("⚠️ 警告：這將徹底從資料庫抹除該員工與帳號，無法復原！確定嗎？")) return;
        try {
            await employeeApi.hardDeleteEmployee(id);
            // 只有真的毀滅了，才用 filter 把他從畫面上趕走
            setEmployees(prev => prev.filter(e => e.id !== id));
        } catch (err) { console.error("永久刪除出錯", err); }
    };


// --- 新增：發送邀請 ---
    const handleSendInvite = async (id: number, email: string) => {
        if (!window.confirm(`確定要發送註冊邀請信給 ${email} 嗎？`)) return;
        setIsInviting(id);
        
        try {
                console.log("目前的 employeeApi 裡面有什麼：", employeeApi);
                await employeeApi.sendInvite(id);
                alert("邀請信已成功發送！");
                fetchData(searchTerm);
            } catch (err: unknown) { 
                // 這裡改用 unknown，避開 eslint 的 any 檢查
                console.error(err);
                const msg = extractErrorMessage(err); // 一行搞定所有解析！
                alert(msg);
            } finally {
                // 結束後重設
                setIsInviting(null);
            }
    };

    const handleExport = async (ids: number[]) => {
        const exportList = ids.length > 0 ? ids : employees.map(e => e.id);
        if (!window.confirm(`確定匯出 ${exportList.length} 筆員工資料？`)) return;
        try {
            const res = await employeeApi.exportExcel(exportList);
            const blobData = res.data;
            
            const url = window.URL.createObjectURL(blobData);
            const a = document.createElement('a'); a.href = url; a.download = 'Employees.xlsx'; a.click();
        } catch (err) { console.error("匯出失敗", err); }
    };

    const uploadFile = async (file: File) => {
        try {
            setLoading(true);
            setImportReports([]);
            const res = await employeeApi.importExcel(file);
            const result: ImportResult = res.data;
            const success = result.successCount ?? 0;
            const reports = result.reports ?? [];

            if (reports.length > 0) {
                setImportReports(reports);
                alert(`匯入完畢：成功 ${success} 筆，失敗 ${reports.length} 筆。`);
            } else {
                alert(`匯入成功：${success} 筆`);
            }
            fetchData();
        } catch (err) {
            console.error(err);
            alert("匯入失敗");
        } finally {
            setLoading(false);
            setIsDraggingFile(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setIsDraggingFile(false);
        const file = e.dataTransfer.files?.[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
            uploadFile(file);
        }
    };

    const requestSort = (key: keyof Employee) => {
        let dir: 'asc' | 'desc' = 'asc';
        if (sortConfig?.key === key && sortConfig.direction === 'asc') dir = 'desc';
        setSortConfig({ key, direction: dir });
    };


    useEffect(() => {
        const h = (e: KeyboardEvent) => setIsShiftPressed(e.shiftKey);
        window.addEventListener('keydown', h); window.addEventListener('keyup', h);
        return () => { window.removeEventListener('keydown', h); window.removeEventListener('keyup', h); };
    }, []);

    // 渲染 (Return JSX)
    return (
        <div
            ref={containerRef}
            className="page-container position-relative px-4 pt-3"
            style={{ minHeight: '90vh', userSelect: 'none' }}
            onMouseDown={handleContainerMouseDown}
            onMouseMove={handleContainerMouseMove}
            onContextMenu={(e) => handleContextMenu(e, null)}
            onDragOver={(e) => { if (canImport) { e.preventDefault(); e.stopPropagation(); setIsDraggingFile(true); } }}
            onDragLeave={(e) => { if (canImport) { e.preventDefault(); e.stopPropagation(); setIsDraggingFile(false); } }}
            onDrop={(e) => { if (canImport) handleDrop(e); }}
        >
            {canImport && <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx, .xls" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />}

            {selectionBox && <div style={{ position: 'absolute', left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h, border: '2px solid #0d6efd', backgroundColor: 'rgba(13,110,253,0.2)', pointerEvents: 'none', zIndex: 9999 }} />}

            {isDraggingFile && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(13,110,253,0.1)', border: '4px dashed #0d6efd', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div className="bg-white p-5 rounded-4 shadow-lg text-center">
                        <i className="bi bi-file-earmark-excel-fill text-primary" style={{ fontSize: '4rem' }}></i>
                        <h3 className="mt-3 fw-bold text-dark">放開滑鼠以匯入 Excel</h3>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="page-header-wrapper d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-dark fw-bold mb-0" style={{ fontSize: '1.25rem' }}>
                    員工管理 {loading && <span className="spinner-border spinner-border-sm ms-2 text-primary"></span>}
                </h2>
                <div className="d-flex align-items-center gap-2">
                    <input className="form-control form-control-sm shadow-sm" style={{ width: '400px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="搜尋員工姓名或工號..." />
                    <div className="dropdown" onMouseEnter={() => setShowDropdown(true)} onMouseLeave={() => setShowDropdown(false)}>
                        <button type="button" className={`btn btn-sm btn-outline-secondary dropdown-toggle ${showDropdown ? 'show' : ''}`}>功能</button>
                        <ul className={`dropdown-menu shadow ${showDropdown ? 'show' : ''}`} style={{ marginTop: 0, fontSize: '13px' }}>
                            <li><button className="dropdown-item" onClick={() => handleCheckAll({ target: { checked: selectedIds.length !== employees.length } } as React.ChangeEvent<HTMLInputElement>)}>全選 / 取消全選</button></li>

                            {/* 匯出 */}
                            {canExport && <li><button className="dropdown-item" onClick={() => handleExport(selectedIds)}>匯出所選</button></li>}

                            {/* 匯入 */}
                            {canImport && <li><button className="dropdown-item" onClick={() => fileInputRef.current?.click()}>匯入資料</button></li>}

                            <li><hr className="dropdown-divider" /></li>
                            <li><button className="dropdown-item" onClick={() => fetchData(searchTerm)}>重新整理</button></li>
                        </ul>
                    </div>

                    {/* 新增員工 */}
                    {canEdit && (
                        <Link to="/employees/create" className="btn btn-sm btn-primary text-nowrap px-3 shadow-sm">
                            <i className="bi bi-plus-lg me-1"></i>新增員工
                        </Link>
                    )}
                </div>
            </div>

            {/* Import Reports */}
            {importReports.length > 0 && (
                <div className="alert alert-light border-danger shadow-sm mb-4 p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="m-0 fw-bold text-danger" style={{ fontSize: '14px' }}><i className="bi bi-exclamation-triangle me-2"></i>匯入失敗清單 (髒資料追蹤)</h6>
                        <button className="btn-close small" style={{ transform: 'scale(0.8)' }} onClick={() => setImportReports([])}></button>
                    </div>
                    <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                        <table className="table table-sm table-borderless mb-0 text-start" style={{ fontSize: '12.5px' }}>
                            <thead><tr className="text-muted border-bottom"><th>行號</th><th>姓名</th><th>Email</th><th>原因</th></tr></thead>
                            <tbody>
                                {importReports.map((r, i) => (
                                    <tr key={i}>
                                        <td><span className="badge bg-secondary opacity-75">{r.rowNumber}</span></td>
                                        <td className="fw-bold">{r.name || 'N/A'}</td>
                                        <td>{r.email}</td>
                                        <td className="text-danger">{r.message}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Table Area */}
            <div className="page-content bg-white shadow-sm rounded overflow-hidden">
                <table className="table table-hover align-middle mb-0 text-start" style={{ fontSize: '13.5px' }}>
                    <thead className="table-light">
                        <tr style={{ fontSize: '13px' }}>
                            <th className="text-center" style={{ width: '40px' }}><input type="checkbox" className="form-check-input" checked={employees.length > 0 && selectedIds.length === employees.length} onChange={(e) => handleCheckAll(e)} /></th>
                            <th onClick={() => requestSort('staffId')} style={{ cursor: 'pointer', width: '100px' }}>編號</th>
                            <th onClick={() => requestSort('name')} style={{ cursor: 'pointer' }}>姓名</th>
                            <th>職位</th>
                            <th>Email</th>
                            <th>所屬廠商</th>
                            <th>狀態</th>
                            <th className="text-end px-4">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedEmployees.map(emp => {
                            const isSelected = selectedIds.includes(emp.id);
                            const isPreview = previewIds.includes(emp.id);
                            const active = isSelected || isPreview;
                            return (
                                <tr
                                    key={emp.id}
                                    data-id={emp.id}
                                    className={`${active ? "table-primary" : ""} ${isShiftPressed ? "is-selecting" : ""}`}
                                    onContextMenu={(e) => { e.stopPropagation(); handleContextMenu(e, emp.id); }}
                                    onMouseDown={(e) => handleRowMouseDown(emp.id, e)}
                                    onMouseEnter={() => handleRowMouseEnter(emp.id)}
                                    onDoubleClick={() => navigate(`/employees/${emp.id}`)}
                                    onClick={(e) => {
                                        const target = e.target as HTMLElement;
                                        if (target.tagName === 'BUTTON' || target.closest('a') || target.tagName === 'INPUT') return;
                                        handleCheck(emp.id, e as unknown as React.MouseEvent);
                                    }}
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                >
                                    <td className="text-center">
                                        <input
                                            type="checkbox"
                                            className="form-check-input shadow-none"
                                            checked={active}
                                            readOnly
                                            style={{ pointerEvents: isShiftPressed ? 'none' : 'auto', width: '14px', height: '14px' }}
                                        />
                                    </td>
                                    <td><code className="text-primary bg-light px-2 py-0.5 rounded border border-primary-subtle" style={{ fontSize: '11px' }}>{emp.staffId || '待編'}</code></td>
                                    <td className="fw-bold">{emp.name}</td>
                                    <td className="text-secondary">{emp.position}</td>
                                    <td className="text-muted small">{emp.email}</td>
                                    <td><span className="badge bg-light text-dark border fw-normal" style={{ fontSize: '12px' }}>{emp.companyName || '未歸類'}</span></td>
                                    <td><StatusBadge status={emp.status} /></td>

                                    <td className="text-end px-4 text-nowrap d-flex justify-content-end gap-2">
                                        
                                        {/* 1. 邀請：只有「待註冊 (Status === 0)」才有 */}
                                        {canEdit && emp.status === 0 && (
                                            <button
                                                type="button"
                                                disabled={isInviting === emp.id}
                                                className="btn btn-xs btn-outline-warning shadow-sm"
                                                style={{ fontSize: '12px', padding: '2px 8px' }}
                                                onClick={(e) => { e.stopPropagation(); if (emp.email) handleSendInvite(emp.id, emp.email); }}
                                            >
                                                {isInviting === emp.id ? <span className="spinner-border spinner-border-sm"></span> : "邀請"}
                                            </button>
                                        )}

                                        {/* 2. 詳情：不管什麼狀態「永遠都有」 */}
                                        <Link to={`/employees/${emp.id}`} className="btn btn-xs btn-outline-primary shadow-sm" style={{ fontSize: '12px', padding: '2px 8px' }} onClick={e => e.stopPropagation()}>
                                            詳情
                                        </Link>

                                        {/* 3. 編輯：只有「非停用 (Status !== 2)」才有 */}
                                        {canEdit && emp.status !== 2 && (
                                            <Link to={`/employees/edit/${emp.id}`} className="btn btn-xs btn-outline-success shadow-sm" style={{ fontSize: '12px', padding: '2px 8px' }} onClick={e => e.stopPropagation()}>
                                                編輯
                                            </Link>
                                        )}

                                        {/* 4. 刪除 (軟刪除)：只有「非停用 (Status !== 2)」才有 */}
                                        {canDelete && emp.status !== 2 && (
                                            <button className="btn btn-xs btn-outline-danger shadow-sm" style={{ fontSize: '12px', padding: '2px 8px' }} onClick={(e) => { e.stopPropagation(); handleDelete(emp.id); }}>
                                                刪除
                                            </button>
                                        )}

                                        {/* ========================================= */}
                                        {/* 5. 已停用 (Status === 2) 的專屬按鈕 (取代編輯和軟刪除) */}
                                        
                                        {canDelete && emp.status === 2 && (
                                            <>
                                                <button className="btn btn-xs btn-outline-info shadow-sm" style={{ fontSize: '12px', padding: '2px 8px' }} onClick={(e) => { e.stopPropagation(); handleRestore(emp.id); }}>
                                                    恢復
                                                </button>
                                                {/* 為了保持排版一致，這裡的按鈕名稱依然叫「刪除」，但按下去是實作「永久刪除」 */}
                                                <button className="btn btn-xs btn-danger shadow-sm" style={{ fontSize: '12px', padding: '2px 8px' }} onClick={(e) => { e.stopPropagation(); handleHardDelete(emp.id); }}>
                                                    刪除
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Context Menu (右鍵選單) */}
            {contextMenu.visible && (
                <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 10000, minWidth: '160px', borderRadius: '4px', fontSize: '13.5px' }} className="dropdown-menu show shadow-lg border-light">
                    {contextMenu.id ? (
                        <>
                            <Link to={`/employees/${contextMenu.id}`} className="dropdown-item py-1.5">查看詳情</Link>

                            {canEdit && (
                                <Link to={`/employees/edit/${contextMenu.id}`} className="dropdown-item py-1.5">編輯資料</Link>
                            )}

                            <div className="dropdown-divider"></div>

                            {canExport && (
                                <button className="dropdown-item py-1.5" onClick={() => handleExport(selectedIds.includes(contextMenu.id!) ? selectedIds : [contextMenu.id!])}>匯出所選資料</button>
                            )}

                            {canDelete && (
                                <>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item text-danger py-1.5" onClick={() => handleDelete(contextMenu.id!)}>刪除員工</button>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            {canEdit && (
                                <Link to="/employees/create" className="dropdown-item py-1.5">新增員工</Link>
                            )}

                            <button className="dropdown-item py-1.5" onClick={() => fetchData(searchTerm)}>重新整理</button>
                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item py-1.5" onClick={() => handleCheckAll({ target: { checked: true } } as React.ChangeEvent<HTMLInputElement>)}>全選所有</button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}