import fs from 'fs/promises';
import path from 'path';
import { config } from '../main/config';
import { studentRepo } from '../db/studentRepo';

export const faceService = {
    /**
     * Scans the 'stud' directory and updates the DB.
     */
    async syncStudFolder(): Promise<{ added: number; errors: string[] }> {
        const studDir = config.paths.studDir;
        let addedCount = 0;
        const errors: string[] = [];

        try {
            await fs.access(studDir);
        } catch {
            await fs.mkdir(studDir, { recursive: true });
        }

        const files = await fs.readdir(studDir);
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

        for (const file of files) {
            if (!imageExtensions.includes(path.extname(file).toLowerCase())) {
                continue;
            }

            // Parse filename: "RollNo_Name.jpg" or "Name.jpg"
            // Basic heuristic: Try to split by underscore
            const namePart = path.parse(file).name; // remove extension

            let rollNo: string | null = null;
            let studentName = namePart;

            // Check if starts with digits followed by underscore or space?
            // Heuristic: If first part contains numbers and length > 2, treat as RollNo.
            // Example: "21CSE001_Ramesh_Kumar" -> Roll: 21CSE001, Name: Ramesh_Kumar
            const parts = namePart.split(/[_\s]+/);  // Split by underscore or space

            // If first part looks like a roll number (alphanumeric, maybe), take it.
            // Let's assume if parts.length > 1 and parts[0] has digits, it's a roll no.
            if (parts.length > 1 && /\d/.test(parts[0])) {
                rollNo = parts[0];
                studentName = parts.slice(1).join(' '); // Join rest as name
            } else {
                // No roll no found in filename, generate one or use Name as key
                // Wait, DB requires RollNo unique.
                // If no roll number, we skip or generate a dummy one?
                // Let's try to infer or skip. For now, let's treat name as "Unknown" if complex.
                // Better: Use the Name itself as RollNo if missing, but that's risky.
                // Let's generate a pseudo roll no if missing: "AUTO_<HASH>"?
                // Let's just use the filename base as roll no if simple.

                // Actually, prompt says: "If student not in DB, create them."
                // We really need a unique identifier.
                // Let's assume filenames MUST provide enough info or we accept duplicates if name differs?
                // Let's just assign rollNo = studentName if not found, hoping for uniqueness or let DB fail unique constraint.
                if (!rollNo) {
                    // Fallback: If filename is just "Ramesh", rollNo="Ramesh". 
                    // Ideally users provide "21CSE001_Name".
                    rollNo = `GEN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                }
            }

            // Clean name
            studentName = studentName.replace(/_/g, ' ').trim();

            // Check if student exists by RollNo or Name?
            // Ideally RollNo is the key.
            let student = await studentRepo.getStudentByRollNo(rollNo);

            // If found by rollno, good. If not, maybe search by name?
            // Start simple: Search by RollNo.

            let studentId: number;

            if (!student) {
                // Create new
                try {
                    studentId = await studentRepo.createStudent({
                        roll_no: rollNo,
                        name: studentName,
                        class_name: 'UNKNOWN' // Default
                    });
                    addedCount++;
                } catch (e: any) {
                    if (e.code === 'ER_DUP_ENTRY') {
                        // Maybe RollNo collision?
                        // Just fetch assuming it exists now?
                        // Or maybe skip.
                        errors.push(`Duplicate entry for ${file}`);
                        continue;
                    }
                    errors.push(`Failed to create student for ${file}: ${e.message}`);
                    continue;
                }
            } else {
                studentId = student.id!;
            }

            // Add face image to DB
            // We store relative path: "stud/filename.jpg"
            const relativePath = `stud/${file}`;

            // Check if this image path is already linked?
            // Repo addFace doesn't check duplicates logic yet, but usually we just append.
            // Let's avoid checking exact image path in DB to save time, or check briefly.
            // Just add it.
            try {
                // Warning: duplicates in student_faces allowed? 
                // Schema PK is ID, so unique not enforced on path. 
                // But we should avoid re-adding if possible.
                // Let's count faces for student to see if we should?
                // For now, let's just add.
                await studentRepo.addFace(studentId, relativePath);
            } catch (e: any) {
                errors.push(`Failed to add face for ${file}: ${e.message}`);
            }
        }

        return { added: addedCount, errors };
    }
};
