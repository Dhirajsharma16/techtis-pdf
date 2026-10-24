/**
 * Storage and Privacy Log Utility
 * 100% Client-Side. Never transmits metadata or bytes to any external service.
 */

const STORAGE_KEYS = {
    HISTORY: 'techtis_history_v1',
    SETTINGS: 'techtis_settings_v1',
    STATS: 'techtis_stats_v1',
    LEGACY_HISTORY: 'pdfpulse_history_v1',
    LEGACY_SETTINGS: 'pdfpulse_settings_v1',
    LEGACY_STATS: 'pdfpulse_stats_v1'
};

export const StorageManager = {
    // Get all activity logs
    getHistory() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.HISTORY) || localStorage.getItem(STORAGE_KEYS.LEGACY_HISTORY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.warn('LocalStorage error:', e);
            return [];
        }
    },

    // Add entry to history (only metadata, never file content or buffers)
    addHistoryEntry(entry) {
        try {
            const history = this.getHistory();
            const record = {
                id: 'op_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                toolId: entry.toolId,
                toolName: entry.toolName,
                timestamp: new Date().toISOString(),
                inputFilesCount: entry.inputFilesCount || 1,
                inputTotalSize: entry.inputTotalSize || 0,
                outputSize: entry.outputSize || 0,
                durationMs: entry.durationMs || 0,
                summary: entry.summary || ''
            };

            // Keep maximum 50 most recent records
            history.unshift(record);
            if (history.length > 50) history.pop();
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));

            this.updateStats(record);
            return record;
        } catch (e) {
            console.warn('Failed to record history:', e);
            return null;
        }
    },

    // Update aggregate stats
    updateStats(record) {
        try {
            const stats = this.getStats();
            stats.totalOperations = (stats.totalOperations || 0) + 1;
            stats.totalBytesSaved = (stats.totalBytesSaved || 0) + (record.inputTotalSize || 0);
            stats.totalTimeMs = (stats.totalTimeMs || 0) + (record.durationMs || 0);
            localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
        } catch (e) {
            console.warn('Stats error:', e);
        }
    },

    getStats() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.STATS) || localStorage.getItem(STORAGE_KEYS.LEGACY_STATS);
            return raw ? JSON.parse(raw) : { totalOperations: 0, totalBytesSaved: 0, totalTimeMs: 0 };
        } catch (e) {
            return { totalOperations: 0, totalBytesSaved: 0, totalTimeMs: 0 };
        }
    },

    clearHistory() {
        try {
            localStorage.removeItem(STORAGE_KEYS.HISTORY);
            localStorage.removeItem(STORAGE_KEYS.STATS);
            localStorage.removeItem(STORAGE_KEYS.LEGACY_HISTORY);
            localStorage.removeItem(STORAGE_KEYS.LEGACY_STATS);
            return true;
        } catch (e) {
            return false;
        }
    },

    // User settings for optional Edge AI keys
    getSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS) || localStorage.getItem(STORAGE_KEYS.LEGACY_SETTINGS);
            return raw ? JSON.parse(raw) : {
                geminiApiKey: '',
                groqApiKey: '',
                ocrSpaceApiKey: '',
                cloudflareWorkerUrl: ''
            };
        } catch (e) {
            return {
                geminiApiKey: '',
                groqApiKey: '',
                ocrSpaceApiKey: '',
                cloudflareWorkerUrl: ''
            };
        }
    },

    saveSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('Save settings error:', e);
            return false;
        }
    }
};
