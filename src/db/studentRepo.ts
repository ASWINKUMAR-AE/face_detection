import { pool } from './connection';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface Student {
    id?: number;
    roll_no: string;
    name: string;
    class_name: string;
    email?: string;
    phone?: string;
    created_at?: Date;
}

export interface StudentFace {
    id?: number;
    student_id: number;
    image_path: string;
}

export const studentRepo = {
    async getAllStudents(): Promise<Student[]> {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM students ORDER BY roll_no ASC');
        return rows as Student[];
    },

    async getStudentById(id: number): Promise<Student | null> {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM students WHERE id = ?', [id]);
        return (rows[0] as Student) || null;
    },

    async getStudentByRollNo(rollNo: string): Promise<Student | null> {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM students WHERE roll_no = ?', [rollNo]);
        return (rows[0] as Student) || null;
    },

    async createStudent(student: Student): Promise<number> {
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO students (roll_no, name, class_name, email, phone) VALUES (?, ?, ?, ?, ?)',
            [student.roll_no, student.name, student.class_name, student.email || null, student.phone || null]
        );
        return result.insertId;
    },

    async updateStudent(id: number, student: Partial<Student>): Promise<void> {
        await pool.query(
            'UPDATE students SET name = ?, class_name = ?, email = ?, phone = ? WHERE id = ?',
            [student.name, student.class_name, student.email, student.phone, id]
        );
    },

    async deleteStudent(id: number): Promise<void> {
        await pool.query('DELETE FROM students WHERE id = ?', [id]);
    },

    // Faces
    async addFace(studentId: number, imagePath: string): Promise<void> {
        await pool.query('INSERT INTO student_faces (student_id, image_path) VALUES (?, ?)', [studentId, imagePath]);
    },

    async getFacesByStudentId(studentId: number): Promise<StudentFace[]> {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM student_faces WHERE student_id = ?', [studentId]);
        return rows as StudentFace[];
    },

    async getAllFaces(): Promise<(StudentFace & { roll_no: string, name: string })[]> {
        // Init cache flow
        const sql = `
            SELECT sf.*, s.roll_no, s.name 
            FROM student_faces sf
            JOIN students s ON sf.student_id = s.id
        `;
        const [rows] = await pool.query<RowDataPacket[]>(sql);
        return rows as (StudentFace & { roll_no: string, name: string })[];
    }
};
