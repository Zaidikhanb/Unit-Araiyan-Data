// ==================== PARTICLES ====================
(function createParticles() {
    const container = document.getElementById('bgParticles');
    const colors = ['rgba(0,229,255,0.5)', 'rgba(180,77,255,0.5)', 'rgba(255,61,127,0.4)',
        'rgba(0,234,199,0.4)', 'rgba(255,183,77,0.3)'];
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        const size = Math.random() * 4 + 1.5;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.left = Math.random() * 100 + '%';
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.animationDuration = (Math.random() * 18 + 10) + 's';
        p.style.animationDelay = (Math.random() * 15) + 's';
        container.appendChild(p);
    }
})();

// ==================== TOAST ====================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

// ==================== STATE ====================
let allEntries = [];
let currentPeriod = 'daily';
const categories = ['items', 'samples', 'cleaning', 'persons'];

// ==================== DATA LOADING ====================
async function loadAllData() {
    const container = document.getElementById('entriesContainer');
    container.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading entries…</p></div>`;

    // Try GitHub API first (cloud mode)
    try {
        const response = await fetch('/api/entries');
        if (!response.ok) throw new Error('API returned ' + response.status);
        const data = await response.json();
        allEntries = data.entries || [];
        allEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        renderEntries(currentPeriod);
        console.log('✅ Loaded from GitHub');
        return;
    } catch (apiError) {
        console.warn('⚠️ API not available, falling back to localStorage:', apiError);
    }

    // Fallback to localStorage (for local testing)
    try {
        allEntries = [];
        categories.forEach(cat => {
            const stored = localStorage.getItem('datavault_' + cat);
            if (stored) {
                const arr = JSON.parse(stored);
                allEntries = allEntries.concat(arr);
            }
        });
        allEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        renderEntries(currentPeriod);
        if (allEntries.length > 0) {
            showToast('📦 Loaded from local storage (API unavailable)', 'success');
        }
    } catch (e) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p>Could not load data.<br><small>${e.message || 'Unknown error'}</small></p>
                <button class="retry-btn" onclick="loadAllData()">Retry</button>
            </div>`;
    }
}

// ==================== FILTER ====================
function getFilteredEntries(period) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate;
    switch (period) {
        case 'daily': startDate = startOfDay; break;
        case 'weekly': {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            startDate = new Date(now.getFullYear(), now.getMonth(), diff);
            startDate.setHours(0,0,0,0);
            break;
        }
        case 'monthly': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case 'yearly': startDate = new Date(now.getFullYear(), 0, 1); break;
        case 'all': return allEntries;
        default: startDate = startOfDay;
    }
    return allEntries.filter(e => new Date(e.timestamp) >= startDate);
}

// ==================== DELETE ENTRY ====================
async function deleteEntry(entryId, category) {
    // Try API delete first
    try {
        const resp = await fetch('/api/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: entryId, category })
        });
        if (resp.ok) {
            showToast('🗑️ Deleted from GitHub', 'success');
            await loadAllData();
            return;
        }
    } catch (e) {
        console.warn('API delete failed, using localStorage');
    }

    // localStorage fallback
    const storageKey = 'datavault_' + category;
    let entries = [];
    try { entries = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch(e){}
    const updated = entries.filter(e => e.id !== entryId);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    showToast('🗑️ Deleted from local storage', 'success');
    await loadAllData();
}

