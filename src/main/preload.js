// Preload script
// Since we used contextIsolation: false, we can directly access Node/Electron in Renderer.
// But some builds might require this file to exist.
console.log('Preload script loaded');
