import { pool } from './connection';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface AttendanceRecord {
    id?: number;
    student_id: number;
    class_name: string;
    date: string; // YYYY-MM-DD
    session: string;
    status: 'present' | 'absent';
    marked_at?: Date;
}

export const attendanceRepo = {
    async markAttendance(record: AttendanceRecord): Promise<{ success: boolean; message: string }> {
        // Check duplicate
        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM attendance WHERE student_id = ? AND class_name = ? AND date = ? AND session = ?',
            [record.student_id, record.class_name, record.date, record.session]
        );

        if (existing.length > 0) {
            return { success: false, message: 'Attendance already marked.' };
        }

        await pool.query(
            'INSERT INTO attendance (student_id, class_name, date, session, status) VALUES (?, ?, ?, ?, ?)',
            [record.student_id, record.class_name, record.date, record.session, record.status]
        );

        return { success: true, message: 'Attendance marked successfully.' };
    },

    async getTodayAttendance(className: string, date: string, session: string): Promise<any[]> {
        const sql = `
            SELECT a.*, s.name, s.roll_no 
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE a.class_name = ? AND a.date = ? AND a.session = ?
            ORDER BY a.marked_at DESC
        `;
        const [rows] = await pool.query<RowDataPacket[]>(sql, [className, date, session]);
        return rows;
    },

    async getClassReport(className: string, fromDate: string, toDate: string): Promise<any[]> {
        // Assuming 'total_sessions' is dynamically calculated based on unique (date, session) in range for that class
        // OR simply distinct sessions recorded in attendance table.
        // A robust system might have a separate 'sessions' table, but per requirements we derive it.

        // 1. Get List of students in class
        // 2. Count present for each
        // 3. Count total sessions (distinct date+session) in range

        const totalSessionsSql = `
            SELECT COUNT(DISTINCT CONCAT(date, session)) as total 
            FROM attendance 
            WHERE class_name = ? AND date BETWEEN ? AND ?
        `;
        const [sessionRows] = await pool.query<RowDataPacket[]>(totalSessionsSql, [className, fromDate, toDate]);
        const totalSessions = sessionRows[0].total || 1; // Avoid divide by zero if 0

        const sql = `
            SELECT 
                s.roll_no, 
                s.name, 
                COUNT(a.id) as present_count,
                ? as total_sessions
            FROM students s
            LEFT JOIN attendance a ON s.id = a.student_id 
                AND a.class_name = ? 
                AND a.date BETWEEN ? AND ?
                AND a.status = 'present'
            WHERE s.class_name = ?
            GROUP BY s.id
        `;

        const [rows] = await pool.query<RowDataPacket[]>(sql, [totalSessions, className, fromDate, toDate, className]);

        return rows.map(r => ({
            ...r,
            absent_count: r.total_sessions - r.present_count,
            percentage: ((r.present_count / r.total_sessions) * 100).toFixed(2)
        }));
    },

    async getStudentReport(studentId: number): Promise<any> {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT count(*) as present_count FROM attendance WHERE student_id = ? AND status = "present"',
            [studentId]
        );
        // Total sessions? Hard to guess for one student without context, but let's just return raw list too
        const [details] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC',
            [studentId]
        );

        return {
            summary: rows[0],
            details
        };
    }
};
