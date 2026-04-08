{/* src/features/companies/components/CompanyFormFields.tsx */ }

interface CompanyData {
    name: string;
    taxId: string;
    industry: string;
    address: string;
    foundedDate: string;
}

interface Props {
    data: CompanyData;
    onChange: (key: keyof CompanyData, value: string) => void;
}

export function CompanyFormFields({ data, onChange }: Props) {
    return (
        <div className="row g-3 text-start">
            <div className="col-md-8">
                <label className="form-label fw-bold text-secondary small text-uppercase">廠商名稱</label>
                <input className="form-control" value={data.name} onChange={e => onChange('name', e.target.value)} required placeholder="請輸入廠商全名" />
            </div>

            <div className="col-md-4">
                <label className="form-label fw-bold text-secondary small text-uppercase">統一編號</label>
                <input
                    className="form-control"
                    value={data.taxId}
                    //  限制最大長度 8 碼
                    maxLength={8}
                    onChange={e => {
                        // 使用正則表達式，把所有「非數字」的東西替換成空字串
                        const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                        onChange('taxId', onlyNums);
                    }}
                    placeholder="8 位數字"
                />
            </div>

            <div className="col-md-6">
                <label className="form-label fw-bold text-secondary small text-uppercase">產業類別</label>
                <input className="form-control" value={data.industry} onChange={e => onChange('industry', e.target.value)} placeholder="例如：營造業" />
            </div>

            <div className="col-md-6">
                <label className="form-label fw-bold text-secondary small text-uppercase">成立日期</label>
                <input type="date" className="form-control" value={data.foundedDate} onChange={e => onChange('foundedDate', e.target.value)} />
            </div>

            <div className="col-12">
                <label className="form-label fw-bold text-secondary small text-uppercase">通訊地址</label>
                <input className="form-control" value={data.address} onChange={e => onChange('address', e.target.value)} placeholder="請輸入完整通訊地址" />
            </div>
        </div>

    );
}