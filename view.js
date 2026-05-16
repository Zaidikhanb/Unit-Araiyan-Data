// ==================== PARTICLES ====================
(function() {
    const container = document.getElementById('bgParticles');
    const colors = ['rgba(0,229,255,0.5)', 'rgba(180,77,255,0.5)', 'rgba(255,61,127,0.4)',
        'rgba(0,234,199,0.4)', 'rgba(255,183,77,0.3)'];
    for (let i = 0; i < 25; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        p.style.width = p.style.height = (Math.random() * 4 + 1.5) + 'px';
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

let allEntries = [];
let currentPeriod = 'daily';

// Fetch all entries from GitHub API
async function loadAllData() {
    const container = document.getElementById('entriesContainer');
    container.innerHTML = '<div class="loading"><div class="spinner"></div> Loading from GitHub...</div>';
    try {
        const response = await fetch('/api/entries');
        if (!response.ok) throw new Error('Failed to fetch entries');
        const data = await response.json();
        allEntries = data.entries || [];
        allEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        renderEntries(currentPeriod);
    } catch (err) {
        container.innerHTML = `<div class="no-data">❌ Could not load data from GitHub.<br>${err.message}</div>`;
        console.error(err);
    }
}

function getFilteredEntries(period) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate;
    switch(period) {
        case 'daily': startDate = startOfDay; break;
        case 'weekly':
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            startDate = new Date(now.setDate(diff));
            startDate.setHours(0,0,0,0);
            break;
        case 'monthly': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case 'yearly': startDate = new Date(now.getFullYear(), 0, 1); break;
        case 'all': return allEntries;
        default: startDate = startOfDay;
    }
    return allEntries.filter(e => new Date(e.timestamp) >= startDate);
}

// Delete entry via API
async function deleteEntry(entryId, category) {
    try {
        const response = await fetch('/api/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: entryId, category })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Delete failed');
        showToast('🗑️ Entry deleted', 'success');
        await loadAllData(); // refresh
    } catch (err) {
        showToast('❌ Delete failed: ' + err.message, 'error');
    }
}

function renderEntries(period) {
    const filtered = getFilteredEntries(period);
    const container = document.getElementById('entriesContainer');
    if (!filtered.length) {
        container.innerHTML = '<div class="no-data">No entries found for this period.</div>';
        return;
    }
    container.innerHTML = filtered.map(entry => {
        const date = new Date(entry.timestamp);
        const dateStr = date.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
        const timeStr = date.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
        let details = '';
        if (entry.category === 'items') {
            const sub = entry.subCategory;
            if (sub === 'otherItem') {
                details = `Other: ${entry.itemName||'—'} | Color:${entry.color||'—'} | Size:${entry.size||'—'} | Qty:${entry.quantity||'—'} | Person:${entry.personName||'—'} | ${entry.inOut?.toUpperCase()||''}`;
            } else {
                details = `${sub} — Qty: ${entry.quantity||'?'} | Person: ${entry.personName||'?'} | ${entry.inOut?.toUpperCase()||''}`;
            }
        } else if (entry.category === 'samples') {
            details = `Sample: ${entry.sampleName} (${entry.sampleColor}) | Person: ${entry.personName} | ${entry.inOut?.toUpperCase()||''}`;
        } else if (entry.category === 'cleaning') {
            details = `Size: ${entry.sizeGuzz} Guzz | Person: ${entry.personName} | ${entry.inOut?.toUpperCase()||''}`;
        } else if (entry.category === 'persons') {
            details = `Absent: ${entry.absentName} | Reason: ${entry.reason || '—'}`;
        }
        return `
            <div class="entry-card">
                <div class="entry-meta">
                    <span class="cat-badge">${entry.category}</span>
                    <span class="time-badge">${dateStr} · ${timeStr}</span>
                </div>
                <div class="entry-details">${details}</div>
                <button class="delete-btn" data-id="${entry.id}" data-category="${entry.category}" title="Delete entry">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>
        `;
    }).join('');

    // Bind delete events
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Permanently delete this entry?')) {
                deleteEntry(btn.dataset.id, btn.dataset.category);
            }
        });
    });
}

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
            details = `${e.subCategory||''} - Qty:${e.quantity||''} Person:${e.personName||''}`;
        } else if (e.category === 'samples') {
            details = `Sample:${e.sampleName} Color:${e.sampleColor} Person:${e.personName}`;
        } else if (e.category === 'cleaning') {
            details = `Size:${e.sizeGuzz} Person:${e.personName}`;
        } else if (e.category === 'persons') {
            details = `Absent:${e.absentName} Reason:${e.reason||''}`;
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
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `datavault_${period}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPeriod = btn.dataset.period;
        renderEntries(currentPeriod);
    });
});
document.getElementById('downloadBtn').addEventListener('click', () => downloadCSV(currentPeriod));

// Initial load
loadAllData();