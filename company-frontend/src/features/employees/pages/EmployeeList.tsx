import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSelection } from '../../../hooks/useSelection';
import { useDragSelect } from '../../../hooks/useDragSelect';
import { useContextMenu } from '../../../hooks/useContextMenu';
import { employeeApi } from '../api/employeeApi';
import type { Employee, ImportResult, RowReport } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export default function EmployeeList() {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isShiftPressed, setIsShiftPressed] = useState(false);
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Employee; direction: 'asc' | 'desc' } | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [importReports, setImportReports] = useState<RowReport[]>([]);

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

    const requestSort = (key: keyof Employee) => {
        let dir: 'asc' | 'desc' = 'asc';
        if (sortConfig?.key === key && sortConfig.direction === 'asc') dir = 'desc';
        setSortConfig({ key, direction: dir });
    };

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

    const handleExport = async (ids: number[]) => {
        const exportList = ids.length > 0 ? ids : employees.map(e => e.id);
        if (!confirm(`確定匯出 ${exportList.length} 筆員工資料？`)) return;
        try {
            const res = await employeeApi.exportExcel(exportList);
            const blobData = await res.blob();
            const url = window.URL.createObjectURL(blobData);
            const a = document.createElement('a'); a.href = url; a.download = 'Employees.xlsx'; a.click();
        } catch (err) { console.error("匯出失敗", err); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("確定刪除?")) return;
        try {
            await employeeApi.deleteEmployee(id);
            setEmployees(prev => prev.filter(e => e.id !== id));
        } catch (err) { console.error("刪除出錯", err); }
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

    useEffect(() => {
        const h = (e: KeyboardEvent) => setIsShiftPressed(e.shiftKey);
        window.addEventListener('keydown', h); window.addEventListener('keyup', h);
        return () => { window.removeEventListener('keydown', h); window.removeEventListener('keyup', h); };
    }, []);

    return (
        <div
            ref={containerRef}
            className="page-container position-relative px-4 pt-3"
            style={{ minHeight: '90vh', userSelect: 'none' }}
            onMouseDown={handleContainerMouseDown}
            onMouseMove={handleContainerMouseMove}
            onContextMenu={(e) => handleContextMenu(e, null)}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingFile(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingFile(false); }}
            onDrop={handleDrop}
        >
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx, .xls" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />

            {selectionBox && <div style={{ position: 'absolute', left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h, border: '2px solid #0d6efd', backgroundColor: 'rgba(13,110,253,0.2)', pointerEvents: 'none', zIndex: 9999 }} />}

            {isDraggingFile && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(13,110,253,0.1)', border: '4px dashed #0d6efd', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div className="bg-white p-5 rounded-4 shadow-lg text-center">
                        <i className="bi bi-file-earmark-excel-fill text-primary" style={{ fontSize: '4rem' }}></i>
                        <h3 className="mt-3 fw-bold text-dark">放開滑鼠以匯入 Excel</h3>
                    </div>
                </div>
            )}

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
                            <li><button className="dropdown-item" onClick={() => handleExport(selectedIds)}>匯出所選</button></li>
                            <li><button className="dropdown-item" onClick={() => fileInputRef.current?.click()}>匯入資料</button></li>
                            <li><hr className="dropdown-divider" /></li>
                            <li><button className="dropdown-item" onClick={() => fetchData(searchTerm)}>重新整理</button></li>
                        </ul>
                    </div>
                    <Link to="/employees/create" className="btn btn-sm btn-primary text-nowrap px-3 shadow-sm"><i className="bi bi-plus-lg me-1"></i>新增員工</Link>
                </div>
            </div>

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

                                    // 這裡是新增的雙擊跳轉功能
                                    onDoubleClick={() => navigate(`/employees/${emp.id}`)}

                                    onClick={(e) => {
                                        const target = e.target as HTMLElement;
                                        if (target.tagName === 'BUTTON' || target.closest('a') || target.tagName === 'INPUT') return;
                                        handleCheck(emp.id, e as unknown as React.MouseEvent);
                                    }}
                                    // 加上 userSelect: 'none' 防止雙擊選取文字
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
                                    <td className="text-end px-4 text-nowrap">
                                        <Link to={`/employees/${emp.id}`} className="btn btn-xs btn-outline-primary me-1 shadow-sm" style={{ fontSize: '12px', padding: '2px 8px' }} onClick={e => e.stopPropagation()}>詳情</Link>
                                        <Link to={`/employees/edit/${emp.id}`} className="btn btn-xs btn-outline-success me-1 shadow-sm" style={{ fontSize: '12px', padding: '2px 8px' }} onClick={e => e.stopPropagation()}>編輯</Link>
                                        <button className="btn btn-xs btn-outline-danger shadow-sm" style={{ fontSize: '12px', padding: '2px 8px' }} onClick={(e) => { e.stopPropagation(); handleDelete(emp.id); }}>刪除</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {contextMenu.visible && (
                <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 10000, minWidth: '160px', borderRadius: '4px', fontSize: '13.5px' }} className="dropdown-menu show shadow-lg border-light">
                    {contextMenu.id ? (
                        <>
                            <Link to={`/employees/${contextMenu.id}`} className="dropdown-item py-1.5">查看詳情</Link>
                            <Link to={`/employees/edit/${contextMenu.id}`} className="dropdown-item py-1.5">編輯資料</Link>
                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item py-1.5" onClick={() => handleExport(selectedIds.includes(contextMenu.id!) ? selectedIds : [contextMenu.id!])}>匯出所選資料</button>
                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item text-danger py-1.5" onClick={() => handleDelete(contextMenu.id!)}>刪除員工</button>
                        </>
                    ) : (
                        <>
                            <Link to="/employees/create" className="dropdown-item py-1.5">新增員工</Link>
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