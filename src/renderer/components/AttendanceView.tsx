import React, { useEffect, useRef, useState } from 'react';
import type * as FaceApiType from 'face-api.js';
// Access global faceapi (loaded via script tag)
const faceapi = (window as any).faceapi as typeof FaceApiType;
import { faceServiceRenderer } from '../services/faceService';
const { ipcRenderer } = window.require('electron');

export default function AttendanceView() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('Initializing models...');

    const [sessionInfo, setSessionInfo] = useState({
        className: 'CSE-A',
        date: new Date().toISOString().split('T')[0],
        session: 'Morning'
    });

    const [logs, setLogs] = useState<{ name: string, time: string }[]>([]);

    // Refs for access inside interval
    const studentsMapRef = useRef(new Map<string, number>());
    const recentlyMarkedRef = useRef(new Set<string>());
    const sessionInfoRef = useRef(sessionInfo);
    sessionInfoRef.current = sessionInfo; // Update on render

    useEffect(() => {
        // Load student map
        ipcRenderer.invoke('student:getAll').then((list: any[]) => {
            list.forEach(s => studentsMapRef.current.set(s.roll_no, s.id));
        });

        startSystem();
    }, []);

    const startSystem = async () => {
        try {
            setStatus('Loading Models...');
            await faceServiceRenderer.loadModels();

            setStatus('Loading Faces from DB...');
            await faceServiceRenderer.loadLabeledImages();

            setStatus('Starting Webcam...');
            startVideo();

        } catch (e: any) {
            setStatus('Error: ' + e.message);
            setLoading(false);
        }
    };

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(err => setStatus('Camera Error: ' + err));
    };

    const speak = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    };

    const handleMatch = async (rollNo: string, label: string) => {
        // Check if already marked in this session (local UI cache)
        if (recentlyMarkedRef.current.has(rollNo)) return;

        const id = studentsMapRef.current.get(rollNo);
        if (!id) return; // ID not found for roll no

        // Optimistic lock to prevent double speak
        recentlyMarkedRef.current.add(rollNo);

        const res = await ipcRenderer.invoke('attendance:mark', {
            student_id: id,
            class_name: sessionInfoRef.current.className,
            date: sessionInfoRef.current.date,
            session: sessionInfoRef.current.session,
            status: 'present'
        });

        if (res.success) {
            // Speak name
            const namePart = label.split('(')[0];
            speak(`${namePart} present successfully`);
            setLogs(prev => [{ name: label, time: new Date().toLocaleTimeString() }, ...prev]);
        } else {
            // If server says duplicate, it's fine, we just keep it in recentlyMarked
            console.log('Already marked:', res.message);
        }
    };

    const handleVideoPlay = () => {
        setLoading(false);
        setStatus('System Active');

        const matcher = faceServiceRenderer.getFaceMatcher();
        if (!matcher) {
            setStatus('No faces loaded. Go to "Students" to sync/add faces.');
            return;
        }

        const intervalId = setInterval(async () => {
            if (!videoRef.current || !canvasRef.current) return;

            const video = videoRef.current;
            const canvas = canvasRef.current;

            if (video.paused || video.ended) return;

            const displaySize = { width: video.videoWidth, height: video.videoHeight };
            if (displaySize.width === 0) return;

            faceapi.matchDimensions(canvas, displaySize);

            // Detect
            const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptors();

            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            // Draw
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);

            const results = resizedDetections.map(d => matcher.findBestMatch(d.descriptor));

            results.forEach((result, i) => {
                const box = resizedDetections[i].detection.box;
                const text = result.toString();

                const drawBox = new faceapi.draw.DrawBox(box, { label: text });
                drawBox.draw(canvas);

                if (result.label !== 'unknown') {
                    const match = result.label.match(/\((.*?)\)/);
                    if (match) {
                        const rollNo = match[1];
                        handleMatch(rollNo, result.label);
                    }
                }
            });

        }, 500); // 2 FPS is enough

        return () => clearInterval(intervalId);
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '20px', height: '100%' }}>

            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <select value={sessionInfo.className} onChange={e => setSessionInfo({ ...sessionInfo, className: e.target.value })}>
                        <option>CSE-A</option>
                        <option>CSE-B</option>
                        <option>BCA-1A</option>
                    </select>
                    <input type="date" value={sessionInfo.date} onChange={e => setSessionInfo({ ...sessionInfo, date: e.target.value })} />
                    <select value={sessionInfo.session} onChange={e => setSessionInfo({ ...sessionInfo, session: e.target.value })}>
                        <option>Morning</option>
                        <option>Afternoon</option>
                        <option>Period 1</option>
                    </select>
                </div>

                <div style={{ position: 'relative', flex: 1, backgroundColor: 'black', borderRadius: '8px', overflow: 'hidden' }}>
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        onPlay={handleVideoPlay}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <canvas
                        ref={canvasRef}
                        style={{ position: 'absolute', top: 0, left: 0 }}
                    />

                    {(loading || status.startsWith('Error') || status.startsWith('Camera')) && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', background: 'rgba(0,0,0,0.7)', flexDirection: 'column' }}>
                            <h2>{status}</h2>
                            {!loading && <button className="btn btn-danger" onClick={() => window.location.reload()}>Retry</button>}
                        </div>
                    )}
                </div>
            </div>

            <div className="card" style={{ overflowY: 'auto' }}>
                <h3>Live Log</h3>
                {logs.map((l, i) => (
                    <div key={i} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                        <strong>{l.name}</strong><br />
                        <span style={{ fontSize: '12px', color: 'gray' }}>{l.time}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
