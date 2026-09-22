CREATE DATABASE IF NOT EXISTS smart_attendance;
USE smart_attendance;

-- 1. Students Table
CREATE TABLE IF NOT EXISTS students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    roll_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NULL,
    phone VARCHAR(20) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_roll (roll_no)
);

-- 2. Student Faces Table
CREATE TABLE IF NOT EXISTS student_faces (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 3. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    session VARCHAR(50) NULL,
    status ENUM('present','absent') NOT NULL DEFAULT 'present',
    marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_stud_attn (student_id),
    INDEX idx_date (date),
    INDEX idx_composite (class_name, date, session)
);

-- Sample Data
-- Students
INSERT INTO students (roll_no, name, class_name) VALUES 
('21CSE001', 'Ramesh Kumar', 'CSE-A'),
('21CSE002', 'Priya Devi', 'CSE-A'),
('21BCA001', 'Rahul Singh', 'BCA-1A')
ON DUPLICATE KEY UPDATE name=name;

-- Faces (assuming images exist in stud folder for these sample entries, but creating placeholders)
-- In a real run, these should match actual files.
INSERT INTO student_faces (student_id, image_path) VALUES
(1, 'stud/21CSE001_Ramesh_Kumar_1.jpg'),
(2, 'stud/21CSE002_Priya_Devi.jpg')
ON DUPLICATE KEY UPDATE image_path=image_path;

-- Attendance
INSERT INTO attendance (student_id, class_name, date, session, status) VALUES
(1, 'CSE-A', CURRENT_DATE, 'Morning', 'present'),
(2, 'CSE-A', CURRENT_DATE, 'Morning', 'present')
ON DUPLICATE KEY UPDATE status=status;
