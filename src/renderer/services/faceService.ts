import type * as FaceApiType from 'face-api.js';

// Access the global variable exposed by the script tag
const faceapi = (window as any).faceapi as typeof FaceApiType;
const { ipcRenderer } = window.require('electron');

/**
 * Service to handle face-api.js logic in the Renderer.
 */
class FaceRecognitionService {
    private labeledDescriptors: FaceApiType.LabeledFaceDescriptors[] = [];
    public isLoaded = false;

    async loadModels() {
        try {
            // Get config from main process
            const config = await ipcRenderer.invoke('app:getConfig');
            const modelsPath = config.paths.modelsDir;

            // Construct file URL for Electron (webSecurity: false)
            // Normalize path for Windows (backslashes to forward slashes)
            // Normalize path for Windows (backslashes to forward slashes)
            // Use 3 slashes to mimic file:/// structure
            const normalizedPath = modelsPath.replace(/\\/g, '/');
            const modelUrl = `local-resource:///${normalizedPath}/`;

            console.log(`Loading models from ${modelUrl}`);

            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl),
                faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
                faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl)
            ]);
            console.log('Models loaded');
            this.isLoaded = true;
        } catch (e) {
            console.error("Failed to load models.", e);
            throw e;
        }
    }

    async loadLabeledImages() {
        // 1. Get list of faces from DB via IPC
        const response = await ipcRenderer.invoke('face:getAll');
        if (!response.success) {
            console.error('Failed to fetch faces', response);
            return;
        }

        const faces: { student_id: number, roll_no: string, name: string, image_path: string }[] = response.faces;

        // Group by student
        const studentMap = new Map<string, string[]>(); // label -> [imagePaths]

        faces.forEach(f => {
            const label = `${f.name} (${f.roll_no})`;
            if (!studentMap.has(label)) {
                studentMap.set(label, []);
            }
            studentMap.get(label)?.push(f.image_path);
        });

        // We need root path to resolve relative images.
        const config = await ipcRenderer.invoke('app:getConfig');
        // We assume the root is the parent of 'stud' dir or just parse studDir.
        // Actually, db stores 'stud/xxx.jpg'.
        // We need the project root. config.paths.studDir is .../stud.
        // Let's assume project root is parent of studDir.
        // Or just ask main for project root?

        // Let's use config.paths.studDir and resolve "../" ?
        // Or just Hardcode logic: 
        // image_path in DB is relative "stud/file.jpg".
        // We want absolute path.
        // If we know project root...

        // Hack: Use modelsDir's parent? `modelsDir` is .../models.
        // let's just use "d:/face_detection/" as fallback or derived.
        // Actually, let's just use `config.paths.studDir` + filename (stripping 'stud/')?
        // DB has "stud/file.jpg".
        // `studDir` is "D:/.../stud".
        // So `studDir` + "/../" + `dbPath` ?

        // Simpler: Just map `stud/` prefix to `studDir`.

        const descriptors: FaceApiType.LabeledFaceDescriptors[] = [];

        for (const [label, imagePaths] of studentMap) {
            const userDescriptors: Float32Array[] = [];

            for (const relPath of imagePaths) {
                try {
                    // Construct file URL
                    // relPath: "stud/foo.jpg"
                    // We want "file:///D:/face_detection/stud/foo.jpg"

                    // If relPath starts with stud/, remove it and join with studDir?
                    let absPath = '';
                    if (relPath.startsWith('stud/')) {
                        const fileName = relPath.replace('stud/', '');
                        absPath = `${config.paths.studDir}/${fileName}`;
                    } else {
                        // Fallback
                        absPath = `d:/face_detection/${relPath}`;
                    }

                    // Normalize absPath
                    absPath = absPath.replace(/\\/g, '/');
                    const imgUrl = `local-resource:///${absPath}`;

                    // Load image using face-api
                    const img = await faceapi.fetchImage(imgUrl);
                    const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

                    if (detections) {
                        userDescriptors.push(detections.descriptor);
                    }
                } catch (err) {
                    console.warn(`Failed to process image for ${label}: ${relPath}`, err);
                }
            }

            if (userDescriptors.length > 0) {
                descriptors.push(new faceapi.LabeledFaceDescriptors(label, userDescriptors));
            }
        }

        this.labeledDescriptors = descriptors;
        console.log(`Loaded ${descriptors.length} students into face matcher.`);
    }

    getFaceMatcher() {
        if (this.labeledDescriptors.length === 0) return null;
        return new faceapi.FaceMatcher(this.labeledDescriptors, 0.6);
    }
}

export const faceServiceRenderer = new FaceRecognitionService();
