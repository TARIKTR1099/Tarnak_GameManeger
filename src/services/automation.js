const API_URL = 'http://localhost:5000';

export const checkBackendStatus = async () => {
    try {
        const res = await fetch(`${API_URL}/status`);
        return await res.json();
    } catch (e) {
        return null;
    }
};

export const startRecording = async () => {
    const res = await fetch(`${API_URL}/start-recording`, { method: 'POST' });
    return await res.json();
};

export const stopRecording = async () => {
    const res = await fetch(`${API_URL}/stop-recording`, { method: 'POST' });
    return await res.json();
};

export const playMacro = async (macro, loop = false, interval = 0) => {
    const res = await fetch(`${API_URL}/play-macro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ macro, loop, interval })
    });
    return await res.json();
};

export const stopPlayback = async () => {
    const res = await fetch(`${API_URL}/stop-playback`, { method: 'POST' });
    return await res.json();
};

export const checkColor = async (x, y, color) => {
    const res = await fetch(`${API_URL}/check-color`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y, color })
    });
    return await res.json();
};

export const getCursorInfo = async () => {
    try {
        const res = await fetch(`${API_URL}/get-cursor-info`);
        return await res.json();
    } catch (e) {
        return null;
    }
};

export const getWindows = async () => {
    try {
        const res = await fetch(`${API_URL}/windows`);
        return await res.json();
    } catch (e) {
        return [];
    }
};

export const startBackgroundClicker = async (hwnd, interval) => {
    const res = await fetch(`${API_URL}/start-background-clicker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hwnd, interval })
    });
    return await res.json();
};
