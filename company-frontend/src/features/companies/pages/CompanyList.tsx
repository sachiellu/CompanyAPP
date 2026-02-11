import { Link,useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSelection } from '../../../hooks/useSelection';
import { useDragSelect } from '../../../hooks/useDragSelect';
import { useContextMenu } from '../../../hooks/useContextMenu';
import { companyApi } from '../api/companyApi';
import type { Company } from '../types';

export default function CompanyList() {
    const navigate = useNavigate(); 
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isShiftPressed, setIsShiftPressed] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Company; direction: 'asc' | 'desc' } | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchData = useCallback(async (s = "") => {
        setLoading(true);
        try {
            const res = await companyApi.getCompanies(s);
            setCompanies(res.data);
        } catch (err) {
            console.error(err);
            setCompanies([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchData(searchTerm), 500);
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
            const valA = a[sortConfig.key] ?? "";
            const valB = b[sortConfig.key] ?? "";
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            return sortConfig.direction === 'asc' ? 1 : -1;
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
            const blobData = await res.blob();
            const url = window.URL.createObjectURL(blobData);
            const a = document.createElement('a'); a.href = url; a.download = "Companies.xlsx"; a.click();
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        const h = (e: KeyboardEvent) => setIsShiftPressed(e.shiftKey);
        window.addEventListener('keydown', h); window.addEventListener('keyup', h);
        return () => { window.removeEventListener('keydown', h); window.removeEventListener('keyup', h); };
    }, []);

    return (
        <div ref={containerRef} className="page-container position-relative px-4 pt-3" style={{ minHeight: '90vh', userSelect: 'none' }} onMouseDown={handleContainerMouseDown} onMouseMove={handleContainerMouseMove} onContextMenu={(e) => handleContextMenu(e, null)}>

            {selectionBox && <div style={{ position: 'absolute', left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h, border: '2px solid #0d6efd', backgroundColor: 'rgba(13,110,253,0.2)', pointerEvents: 'none', zIndex: 9999 }} />}

            <div className="page-header-wrapper d-flex justify-content-between align-items-center mb-4">
                {/* 1. 標題字體縮小至 1.25rem (原本預設太巨大) */}
                <h2 className="text-dark fw-bold mb-0" style={{ fontSize: '1.25rem' }}>廠商總覽 {loading && "..."}</h2>

                <div className="d-flex align-items-center gap-2">
                    {/* 2. 搜尋框寬度從 700px 縮減到 350px */}
                    <input
                        className="form-control form-control-sm"
                        style={{ width: '400px' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="搜尋廠商..." />
                    <div className="dropdown" onMouseEnter={() => setShowDropdown(true)} onMouseLeave={() => setShowDropdown(false)}>
                        {/* 3. 按鈕全面改用 btn-sm 增加精緻感 */}
                        <button type="button" className="btn btn-sm btn-outline-secondary dropdown-toggle">功能</button>
                        <ul className={`dropdown-menu ${showDropdown ? 'show' : ''}`} style={{ marginTop: 0, fontSize: '13px' }}>
                            <li>
                                <button className="dropdown-item" onClick={() => handleCheckAll({ target: { checked: selectedIds.length !== companies.length } } as React.ChangeEvent<HTMLInputElement>)}>
                                    全選 / 取消全選
                                </button>
                            </li>
                            <li><button className="dropdown-item" onClick={() => requestSort('name')}>依名稱排序</button></li>
                            <li><button className="dropdown-item" onClick={() => handleExport(selectedIds)}>匯出所選</button></li>
                        </ul>
                    </div>
                    {/* 4. 新增廠商按鈕：加上 px-4 確保與 Detail 頁面的「返回列表」按鈕右邊界對齊 */}
                    <Link to="/companies/create" className="btn btn-sm btn-primary text-nowrap px-3 shadow-sm">
                        <i className="bi bi-plus-lg me-1"></i>新增廠商
                    </Link>
                </div>
            </div>

            <div className="page-content">
                <div className="row g-4 mx-0">
                    {sortedCompanies.map(company => {
                        const active = selectedIds.includes(company.id) || previewIds.includes(company.id);
                        return (
                            <div key={company.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                                <div
                                    data-id={company.id}
                                    className={`card h-100 shadow-sm border-0 position-relative ${active ? "table-primary border-primary bg-light" : ""}`}
                                    style={{
                                        cursor: 'pointer',
                                        transition: 'all 0.1s',
                                        outline: active ? '2px solid #0d6efd' : 'none',
                                        userSelect: 'none'
                                    }}
                                    onContextMenu={(e) => handleContextMenu(e, company.id)}
                                    onMouseDown={(e) => handleRowMouseDown(company.id, e)}
                                    onMouseEnter={() => handleRowMouseEnter(company.id)}

                                    // 雙擊事件
                                    onDoubleClick={() => {
                                        navigate(`/companies/${company.id}`);
                                    }}

                                    onClick={(e) => {
                                        const target = e.target as HTMLElement;
                                        // 排除按鈕與 Logo 上傳區域，避免與單選功能衝突
                                        if (target.tagName === 'BUTTON' || target.closest('a') || target.closest('.logo-uploader')) return;
                                        handleCheck(company.id, e as unknown as React.MouseEvent);
                                    }}
                                >
                                    <div className="position-absolute p-2" style={{ top: 0, left: 0, zIndex: 5 }}>
                                        <input
                                            type="checkbox"
                                            className="form-check-input border-secondary"
                                            checked={active}
                                            readOnly
                                            style={{ pointerEvents: isShiftPressed ? 'none' : 'auto', width: '14px', height: '14px' }}
                                        />
                                    </div>

                                    {/* 5. 卡片內距縮減，字體微調 */}
                                    <div className="card-body pt-4 pb-3 px-3">
                                        <div className="d-flex align-items-center mb-3">
                                            {/* Logo 稍微縮小 */}
                                            <div className="me-3 border rounded-circle d-flex align-items-center justify-content-center bg-white logo-uploader position-relative"
                                                style={{ width: '48px', height: '48px', overflow: 'hidden', flexShrink: 0, zIndex: 6 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = 'image/*';
                                                    input.onchange = (ev) => {
                                                        const file = (ev.target as HTMLInputElement).files?.[0];
                                                        if (file) handleLogoUpload(company, file);
                                                    };
                                                    input.click();
                                                }}
                                            >
                                                {company.logoPath ? (
                                                    <img src={company.logoPath} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                ) : (
                                                    <i className="bi bi-building text-secondary fs-5"></i>
                                                )}
                                                <div className="position-absolute w-100 h-100 bg-dark bg-opacity-10 d-flex align-items-center justify-content-center opacity-0 hover-opacity-100">
                                                    <i className="bi bi-camera text-white small"></i>
                                                </div>
                                            </div>
                                            {/* 名稱縮至 1.05rem */}
                                            <h6 className="card-title fw-bold mb-0 text-truncate" style={{ fontSize: '1.05rem' }}>{company.name}</h6>
                                        </div>

                                        <div className="small text-muted mt-2" style={{ fontSize: '0.85rem' }}>
                                            <div className="d-flex align-items-center mb-2">
                                                <span className="badge bg-light text-dark border me-2 fw-normal" style={{ fontSize: '0.7rem' }}>產業</span>
                                                <span className="text-dark">{company.industry || '未填'}</span>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <span className="badge bg-light text-dark border me-2 fw-normal" style={{ fontSize: '0.7rem' }}>地址</span>
                                                <span className="text-dark text-truncate" style={{ maxWidth: '180px' }}>{company.address || '未填'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 6. 底部按鈕縮小 */}
                                    <div className="card-footer bg-white border-0 text-end pb-3 pt-0 d-flex justify-content-end gap-2" style={{ zIndex: 6 }}>
                                        <Link to={`/companies/${company.id}`} className="btn btn-xs btn-outline-primary text-nowrap" style={{ fontSize: '12px', padding: '2px 8px' }} onClick={e => e.stopPropagation()}>詳情</Link>
                                        <Link to={`/companies/edit/${company.id}`} className="btn btn-xs btn-outline-success" style={{ fontSize: '12px', padding: '2px 8px' }} onClick={e => e.stopPropagation()}>編輯</Link>
                                        <button className="btn btn-xs btn-outline-danger" style={{ fontSize: '12px', padding: '2px 8px' }} onClick={(e) => { e.stopPropagation(); handleDelete(company.id); }}>刪除</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 右鍵選單字體也縮小 */}
            {contextMenu.visible && (
                <div style={{
                    position: 'fixed',
                    top: contextMenu.y,
                    left: contextMenu.x,
                    zIndex: 10000,
                    minWidth: '150px',
                    fontSize: '13.5px',
                    borderRadius: '4px'
                }}
                    className="dropdown-menu show shadow-lg border-light">
                
                    {contextMenu.id ? (
                        /* --- 選項 A：針對廠商卡片 --- */
                        <>
                            <Link to={`/companies/${contextMenu.id}`} className="dropdown-item">查看詳情</Link>
                            <Link to={`/companies/edit/${contextMenu.id}`} className="dropdown-item">編輯資料</Link>

                            {/* 增加格線進行功能分組 */}
                            <div className="dropdown-divider"></div>

                            <button
                                className="dropdown-item"
                                onClick={() => {
                                    const idsToExport = selectedIds.includes(contextMenu.id!) ? selectedIds : [contextMenu.id!];
                                    handleExport(idsToExport);
                                }}
                            >
                                {selectedIds.includes(contextMenu.id!) && selectedIds.length > 1
                                    ? `匯出所選 ( ${selectedIds.length} 間廠商)`
                                    : "匯出此廠商資料"}
                            </button>

                            <div className="dropdown-divider"></div>

                            <button className="dropdown-item text-danger" onClick={() => handleDelete(contextMenu.id!)}>
                                刪除廠商
                            </button>
                        </>
                    ) : (
                        /* --- 選項 B：針對空白處 --- */
                        <>
                            <Link to="/companies/create" className="dropdown-item">新增廠商</Link>
                            <button className="dropdown-item" onClick={() => fetchData(searchTerm)}>
                                重新整理
                            </button>

                            <div className="dropdown-divider"></div>

                            <button className="dropdown-item" onClick={() => handleCheckAll({ target: { checked: true } } as React.ChangeEvent<HTMLInputElement>)}>
                                全選所有項目
                            </button>
                            {selectedIds.length > 0 && (
                                <button className="dropdown-item" onClick={() => setSelectedIds([])}>
                                    取消所有選取
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}