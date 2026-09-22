import { ipcMain } from 'electron';
import { studentRepo } from '../db/studentRepo';
import { attendanceRepo } from '../db/attendanceRepo';
import { faceService } from '../services/faceService';
import { config } from './config';

export function registerIpcHandlers() {

    // -- Auth --
    ipcMain.handle('auth:login', async (_, { username, password }) => {
        if (username === config.auth.username && password === config.auth.password) {
            return { success: true };
        }
        return { success: false, message: 'Invalid credentials' };
    });

    // -- Config --
    ipcMain.handle('app:getConfig', async () => {
        return {
            paths: config.paths
        };
    });

    // -- Students --
    ipcMain.handle('student:getAll', async () => {
        try {
            return await studentRepo.getAllStudents();
        } catch (e: any) {
            return { error: e.message };
        }
    });

    ipcMain.handle('student:create', async (_, student) => {
        try {
            const id = await studentRepo.createStudent(student);
            return { success: true, id };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle('student:sync', async () => {
        try {
            const result = await faceService.syncStudFolder();
            return { success: true, ...result };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    // -- Faces --
    ipcMain.handle('face:getAll', async () => {
        try {
            // Return list of faces with student names/ids for training in Renderer
            const faces = await studentRepo.getAllFaces();
            return { success: true, faces };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    // -- Attendance --
    ipcMain.handle('attendance:mark', async (_, record) => {
        try {
            return await attendanceRepo.markAttendance(record);
        } catch (e: any) {
            return { success: false, message: e.message };
        }
    });

    ipcMain.handle('attendance:getReport', async (_, { type, ...filters }) => {
        try {
            if (type === 'class') {
                const { className, fromDate, toDate } = filters;
                return await attendanceRepo.getClassReport(className, fromDate, toDate);
            } else if (type === 'student') {
                const { studentId } = filters;
                return await attendanceRepo.getStudentReport(studentId);
            }
        } catch (e: any) {
            return { error: e.message };
        }
    });
}