// ==================== RENDER ====================
function renderEntries(period) {
    const filtered = getFilteredEntries(period);
    const container = document.getElementById('entriesContainer');

    if (!filtered.length) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                <p>No entries found for this period.</p>
            </div>`;
        return;
    }

    container.innerHTML = filtered.map(entry => {
        const date = new Date(entry.timestamp);
        const dateStr = date.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
        const timeStr = date.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });

        let icon = '📦';
        let categoryName = entry.category;
        let details = '';

        switch (entry.category) {
            case 'items':
                icon = '📦';
                if (entry.subCategory === 'otherItem') {
                    details = `Other: ${entry.itemName || '—'} | Color: ${entry.color || '—'} | Size: ${entry.size || '—'} | Qty: ${entry.quantity || '—'} | Person: ${entry.personName || '—'}`;
                } else {
                    details = `${entry.subCategory || ''} — Qty: ${entry.quantity || '?'} | Person: ${entry.personName || '?'}`;
                    if (entry.color) details += ` | Color: ${entry.color}`;
                    if (entry.gradeNumber) details += ` | Grade: ${entry.gradeNumber}`;
                    if (entry.optionalData) details += ` | Note: ${entry.optionalData}`;
                }
                break;
            case 'samples':
                icon = '🧪';
                details = `${entry.sampleName || '?'} (${entry.sampleColor || 'no color'}) — Person: ${entry.personName || '?'}`;
                break;
            case 'cleaning':
                icon = '🧹';
                details = `Size: ${entry.sizeGuzz} Guzz — Person: ${entry.personName || '?'}`;
                break;
            case 'persons':
                icon = '👤';
                details = `${entry.absentName || '?'} — Reason: ${entry.reason || 'not specified'}`;
                break;
            default:
                icon = '📋';
                details = JSON.stringify(entry);
        }

        let inOutClass = '';
        let inOutText = '';
        if (entry.inOut === 'in') { inOutClass = 'inout-in'; inOutText = 'IN'; }
        else if (entry.inOut === 'out') { inOutClass = 'inout-out'; inOutText = 'OUT'; }
        else if (entry.inOut === 'absent') { inOutClass = 'inout-absent'; inOutText = 'ABSENT'; }

        return `
            <div class="entry-card">
                <div class="entry-icon">${icon}</div>
                <div class="entry-main">
                    <span class="entry-category">
                        ${categoryName}
                        ${inOutText ? `<span class="inout-badge ${inOutClass}">${inOutText}</span>` : ''}
                    </span>
                    <div class="entry-detail">${details}</div>
                </div>
                <div class="entry-meta">
                    <div>${dateStr}</div>
                    <div>${timeStr}</div>
                    <button class="delete-btn" data-id="${entry.id}" data-category="${entry.category}" title="Delete entry">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Attach delete events
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Permanently delete this entry?')) {
                deleteEntry(btn.dataset.id, btn.dataset.category);
            }
        });
    });
}

// ==================== DOWNLOAD CSV ====================
function downloadCSV(period) {
    const filtered = getFilteredEntries(period);
    if (!filtered.length) {
        showToast('No data to download', 'error');
        return;
    }
    let csv = 'Category,SubCategory,Date,Time,InOut,Details\n';
    filtered.forEach(e => {
        const date = new Date(e.timestamp);
        let details = '';
        if (e.category === 'items') {
            details = `${e.subCategory || ''} - Qty:${e.quantity || ''} Person:${e.personName || ''}`;
        } else if (e.category === 'samples') {
            details = `Sample:${e.sampleName} Color:${e.sampleColor} Person:${e.personName}`;
        } else if (e.category === 'cleaning') {
            details = `Size:${e.sizeGuzz} Person:${e.personName}`;
        } else if (e.category === 'persons') {
            details = `Absent:${e.absentName} Reason:${e.reason || ''}`;
        }
        csv += [
            e.category,
            e.subCategory || '',
            date.toLocaleDateString('en-GB'),
            date.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }),
            e.inOut || '',
            `"${details.replace(/"/g, '""')}"`
        ].join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `datavault_${period}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 Download started', 'success');
}

// ==================== EVENT LISTENERS ====================
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPeriod = btn.dataset.period;
        renderEntries(currentPeriod);
    });
});

document.getElementById('downloadBtn').addEventListener('click', () => {
    downloadCSV(currentPeriod);
});

// Initial load
loadAllData();