// ==================== PARTICLES ====================
(function() {
    const container = document.getElementById('bgParticles');
    const colors = ['rgba(0,229,255,0.5)', 'rgba(180,77,255,0.5)', 'rgba(255,61,127,0.4)',
        'rgba(0,234,199,0.4)', 'rgba(255,183,77,0.3)'];
    for (let i = 0; i < 35; i++) {
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

// ==================== LIVE TIMESTAMP ====================
function updateLiveTimestamp() {
    const now = new Date();
    document.getElementById('liveTimeText').textContent =
        now.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) +
        ' | ' + now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });
}
updateLiveTimestamp();
setInterval(updateLiveTimestamp, 1000);

// ==================== TOAST ====================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

// ==================== CATEGORY & COLLAPSIBLE ====================
let currentCategory = 'items';
const formSections = {
    items: document.getElementById('itemsForm'),
    samples: document.getElementById('samplesForm'),
    cleaning: document.getElementById('cleaningForm'),
    persons: document.getElementById('personsForm'),
};

document.getElementById('categoryTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.cat-tab');
    if (!tab) return;
    currentCategory = tab.dataset.cat;
    document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    Object.keys(formSections).forEach(k => {
        formSections[k].style.display = k === currentCategory ? '' : 'none';
        formSections[k].classList.toggle('open', k === currentCategory);
    });
    if (currentCategory === 'items') renderItemsDynamicFields();
    const firstInput = formSections[currentCategory]?.querySelector('input[type="text"], input[type="number"]');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
});

document.getElementById('formContainer').addEventListener('click', (e) => {
    const header = e.target.closest('.collapsible-header');
    if (header) header.closest('.collapsible').classList.toggle('open');
});

// ==================== IN/OUT TOGGLES ====================
let itemsInOut = 'in', samplesInOut = 'in', cleaningInOut = 'in';

function setupToggle(containerId, stateObj, key) {
    const container = document.getElementById(containerId);
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('.toggle-btn');
        if (!btn) return;
        container.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active-in','active-out'));
        const val = btn.dataset.val;
        btn.classList.add(val === 'in' ? 'active-in' : 'active-out');
        stateObj[key] = val;
    });
}
setupToggle('itemsInOut', { itemsInOut }, 'itemsInOut');
setupToggle('samplesInOut', { samplesInOut }, 'samplesInOut');
setupToggle('cleaningInOut', { cleaningInOut }, 'cleaningInOut');

// ==================== DYNAMIC ITEMS FIELDS ====================
function renderItemsDynamicFields() {
    const subCat = document.getElementById('itemsSubCat').value;
    const container = document.getElementById('itemsDynamicFields');
    let html = '';
    const fieldRow = (fields) => {
        let r = '<div class="form-row">';
        fields.forEach(f => {
            r += `<div><label>${f.label}</label><input type="${f.type||'text'}" id="${f.id}" placeholder="${f.placeholder||''}" autocomplete="off"></div>`;
        });
        r += '</div>';
        return r;
    };

    switch(subCat) {
        case 'thread':
            html += fieldRow([{label:'Quantity',id:'threadQty',type:'number',placeholder:'Qty'},{label:'Person Name',id:'threadPerson'}]);
            html += fieldRow([{label:'Color (Optional)',id:'threadColor',placeholder:'Optional color'}]);
            break;
        case 'cdSequence':
            html += fieldRow([{label:'Quantity',id:'cdQty',type:'number',placeholder:'Qty'},{label:'Person Name',id:'cdPerson'}]);
            html += fieldRow([{label:'Color (Optional)',id:'cdColor',placeholder:'Optional color'}]);
            break;
        case 'roleFussing':
            html += fieldRow([{label:'Quantity',id:'roleQty',type:'number',placeholder:'Qty'},{label:'Person Name',id:'rolePerson'}]);
            html += fieldRow([{label:'Color (Optional)',id:'roleColor',placeholder:'Optional color'}]);
            break;
        case 'bobbin':
            html += fieldRow([{label:'Quantity',id:'bobbinQty',type:'number',placeholder:'Qty'},{label:'Color',id:'bobbinColor',placeholder:'Color'}]);
            html += fieldRow([{label:'Person Name',id:'bobbinPerson',placeholder:'Person'}]);
            break;
        case 'cone':
            html += fieldRow([{label:'Quantity',id:'coneQty',type:'number',placeholder:'Qty'},{label:'Grade Number',id:'coneGrade',placeholder:'Grade #'}]);
            html += fieldRow([{label:'Person Name',id:'conePerson',placeholder:'Person'},{label:'Color (Optional)',id:'coneColor',placeholder:'Optional color'}]);
            html += '<div class="form-row full"><div><label>Optional Data</label><input type="text" id="coneOptional" placeholder="Any additional data"></div></div>';
            break;
        case 'colySequence':
            html += fieldRow([{label:'Quantity',id:'colyQty',type:'number',placeholder:'Qty'},{label:'Color',id:'colyColor',placeholder:'Color'}]);
            html += fieldRow([{label:'Person Name',id:'colyPerson',placeholder:'Person'}]);
            break;
        case 'otherItem':
            html += fieldRow([{label:'Item Name',id:'otherName',placeholder:'Optional name'},{label:'Color',id:'otherColor',placeholder:'Optional color'}]);
            html += fieldRow([{label:'Size',id:'otherSize',placeholder:'Optional size'},{label:'Quantity',id:'otherQty',type:'number',placeholder:'Optional qty'}]);
            html += fieldRow([{label:'Person Name',id:'otherPerson',placeholder:'Optional person'},{label:'Notes',id:'otherNotes',placeholder:'Any extra info'}]);
            break;
    }
    container.innerHTML = html;
}
document.getElementById('itemsSubCat').addEventListener('change', renderItemsDynamicFields);
renderItemsDynamicFields();

