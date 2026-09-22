import React, { useEffect, useState } from 'react';
const { ipcRenderer } = window.require('electron');

interface Student {
    id: number;
    roll_no: string;
    name: string;
    class_name: string;
    email?: string;
    phone?: string;
}

export default function StudentManagement() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: '', roll_no: '', class_name: '', email: '', phone: '' });
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        const res = await ipcRenderer.invoke('student:getAll');
        if (Array.isArray(res)) {
            setStudents(res);
        }
    };

    const handleSync = async () => {
        setLoading(true);
        setMsg('Syncing from stud folder...');
        const res = await ipcRenderer.invoke('student:sync');
        setLoading(false);
        if (res.success) {
            setMsg(`Sync Complete. Added: ${res.added}. Errors: ${res.errors.length}`);
            fetchStudents();
        } else {
            setMsg('Sync Failed: ' + res.error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await ipcRenderer.invoke('student:create', form);
        if (res.success) {
            setMsg('Student added successfully');
            setForm({ name: '', roll_no: '', class_name: '', email: '', phone: '' });
            fetchStudents();
        } else {
            setMsg('Error adding student: ' + res.error);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Student Management</h2>
                <button className="btn btn-success" onClick={handleSync} disabled={loading}>
                    {loading ? 'Syncing...' : '↻ Sync from "stud" Folder'}
                </button>
            </div>

            {msg && <div style={{ padding: '10px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', marginBottom: '20px' }}>{msg}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                {/* Form */}
                <div className="card">
                    <h3>Add New Student</h3>
                    <form onSubmit={handleSubmit}>
                        <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        <input placeholder="Roll No" value={form.roll_no} onChange={e => setForm({ ...form, roll_no: e.target.value })} required />
                        <input placeholder="Class (e.g. CSE-A)" value={form.class_name} onChange={e => setForm({ ...form, class_name: e.target.value })} required />
                        <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                        <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        <button className="btn btn-primary" style={{ width: '100%' }}>Add Student</button>
                    </form>
                </div>

                {/* List */}
                <div className="card" style={{ height: '70vh', overflowY: 'auto' }}>
                    <h3>Student List ({students.length})</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Roll No</th>
                                <th>Name</th>
                                <th>Class</th>
                                <th>Email</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(s => (
                                <tr key={s.id}>
                                    <td>{s.roll_no}</td>
                                    <td>{s.name}</td>
                                    <td>{s.class_name}</td>
                                    <td>{s.email}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
