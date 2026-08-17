const originalWarn = console.warn;
console.warn = function (...args) {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('standardFontDataUrl')) {
        return;
    }
    originalWarn.apply(console, args);
};

// Set the standardFontDataUrl BEFORE any PDF parsing operations take place
if (window['pdfjs-dist/build/pdf']) {
    window['pdfjs-dist/build/pdf'].GlobalWorkerOptions.standardFontDataUrl =
        'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/';
} else if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.standardFontDataUrl =
        'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/';
}

lucide.createIcons();

const fileInput = document.getElementById('fileInput');
const dropArea = document.getElementById('drop-area');
const statusArea = document.getElementById('status');
const fileNameDisp = document.getElementById('fileName');
const fileSizeDisp = document.getElementById('fileSize');
const uploadBtn = document.getElementById('uploadBtn');
const progressBar = document.getElementById('progressBar');
const progressContainer = document.getElementById('progressContainer');

// Result Dashboard Elements
const resultsContainer = document.getElementById('resultsContainer');
const resScore = document.getElementById('resScore');
const resName = document.getElementById('resName');
const resSummary = document.getElementById('resSummary');
const resSkills = document.getElementById('resSkills');
const resStatus = document.getElementById('resStatus');

dropArea.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        fileNameDisp.innerText = file.name;
        fileSizeDisp.innerText = (file.size / (1024 * 1024)).toFixed(2) + ' MB • Verified';
        statusArea.classList.remove('hidden');
        progressContainer.classList.add('hidden');
        dropArea.classList.add('hidden');
    }
};

const resetUI = () => {
    fileInput.value = "";
    statusArea.classList.add('hidden');
    dropArea.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
    progressBar.style.width = '0%';
};

uploadBtn.onclick = async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);

    uploadBtn.disabled = true;
    uploadBtn.innerHTML = `<i data-lucide="loader-2" class="animate-spin w-4 h-4"></i> Analyzing...`;
    lucide.createIcons();

    progressContainer.classList.remove('hidden');
    setTimeout(() => { progressBar.style.width = '75%'; }, 100);

    try {
        const response = await fetch('http://localhost:5678/webhook-test/50f24481-550e-4ba5-8d31-eb1042de4789', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            let responseData = await response.json();

            // Console debug
            console.log("n8n Raw Response:", responseData);

            // 1. Array یا Normal Object کو Handle کریں
            let rawObj = Array.isArray(responseData) ? responseData[0] : responseData;
            
            // 2. n8n کی طرف سے اکثر 'body' کے اندر اصل ڈیٹا آتا ہے
            const data = rawObj.body ? rawObj.body : rawObj;

            // Candidate Name
            const name = data.candidateName || data.candidate_name || data.name || 'Candidate Name Not Found';
            if (resName) resName.innerText = name;

            // Score
            const scoreVal = (data.score !== undefined && data.score !== null) ? Number(data.score) : 0;
            if (resScore) resScore.innerText = (data.score !== undefined && data.score !== null) ? `${scoreVal}%` : 'N/A';

            // Summary
            if (resSummary) resSummary.innerText = data.summary || 'Audit evaluation complete.';

            // Status Check
            if (resStatus) {
                const auditStatus = data.status || (scoreVal >= 70 ? 'Selected' : 'Rejected');
                if (auditStatus.toLowerCase() === 'selected') {
                    resStatus.innerText = 'Selected';
                    resStatus.className = 'text-xs font-bold px-3 py-1.5 rounded-lg border w-max bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                } else {
                    resStatus.innerText = 'Rejected';
                    resStatus.className = 'text-xs font-bold px-3 py-1.5 rounded-lg border w-max bg-rose-500/10 text-rose-400 border-rose-500/30';
                }
            }

            // Skills Section
            if (resSkills) {
                let skillsArray = [];
                const rawSkills = data.skills || data.Skills || data.core_skills || data.technical_skills || [];

                if (Array.isArray(rawSkills)) {
                    skillsArray = rawSkills;
                } else if (typeof rawSkills === 'string') {
                    try {
                        const parsed = JSON.parse(rawSkills);
                        skillsArray = Array.isArray(parsed) ? parsed : rawSkills.split(',').map(s => s.trim());
                    } catch (e) {
                        skillsArray = rawSkills.split(',').map(s => s.trim());
                    }
                }

                // Filter valid clean items
                skillsArray = skillsArray
                    .map(s => (typeof s === 'string' ? s.trim() : String(s)))
                    .filter(s => s.length > 0 && s.toLowerCase() !== 'null');

                if (skillsArray.length > 0) {
                    resSkills.innerHTML = skillsArray
                        .map(skill => `<span class="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-mono font-medium inline-block m-0.5">${skill}</span>`)
                        .join('');
                } else {
                    resSkills.innerHTML = '<span class="text-xs text-zinc-500 italic">No core competencies identified in this resume.</span>';
                }
            }

            progressBar.style.width = '100%';

            setTimeout(() => {
                resultsContainer.classList.remove('hidden');
                lucide.createIcons();
                resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 600);

        } else {
            alert('System Error: Infrastructure response failed.');
            resetUI();
        }
    } catch (err) {
        console.error("Fetch Error:", err);
        alert('Fatal: Remote host connection refused. Ensure n8n is running.');
        resetUI();
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = `<span>Initialize AI Audit</span> <i data-lucide="sparkles" class="w-4 h-4"></i>`;
        lucide.createIcons();
    }
};