// ==================== DATA GATHERING ====================
function getEntryData(category) {
    const now = new Date();
    const base = {
        id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        timestamp: now.toISOString(),
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        category: category,
    };
    const getVal = (id) => document.getElementById(id)?.value.trim() || '';

    if (category === 'items') {
        const subCat = document.getElementById('itemsSubCat').value;
        base.subCategory = subCat;
        base.inOut = itemsInOut;
        switch(subCat) {
            case 'thread': base.quantity = getVal('threadQty'); base.personName = getVal('threadPerson'); base.color = getVal('threadColor'); break;
            case 'cdSequence': base.quantity = getVal('cdQty'); base.personName = getVal('cdPerson'); base.color = getVal('cdColor'); break;
            case 'roleFussing': base.quantity = getVal('roleQty'); base.personName = getVal('rolePerson'); base.color = getVal('roleColor'); break;
            case 'bobbin': base.quantity = getVal('bobbinQty'); base.color = getVal('bobbinColor'); base.personName = getVal('bobbinPerson'); break;
            case 'cone': base.quantity = getVal('coneQty'); base.gradeNumber = getVal('coneGrade'); base.personName = getVal('conePerson'); base.color = getVal('coneColor'); base.optionalData = getVal('coneOptional'); break;
            case 'colySequence': base.quantity = getVal('colyQty'); base.color = getVal('colyColor'); base.personName = getVal('colyPerson'); break;
            case 'otherItem': base.itemName = getVal('otherName'); base.color = getVal('otherColor'); base.size = getVal('otherSize'); base.quantity = getVal('otherQty'); base.personName = getVal('otherPerson'); base.notes = getVal('otherNotes'); break;
        }
    } else if (category === 'samples') {
        base.inOut = samplesInOut;
        base.sampleName = getVal('sampleName'); base.sampleColor = getVal('sampleColor'); base.personName = getVal('samplePerson');
    } else if (category === 'cleaning') {
        base.inOut = cleaningInOut;
        base.sizeGuzz = getVal('cleaningSize'); base.personName = getVal('cleaningPerson');
    } else if (category === 'persons') {
        base.absentName = getVal('absentName'); base.reason = getVal('absentReason'); base.inOut = 'absent';
    }
    return base;
}

function clearForm(category) {
    if (category === 'items') {
        document.getElementById('itemsSubCat').value = 'thread';
        renderItemsDynamicFields();
        resetToggle('itemsInOut', 'in'); itemsInOut = 'in';
    } else if (category === 'samples') {
        ['sampleName','sampleColor','samplePerson'].forEach(id => document.getElementById(id).value = '');
        resetToggle('samplesInOut', 'in'); samplesInOut = 'in';
    } else if (category === 'cleaning') {
        ['cleaningSize','cleaningPerson'].forEach(id => document.getElementById(id).value = '');
        resetToggle('cleaningInOut', 'in'); cleaningInOut = 'in';
    } else if (category === 'persons') {
        ['absentName','absentReason'].forEach(id => document.getElementById(id).value = '');
    }
    const firstInput = formSections[category]?.querySelector('input[type="text"], input[type="number"]');
    if (firstInput) firstInput.focus();
}

function resetToggle(containerId, defaultVal) {
    const container = document.getElementById(containerId);
    container.querySelectorAll('.toggle-btn').forEach(b => {
        b.classList.remove('active-in','active-out');
        if (b.dataset.val === defaultVal) b.classList.add('active-in');
    });
}

// ==================== SAVE TO GITHUB API ====================
async function saveEntry(category) {
    const entry = getEntryData(category);

    // Validation
    if (category === 'items') {
        const sub = entry.subCategory;
        if (sub !== 'otherItem') {
            if (!entry.personName || !entry.quantity) return showToast('⚠️ Fill Quantity and Person Name', 'error');
            if ((sub === 'bobbin' || sub === 'colySequence') && !entry.color) return showToast('⚠️ Fill Color', 'error');
            if (sub === 'cone' && !entry.gradeNumber) return showToast('⚠️ Fill Grade Number', 'error');
        }
    } else if (category === 'samples') {
        if (!entry.sampleName || !entry.personName) return showToast('⚠️ Fill Sample Name and Person', 'error');
    } else if (category === 'cleaning') {
        if (!entry.sizeGuzz || !entry.personName) return showToast('⚠️ Fill Size and Person Name', 'error');
    } else if (category === 'persons') {
        if (!entry.absentName) return showToast('⚠️ Fill Absent Person Name', 'error');
    }

    const btn = document.getElementById('btnSubmit' + category.charAt(0).toUpperCase() + category.slice(1));
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Syncing...';

    try {
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, entry })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Save failed');
        showToast('✅ Entry saved to GitHub', 'success');
        clearForm(category);
    } catch (err) {
        showToast('❌ ' + err.message, 'error');
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-shimmer"></span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Save to GitHub';
    }
}

document.getElementById('btnSubmitItems').addEventListener('click', () => saveEntry('items'));
document.getElementById('btnSubmitSamples').addEventListener('click', () => saveEntry('samples'));
document.getElementById('btnSubmitCleaning').addEventListener('click', () => saveEntry('cleaning'));
document.getElementById('btnSubmitPersons').addEventListener('click', () => saveEntry('persons'));

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        saveEntry(currentCategory);
    }
});