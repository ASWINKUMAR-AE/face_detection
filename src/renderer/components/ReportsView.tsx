import React, { useState } from 'react';
const { ipcRenderer } = window.require('electron');

export default function ReportsView() {
    const [filter, setFilter] = useState({
        className: 'CSE-A',
        fromDate: '2025-01-01',
        toDate: new Date().toISOString().split('T')[0]
    });

    const [reportData, setReportData] = useState<any[]>([]);

    const generateReport = async () => {
        const res = await ipcRenderer.invoke('attendance:getReport', {
            type: 'class',
            ...filter
        });
        if (res && !res.error) {
            setReportData(res);
        }
    };

    return (
        <div className="card">
            <h2>Attendance Reports</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '20px' }}>
                <div>
                    <label>Class</label>
                    <input value={filter.className} onChange={e => setFilter({ ...filter, className: e.target.value })} />
                </div>
                <div>
                    <label>From</label>
                    <input type="date" value={filter.fromDate} onChange={e => setFilter({ ...filter, fromDate: e.target.value })} />
                </div>
                <div>
                    <label>To</label>
                    <input type="date" value={filter.toDate} onChange={e => setFilter({ ...filter, toDate: e.target.value })} />
                </div>
                <button className="btn btn-primary" onClick={generateReport}>Generate Report</button>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Roll No</th>
                        <th>Name</th>
                        <th>Total Sessions</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.map((row, i) => (
                        <tr key={i}>
                            <td>{row.roll_no}</td>
                            <td>{row.name}</td>
                            <td>{row.total_sessions}</td>
                            <td style={{ color: 'green' }}>{row.present_count}</td>
                            <td style={{ color: 'red' }}>{row.absent_count}</td>
                            <td>
                                <strong>{row.percentage}%</strong>
                            </td>
                        </tr>
                    ))}
                    {reportData.length === 0 && <tr><td colSpan={6}>No data found</td></tr>}
                </tbody>
            </table>
        </div>
    );
}
