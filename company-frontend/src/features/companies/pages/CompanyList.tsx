import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSelection } from '../../../hooks/useSelection';
import { useDragSelect } from '../../../hooks/useDragSelect';
import { useContextMenu } from '../../../hooks/useContextMenu';
import { companyApi } from '../api/companyApi';
import type { Company } from '../types';

export default function CompanyList() {
    const navigate = useNavigate();

    // 權限邏輯
    const userRole = localStorage.getItem('userRole') || 'User';
    const isAdmin = userRole === 'Admin';
    const isManager = userRole === 'Manager';

    const canEdit = isAdmin || isManager; // 新增、編輯
    const canDelete = isAdmin;            // 刪除
    const canExport = isAdmin;            // 匯出

    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isShiftPressed, setIsShiftPressed] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Company; direction: 'asc' | 'desc' } | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => setIsShiftPressed(e.shiftKey);
        const handleKeyUp = (e: KeyboardEvent) => setIsShiftPressed(e.shiftKey);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', () => setIsShiftPressed(false));
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const fetchData = useCallback(async (s = "") => {
        setLoading(true);
        try {
            const res = await companyApi.getCompanies(s);
            console.log("API 原始回傳：", res.data[0]);
            setCompanies(res.data || []); 
        } catch (err) {
            console.error("載入失敗:", err);
            setCompanies([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, fetchData]);

    const handleLogoUpload = async (company: Company, file: File) => {
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('Id', company.id.toString());
            formData.append('Name', company.name);
            formData.append('ImageFile', file);
            await companyApi.updateCompany(company.id, formData);
            fetchData(searchTerm);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("確定刪除?")) return;
        await companyApi.deleteCompany(id);
        setCompanies(prev => prev.filter(c => c.id !== id));
    };

    const requestSort = (key: keyof Company) => {
        let dir: 'asc' | 'desc' = 'asc';
        if (sortConfig?.key === key && sortConfig.direction === 'asc') dir = 'desc';
        setSortConfig({ key, direction: dir });
    };

const sortedCompanies = useMemo(() => {
    if (!sortConfig) return companies;
    return [...companies].sort((a: Company, b: Company) => {
        // 關鍵：取值時同時判斷大小寫
        const valA = a[sortConfig.key] ?? "";
        const valB = b[sortConfig.key] ?? "";
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
}, [companies, sortConfig]);

    const { selectedIds, setSelectedIds, previewIds, setPreviewIds, rowDragStartId, setRowDragStartId, handleCheck, handleCheckAll, handleRowMouseDown, handleRowMouseEnter } = useSelection(sortedCompanies);
    const { selectionBox, handleContainerMouseDown, handleContainerMouseMove } = useDragSelect({ containerRef, selectedIds, setSelectedIds, previewIds, setPreviewIds, rowDragStartId, setRowDragStartId });
    const { contextMenu, handleContextMenu } = useContextMenu();

    const handleExport = async (ids: number[]) => {
        const exportList = ids.length > 0 ? ids : companies.map(c => c.id);
        if (!confirm(`確定匯出 ${exportList.length} 筆資料？`)) return;
        try {
            const res = await companyApi.exportExcel(exportList);
            const blobData = res.data;
            
            const url = window.URL.createObjectURL(blobData);
            const a = document.createElement('a'); a.href = url; a.download = "Companies.xlsx"; a.click();
        } catch (err) { console.error(err); }
    };

    return (
        <div ref={containerRef} className="page-container position-relative px-4 pt-3" style={{ minHeight: '90vh', userSelect: 'none' }} onMouseDown={handleContainerMouseDown} onMouseMove={handleContainerMouseMove} onContextMenu={(e) => handleContextMenu(e, null)}>

            {selectionBox && <div style={{ position: 'absolute', left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h, border: '2px solid #0d6efd', backgroundColor: 'rgba(13,110,253,0.2)', pointerEvents: 'none', zIndex: 9999 }} />}

            <div className="page-header-wrapper d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-dark fw-bold mb-0" style={{ fontSize: '1.25rem' }}>廠商總覽 {loading && "..."}</h2>
                <div className="d-flex align-items-center gap-2">
                    <input className="form-control form-control-sm" style={{ width: '400px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="搜尋廠商..." />
                    <div className="dropdown" onMouseEnter={() => setShowDropdown(true)} onMouseLeave={() => setShowDropdown(false)}>
                        <button type="button" className="btn btn-sm btn-outline-secondary dropdown-toggle">功能</button>
                        <ul className={`dropdown-menu ${showDropdown ? 'show' : ''}`} style={{ marginTop: 0, fontSize: '13px' }}>
                            <li><button className="dropdown-item" onClick={() => handleCheckAll({ target: { checked: selectedIds.length !== companies.length } } as React.ChangeEvent<HTMLInputElement>)}>全選 / 取消全選</button></li>
                            <li><button className="dropdown-item" onClick={() => requestSort('name')}>依名稱排序</button></li>

                            {canExport && (
                                <li><button className="dropdown-item" onClick={() => handleExport(selectedIds)}>匯出所選</button></li>
                            )}    
                        </ul>
                    </div>
                        {canEdit && (
                            <Link to="/companies/create" className="btn btn-sm btn-primary text-nowrap px-3 shadow-sm">
                                <i className="bi bi-plus-lg me-1"></i>新增廠商
                            </Link>
                        )}
                </div>
            </div>

            <div className="page-content">
                <div className="row g-4 mx-0">
                    {sortedCompanies.map(company => {
                        const active = selectedIds.includes(company.id) || previewIds.includes(company.id);

                        const displayName = company.name || '未知名稱';
                        const displayIndustry = company.industry ||  '未填';
                        const displayAddress = company.address || '未填';
                        const displayLogo = company.logoPath ||  "";

                        return (
                            <div key={company.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                                <div
                                    data-id={company.id}
                                    className={`card h-100 shadow-sm border-0 position-relative ${active ? "table-primary border-primary bg-light" : ""}`}
                                    style={{
                                        cursor: 'pointer',
                                        transition: 'all 0.1s',
                                        outline: active ? '2px solid #0d6efd' : 'none',
                                        userSelect: 'none',
                                        WebkitUserSelect: 'none'
                                    }}
                                    onContextMenu={(e) => handleContextMenu(e, company.id)}
                                    onMouseDown={(e) => handleRowMouseDown(company.id, e)}
                                    onMouseEnter={() => handleRowMouseEnter(company.id)}
                                    onDoubleClick={() => navigate(`/companies/${company.id}`)}
                                    onClick={(e) => {
                                        const target = e.target as HTMLElement;
                                        if (target.tagName === 'BUTTON' || target.closest('a') || target.closest('.logo-container')) return;
                                        handleCheck(company.id, e as unknown as React.MouseEvent);
                                    }}
                                >
                                    <div className="position-absolute p-2" style={{ top: 0, left: 0, zIndex: 5 }}>
                                        <input
                                            type="checkbox"
                                            className="form-check-input border-secondary"
                                            checked={active}
                                            style={{ pointerEvents: isShiftPressed ? 'none' : 'auto', width: '14px', height: '14px' }}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => {
                                                const fakeEvent = {
                                                    ctrlKey: true,
                                                    metaKey: true,
                                                    shiftKey: (e.nativeEvent as MouseEvent).shiftKey,
                                                    preventDefault: () => { }
                                                } as unknown as React.MouseEvent;
                                                handleCheck(company.id, fakeEvent);
                                            }}
                                        />
                                    </div>

                                    <div className="card-body pt-4 pb-3 px-3">
                                        <div className="d-flex align-items-center mb-3">
                                            {/* Logo 容器 - 加上 class 方便 onClick 過濾 */}
                                            <div
                                                className="logo-container me-3 border rounded-circle bg-white d-flex align-items-center justify-content-center"
                                                style={{
                                                    width: '48px', height: '48px', flexShrink: 0,
                                                    zIndex: 10, cursor: 'pointer', overflow: 'hidden', position: 'relative'
                                                }}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const fakeEvent = {
                                                        ctrlKey: true,
                                                        metaKey: true,
                                                        shiftKey: (e.nativeEvent as MouseEvent).shiftKey,
                                                        preventDefault: () => { }
                                                    } as React.MouseEvent;
                                                    handleCheck(company.id, fakeEvent);
                                                }}
                                            >
                                                {company.logoPath && company.logoPath.startsWith('http') ? (
                                                    <img src={displayLogo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                ) : (
                                                    <i className="bi bi-building text-secondary fs-5"></i>
                                                )}
                                            </div>

                                            {/* 隱藏的檔案輸入框 */}
                                            <input
                                                ref={(el) => { fileInputRefs.current[company.id] = el} }
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleLogoUpload(company, file);
                                                    e.target.value = "";
                                                }}
                                            />

                                            <h6 className="card-title fw-bold mb-0 text-truncate" style={{ fontSize: '1.05rem' }}> {displayName} </h6>
                                        </div>

                                        <div className="small text-muted mt-2" style={{ fontSize: '0.85rem' }}>
                                            <div className="d-flex align-items-center mb-2">
                                                <span className="badge bg-light text-dark border me-2 fw-normal" style={{ fontSize: '0.7rem' }}>產業</span>
                                                <span className="text-dark">{displayIndustry}</span>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <span className="badge bg-light text-dark border me-2 fw-normal" style={{ fontSize: '0.7rem' }}>地址</span>
                                                <span className="text-dark text-truncate" style={{ maxWidth: '180px' }}>{displayAddress}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-footer bg-white border-0 text-end pb-3 pt-0 d-flex justify-content-end gap-2" style={{ zIndex: 6 }}>
                                        <Link to={`/companies/${company.id}`} className="btn btn-xs btn-outline-primary text-nowrap" style={{ fontSize: '12px', padding: '2px 8px' }} onClick={e => e.stopPropagation()}>詳情</Link>

                                            <>
                                            {canEdit && (
                                                <Link to={`/companies/edit/${company.id}`} className="btn btn-xs btn-outline-success" style={{ fontSize: '12px', padding: '2px 8px' }} onClick={e => e.stopPropagation()}>編輯</Link>
                                            )}
                                            {canDelete && (
                                                <button className="btn btn-xs btn-outline-danger" style={{ fontSize: '12px', padding: '2px 8px' }} onClick={(e) => { e.stopPropagation(); handleDelete(company.id); }}>刪除</button>
                                            )}
                                            </>

                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {contextMenu.visible && (
                <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 10000, minWidth: '150px', fontSize: '13.5px', borderRadius: '4px' }} className="dropdown-menu show shadow-lg border-light">
                    {contextMenu.id ? (
                        <>
                            <Link to={`/companies/${contextMenu.id}`} className="dropdown-item">查看詳情</Link>
                                <>
                                    {canEdit && (
                                        <Link to={`/companies/edit/${contextMenu.id}`} className="dropdown-item">編輯資料</Link>
                                    )}

                                    <div className="dropdown-divider"></div>
                                    {canExport && (
                                        <button className="dropdown-item" onClick={() => handleExport(selectedIds.includes(contextMenu.id!) ? selectedIds : [contextMenu.id!])}>匯出所選</button>
                                    )}

                                    <div className="dropdown-divider"></div>
                                    {canDelete && (
                                        <button className="dropdown-item text-danger" onClick={() => handleDelete(contextMenu.id!)}>刪除廠商</button>
                                    )}
                                </>
                        </>
                    ) : (
                        <>
                            {canEdit && (
                                <Link to="/companies/create" className="dropdown-item py-1.5">
                                    新增廠商
                                </Link>
                            )}
                            <button className="dropdown-item" onClick={() => fetchData(searchTerm)}>重新整理</button>
                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item" onClick={() => handleCheckAll({ target: { checked: true } } as React.ChangeEvent<HTMLInputElement>)}>全選所有項目</button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}