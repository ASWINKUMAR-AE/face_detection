import React, { useState } from 'react';
import Login from './components/Login';
import StudentManagement from './components/StudentManagement';
import AttendanceView from './components/AttendanceView';
import ReportsView from './components/ReportsView';

// Simple Router
export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentView, setCurrentView] = useState('attendance'); // Default to attendance after login

    if (!isAuthenticated) {
        return <Login onLogin={() => setIsAuthenticated(true)} />;
    }

    const renderView = () => {
        switch (currentView) {
            case 'students': return <StudentManagement />;
            case 'attendance': return <AttendanceView />;
            case 'reports': return <ReportsView />;
            default: return <AttendanceView />;
        }
    };

    return (
        <div style={{ display: 'flex', height: '100%' }}>
            {/* Sidebar */}
            <div style={{ width: '250px', backgroundColor: '#1e293b', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ marginBottom: '30px' }}>Smart Attendance</h2>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                        onClick={() => setCurrentView('attendance')}
                        style={navBtnStyle(currentView === 'attendance')}
                    >
                        📸 Attendance
                    </button>
                    <button
                        onClick={() => setCurrentView('students')}
                        style={navBtnStyle(currentView === 'students')}
                    >
                        👥 Students
                    </button>
                    <button
                        onClick={() => setCurrentView('reports')}
                        style={navBtnStyle(currentView === 'reports')}
                    >
                        📊 Reports
                    </button>
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    <button onClick={() => setIsAuthenticated(false)} style={{ ...navBtnStyle(false), color: '#fb7185' }}>
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                {renderView()}
            </div>
        </div>
    );
}

const navBtnStyle = (isActive: boolean) => ({
    background: isActive ? '#374151' : 'transparent',
    border: 'none',
    color: 'white',
    padding: '12px',
    textAlign: 'left' as const, // Fix for TS
    cursor: 'pointer',
    borderRadius: '6px',
    fontSize: '16px'
});
