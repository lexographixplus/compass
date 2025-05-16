document.addEventListener("DOMContentLoaded", function() {
    // --- Constants & Config ---
    const LS_PREFIX = 'communityCompass_';
    const LS_USER_INFO_KEY = LS_PREFIX + 'userInfo';
    const LS_ENTRIES_KEY = LS_PREFIX + 'entries';
    // TODO: Replace with your ACTUAL Google Apps Script Web App URL
    const SUBMIT_URL = "https://script.google.com/macros/s/AKfycbxaKyMdceTBGd13sYhchpDVCw03rBCPI_TkrgyI9Zq_MwXUTRoRUSLsykEXYkI0nLQk/exec"; // <<< User provided URL

    // --- App state ---
    const state = {
        currentSection: null,
        entries: { people: "", observations: "", principles: "", ideas: "", experiments: "" },
        userInfo: { name: "", email: "", community: "", country: "" },
        completedSections: 0,
        isSubmitting: false
    };

    // --- DOM Elements ---
    // (Select all elements as before)
    const homeScreen = document.getElementById("homeScreen");
    const appInterface = document.getElementById("appInterface");
    const mainContentArea = document.getElementById("mainContentArea");
    const compassView = document.getElementById("compassView");
    const summaryView = document.getElementById("summaryView");
    const helpView = document.getElementById("helpView");
    const welcomeForm = document.getElementById('welcomeForm');
    const userNameInput = document.getElementById('userName');
    const userEmailInput = document.getElementById('userEmail');
    const userCommunityInput = document.getElementById('userCommunity');
    const userCountryInput = document.getElementById('userCountry');
    const startButton = document.getElementById('startButton');
    const startButtonText = document.getElementById('startButtonText');
    const welcomeFormError = document.getElementById('welcomeFormError');
    const hamburgerButton = document.getElementById("hamburgerButton");
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const closeMobileMenuButton = document.getElementById("closeMobileMenuButton");
    const navHome = document.getElementById("nav-home");
    const navHomeTitle = document.getElementById("nav-home-title");
    const navSummary = document.getElementById("nav-summary");
    const navHelp = document.getElementById("nav-help");
    const navHelpIcon = document.getElementById("nav-help-icon");
    const navSummaryCard = document.getElementById("nav-summary-card");
    const progressBar = document.getElementById("progressBar");
    const progressIndicator = document.getElementById("progressIndicator");
    const slidingPanel = document.getElementById("slidingPanel");
    const panelOverlay = document.getElementById("panelOverlay");
    const closePanelButton = document.getElementById("closePanelButton");
    const panelTitle = document.getElementById("panelTitle");
    const panelIcon = document.getElementById("panelIcon");
    const panelQuestion = document.getElementById("panelQuestion");
    const panelExamples = document.getElementById("panelExamples");
    const panelTextArea = document.getElementById("panelTextArea");
    const characterCount = document.getElementById("characterCount");
    const saveButton = document.getElementById("saveButton");
    const resetButton = document.getElementById("resetButton");
    const collapsibleExamplesBtn = document.getElementById("collapsibleExamplesBtn");
    const examplesContainer = document.getElementById("examplesContainer");
    const examplesChevron = document.getElementById("examplesChevron");
    const summaryContent = document.getElementById("summaryContent");
    // const summaryExportPdfButton = document.getElementById("summaryExportPdfButton"); // REMOVED
    const backToHomeFromSummary = document.getElementById("backToHomeFromSummary");
    const finalizeButton = document.getElementById("finalizeButton"); // *** NEW BUTTON ID ***
    const finalizeButtonText = document.getElementById("finalizeButtonText"); // *** NEW TEXT SPAN ID ***
    const finalizeButtonSpinner = document.getElementById("finalizeButtonSpinner"); // *** NEW SPINNER ID ***
    const submitStatusMessage = document.getElementById("submitStatusMessage");
    const backToHomeFromHelp = document.getElementById("backToHomeFromHelp");
    const startOverButton = document.getElementById("startOverButton");
    const toastNotification = document.getElementById("toastNotification");
    const toastMessage = document.getElementById("toastMessage");
    const toastIcon = document.getElementById("toastIcon");

    // --- Section configuration ---
    const sectionConfig = {
        people: { title: "People", icon: '<i class="fas fa-users"></i>', question: "Who is involved or affected by this community work?", examples: ["Community Residents", "Local businesses", "Local leaders (formal & informal)", "Youth groups", "Women's groups", "Vulnerable populations", "Government agencies", "NGOs/Partners", "Potential funders"] },
        observations: { title: "Observations", icon: '<i class="fas fa-eye"></i>', question: "What's happening? Why? (Consider assets, challenges, dynamics)", examples: ["Observed strengths/assets (skills, resources, places)", "Community dynamics (how people interact)", "Cultural norms/traditions", "Existing activities/programs", "Challenges, needs, problems mentioned", "Recent changes or events", "Physical environment observations"] },
        principles: { title: "Principles", icon: '<i class="fas fa-compass"></i>', question: "What matters most? (Values guiding your decisions)", examples: ["Desired impact/outcomes", "Equity and inclusion", "Community ownership", "Sustainability (social, economic, environmental)", "Collaboration/Partnership", "Transparency", "Respect for local culture", "Feasibility/Resource constraints"] },
        ideas: { title: "Ideas", icon: '<i class="fas fa-lightbulb"></i>', question: "What ways are there to move forward or make improvements?", examples: ["Addressing identified challenges", "Building on existing assets/strengths", "New projects or programs", "Improving existing activities", "Potential partnerships", "Fundraising concepts", "Communication strategies", "Policy change suggestions"] },
        experiments: { title: "Experiments", icon: '<i class="fas fa-flask"></i>', question: "What's a small, concrete step to try and learn from?", examples: ["Pilot program/Small trial", "Community meeting/Focus group", "Survey/Questionnaire", "Skill-sharing workshop", "Pop-up event/demonstration", "Testing a message or approach", "Creating a prototype", "Mapping community assets"] }
    };

    // --- Local Storage Functions ---
    function saveUserInfoToStorage() {
        try {
            localStorage.setItem(LS_USER_INFO_KEY, JSON.stringify(state.userInfo));
        } catch (e) { console.error("Error saving user info:", e); showToast("Could not save user details.", "error"); }
    }
    function saveEntriesToStorage() {
        try {
            localStorage.setItem(LS_ENTRIES_KEY, JSON.stringify(state.entries));
        } catch (e) { console.error("Error saving entries:", e); showToast("Could not save progress.", "error"); }
    }
    function loadDataFromStorage() {
        let hasCompleteUserInfo = false;
        try {
            const savedUserInfo = localStorage.getItem(LS_USER_INFO_KEY);
            if (savedUserInfo) {
                const parsedInfo = JSON.parse(savedUserInfo);
                state.userInfo = { name: parsedInfo.name || "", email: parsedInfo.email || "", community: parsedInfo.community || "", country: parsedInfo.country || "" };
                if (state.userInfo.name && state.userInfo.email && state.userInfo.community && state.userInfo.country) { hasCompleteUserInfo = true; }
            } else { state.userInfo = { name: "", email: "", community: "", country: "" }; }

            const savedEntries = localStorage.getItem(LS_ENTRIES_KEY);
            if (savedEntries) {
                const parsedEntries = JSON.parse(savedEntries);
                Object.keys(state.entries).forEach(key => { state.entries[key] = parsedEntries.hasOwnProperty(key) ? parsedEntries[key] : ""; });
            } else { resetEntriesStateOnly(); }
        } catch (e) {
            console.error("Error loading data from localStorage:", e);
            state.userInfo = { name: "", email: "", community: "", country: "" };
            resetEntriesStateOnly();
            hasCompleteUserInfo = false;
        }
        updateCompletedSections();
        // *** ADDED MISSING RETURN STATEMENT ***
        return { hasUserInfo: hasCompleteUserInfo }; // Return the object expected by initApp
    }
    function clearAllStorage() {
        console.log("Clearing local storage...");
        localStorage.removeItem(LS_USER_INFO_KEY);
        localStorage.removeItem(LS_ENTRIES_KEY);
        console.log("Local storage cleared.");
    }

    // --- State Management ---
    function resetAppState() {
        console.log("Resetting application state...");
        state.userInfo = { name: "", email: "", community: "", country: "" };
        resetEntriesStateOnly();
        updateCompletedSections();
        console.log("Application state reset.");
    }
    function resetEntriesStateOnly() {
        Object.keys(state.entries).forEach(key => { state.entries[key] = ""; });
        state.completedSections = 0;
    }

    // --- UI Updates ---
    function updateCompletedSections() {
        let completed = 0;
        for (const section in state.entries) { if (state.entries[section] && state.entries[section].trim() !== "") { completed++; } }
        state.completedSections = completed;
        const totalSections = Object.keys(state.entries).length;
        const percentage = totalSections > 0 ? (completed / totalSections) * 100 : 0;
        if (progressBar) progressBar.style.width = `${percentage}%`;
        if (progressIndicator) progressIndicator.textContent = `${completed}/${totalSections} sections complete`;
    }
    let toastTimeout;
    function showToast(message, type = "success") {
        if (!toastNotification || !toastMessage || !toastIcon) return;
        clearTimeout(toastTimeout);
        toastMessage.textContent = message;
        toastIcon.className = `mr-3 text-xl fas ${type === 'error' ? 'fa-exclamation-circle text-red-400' : type === 'warning' ? 'fa-exclamation-triangle text-yellow-400' : 'fa-check-circle text-green-400'}`;
        toastNotification.classList.remove('bg-gray-800', 'bg-red-700', 'bg-yellow-600');
        toastNotification.classList.add(type === 'error' ? 'bg-red-700' : type === 'warning' ? 'bg-yellow-600' : 'bg-gray-800');
        toastNotification.classList.remove('translate-y-full', 'opacity-0');
        toastNotification.classList.add('translate-y-0', 'opacity-100');
        toastTimeout = setTimeout(() => {
            toastNotification.classList.remove('translate-y-0', 'opacity-100');
            toastNotification.classList.add('translate-y-full', 'opacity-0');
        }, 3500);
    }

    // --- Panel Logic ---
    function openSectionPanel(sectionName) {
        if (!sectionConfig[sectionName] || !slidingPanel) return;
        state.currentSection = sectionName;
        const config = sectionConfig[sectionName];
        if (panelTitle) panelTitle.textContent = config.title;
        if (panelIcon) panelIcon.innerHTML = config.icon;
        if (panelQuestion) panelQuestion.textContent = config.question;
        if (panelExamples) { panelExamples.innerHTML = ''; config.examples.forEach(ex => { const li = document.createElement('li'); li.textContent = ex; panelExamples.appendChild(li); }); }
        if (examplesContainer) examplesContainer.classList.add('hidden');
        if (examplesChevron) examplesChevron.classList.remove('rotate-180');
        if (panelTextArea) { panelTextArea.value = state.entries[sectionName] || ""; updateCharacterCount(); }
        slidingPanel.classList.remove('translate-x-full');
        if (panelOverlay) panelOverlay.classList.remove('hidden');
        setTimeout(() => { if (panelTextArea) panelTextArea.focus(); }, 300);
    }
    function closePanel() {
        if (!slidingPanel) return;
        slidingPanel.classList.add('translate-x-full');
        if (panelOverlay) panelOverlay.classList.add('hidden');
        state.currentSection = null;
    }
    function updateCharacterCount() { if (characterCount && panelTextArea) { characterCount.textContent = `${panelTextArea.value.length} characters`; } }

    // --- Navigation & View Management ---
    function navigateTo(viewName) {
        if (compassView) compassView.classList.add('hidden');
        if (summaryView) summaryView.classList.add('hidden');
        if (helpView) helpView.classList.add('hidden');
        document.querySelectorAll('.nav-link').forEach(link => { link.classList.remove('bg-teal-100', 'text-teal-700', 'font-semibold'); });
        if (state.currentSection && viewName !== 'home') { closePanel(); }

        let activeLink = null;
        switch (viewName) {
            case 'summary':
                generateSummary();
                if (summaryView) summaryView.classList.remove('hidden');
                activeLink = navSummary;
                break;
            case 'help':
                if (helpView) helpView.classList.remove('hidden');
                activeLink = navHelp;
                break;
            case 'home':
            default:
                if (compassView) compassView.classList.remove('hidden');
                activeLink = navHome;
                break;
        }
        if (activeLink) activeLink.classList.add('bg-teal-100', 'text-teal-700', 'font-semibold');
        if (sidebar && sidebarOverlay && window.innerWidth < 768 && !sidebar.classList.contains('-translate-x-full')) { closeMobileMenu(); }
        if (mainContentArea) mainContentArea.scrollTo(0, 0);
    }

    // --- Summary Generation ---
    function generateSummary() {
        if (!summaryContent) return;
        summaryContent.innerHTML = '';
        let hasAnyCompassContent = false;
        const userInfo = state.userInfo;
        const userInfoDiv = document.createElement('div');
        userInfoDiv.className = 'mb-6 pb-6 border-b border-gray-300';
        if (userInfo.name && userInfo.community) {
             userInfoDiv.innerHTML = `
                <div class="flex items-center mb-3"> <span class="text-xl text-teal-600 mr-3"><i class="fas fa-user-circle"></i></span> <h3 class="text-lg font-semibold text-gray-900">User Information</h3> </div>
                <div class="pl-9 space-y-1 text-gray-700 text-sm">
                    <p><strong>Name:</strong> ${escapeHtml(userInfo.name)}</p> <p><strong>Email:</strong> ${escapeHtml(userInfo.email)}</p> <p><strong>Community:</strong> ${escapeHtml(userInfo.community)}</p> <p><strong>Country:</strong> ${escapeHtml(userInfo.country)}</p>
                </div>`;
        } else { userInfoDiv.innerHTML = `<p class="text-gray-500 italic text-sm">User information incomplete. Please use 'Reset All Data' if needed.</p>`; }
        summaryContent.appendChild(userInfoDiv);

        for (const section in sectionConfig) {
            if (state.entries.hasOwnProperty(section)) {
                const sectionData = state.entries[section] || "";
                const isEmpty = sectionData.trim() === "";
                if (!isEmpty) hasAnyCompassContent = true;
                const secDiv = document.createElement('div');
                secDiv.className = 'summary-section mb-5 pb-5 border-b border-gray-300 last:border-b-0 last:pb-0 last:mb-0';
                secDiv.innerHTML = `
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center"> <span class="text-xl text-teal-600 mr-3 w-6 text-center">${sectionConfig[section].icon}</span> <h3 class="text-base font-semibold text-gray-800">${sectionConfig[section].title}</h3> </div>
                        <button class="summary-edit-btn text-xs text-teal-600 font-medium flex items-center py-1 px-2 rounded hover:bg-teal-50 hover:text-teal-800 transition duration-150 ease-in-out" data-section="${section}" aria-label="Edit ${sectionConfig[section].title}"> <i class="fas fa-edit mr-1"></i> Edit </button>
                    </div>
                    <div class="pl-9 text-gray-700 whitespace-pre-wrap text-sm ${isEmpty ? 'text-gray-400 italic' : ''}"> ${isEmpty ? 'No entry yet.' : escapeHtml(sectionData)} </div>`;
                summaryContent.appendChild(secDiv);
            }
        }
        if (!hasAnyCompassContent) { const p = document.createElement('p'); p.className = 'text-gray-500 text-center text-sm mt-4'; p.textContent = 'No compass entries added yet.'; summaryContent.appendChild(p); }

        // Update finalize button state
        if (finalizeButton) {
             const canSubmit = userInfo.name && userInfo.email && userInfo.community && userInfo.country && hasAnyCompassContent;
             finalizeButton.disabled = !canSubmit || state.isSubmitting;
             finalizeButton.title = canSubmit ? "Submit entry to database and download PDF" : "Please complete user info and add at least one compass entry to finalize.";
        }
         if (submitStatusMessage) { submitStatusMessage.textContent = ''; submitStatusMessage.className = 'text-sm text-center mb-4 hidden'; }
    }
    function escapeHtml(unsafe) { if (typeof unsafe !== 'string') return unsafe; return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }

    // --- PDF Export ---
    function exportToPdf() {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') { showToast('Error: PDF library not loaded.', 'error'); console.error('jsPDF library is not available.'); return; }
        try {
            const { jsPDF } = window.jspdf; const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' }); let y = 15; const pageH = doc.internal.pageSize.getHeight(); const pageW = doc.internal.pageSize.getWidth(); const margin = 15; const contentW = pageW - (margin * 2); const lineH = 5;
            function checkPg(neededHeight) { if (y + neededHeight > pageH - margin) { doc.addPage(); y = margin; } }
            doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.text('Community Compass Summary', pageW / 2, y, { align: 'center' }); y += 10;
            doc.setFontSize(10); doc.setFont('helvetica', 'normal'); const name = state.userInfo.name || 'N/A'; const email = state.userInfo.email || 'N/A'; const community = state.userInfo.community || 'N/A'; const country = state.userInfo.country || 'N/A';
            let userInfoText = `Name: ${name}   |   Community: ${community}`; if (email !== 'N/A') userInfoText += `\nEmail: ${email}`; if (country !== 'N/A') userInfoText += `   |   Country: ${country}`; userInfoText += `\nGenerated on: ${new Date().toLocaleDateString()}`;
            const userInfoLines = doc.splitTextToSize(userInfoText, contentW); const userInfoH = userInfoLines.length * lineH; checkPg(userInfoH + 5); doc.text(userInfoLines, margin, y); y += userInfoH + 5;
            doc.setLineWidth(0.2); doc.line(margin, y, pageW - margin, y); y += 8;
            doc.setFontSize(12);
            for (const section in sectionConfig) { if (state.entries.hasOwnProperty(section)) { const txt = state.entries[section]; if (txt && txt.trim() !== "") { const title = sectionConfig[section].title; const titleH = 7; doc.setFont('helvetica', 'normal'); const lines = doc.splitTextToSize(txt, contentW); const contentH = lines.length * lineH; checkPg(titleH + contentH + 5); doc.setFont('helvetica', 'bold'); doc.text(title, margin, y); y += titleH; doc.setFont('helvetica', 'normal'); doc.text(lines, margin, y); y += contentH + 5; } } }
            const safeCommunityName = (community || 'Community').replace(/[^a-zA-Z0-9]/g, '_'); const filename = `${safeCommunityName}_Compass_Summary_${new Date().toISOString().slice(0,10)}.pdf`; doc.save(filename);
        } catch (err) { console.error("Error generating PDF:", err); showToast(`PDF Generation Error: ${err.message}`, 'error'); }
    }

    // --- Start Over / Reset ---
    function startOver() {
        if (confirm('Are you sure you want to clear ALL locally saved data (User Info and Compass Entries) and return to the welcome screen? This cannot be undone.')) {
            clearAllStorage(); resetAppState(); updateCompletedSections(); closePanel(); closeMobileMenu();
            if (appInterface) appInterface.classList.add('hidden'); if (homeScreen) homeScreen.classList.remove('hidden');
            if (welcomeForm) welcomeForm.reset(); hideWelcomeError();
            showToast('All local data cleared. Ready to start fresh!');
        }
    }

    // --- Mobile Menu ---
    function openMobileMenu() { if (sidebar) sidebar.classList.remove('-translate-x-full'); if (sidebarOverlay) sidebarOverlay.classList.remove('hidden'); }
    function closeMobileMenu() { if (sidebar) sidebar.classList.add('-translate-x-full'); if (sidebarOverlay) sidebarOverlay.classList.add('hidden'); }

    // --- Welcome Form Helper Functions ---
    function displayWelcomeError(message) { if (!welcomeFormError) return; welcomeFormError.textContent = message; welcomeFormError.classList.remove('hidden'); }
    function hideWelcomeError() { if (!welcomeFormError) return; welcomeFormError.classList.add('hidden'); }

    // --- Welcome Form Submission (REVISED) ---
    function handleWelcomeSubmit(event) {
        event.preventDefault();
        hideWelcomeError();
        const name = userNameInput?.value.trim() || ""; const email = userEmailInput?.value.trim() || ""; const community = userCommunityInput?.value.trim() || ""; const country = userCountryInput?.value.trim() || "";
        if (!name || !email || !community || !country) { displayWelcomeError('Please fill in all fields.'); return; }
        if (!/\S+@\S+\.\S+/.test(email)) { displayWelcomeError('Please enter a valid email address.'); return; }
        state.userInfo = { name, email, community, country }; saveUserInfoToStorage();
        loadDataFromStorage(); console.log("User info saved locally:", state.userInfo);
        if (homeScreen) homeScreen.classList.add('hidden'); if (appInterface) appInterface.classList.remove('hidden');
        navigateTo('home'); showToast(`Welcome, ${name}! Your session has started.`);
    }

    // --- Finalize (Submit & Download) ---
    async function finalizeAndDownload() {
        if (state.isSubmitting) { showToast("Action already in progress...", "warning"); return; }
        const userInfo = state.userInfo; const entries = state.entries; const hasContent = Object.values(entries).some(entry => entry && entry.trim() !== "");
        if (!userInfo.name || !userInfo.email || !userInfo.community || !userInfo.country || !hasContent) { showToast("Please ensure user details are complete and at least one compass section has content.", "error"); if (finalizeButton) finalizeButton.disabled = true; return; }
        const submissionData = { ...userInfo, ...entries };
        state.isSubmitting = true; if (finalizeButton) finalizeButton.disabled = true; if (finalizeButtonText) finalizeButtonText.textContent = 'Processing...'; if (finalizeButtonSpinner) finalizeButtonSpinner.classList.remove('hidden');
        if (submitStatusMessage) { submitStatusMessage.textContent = 'Submitting entry to database...'; submitStatusMessage.className = 'text-sm text-center mb-4 text-blue-600'; submitStatusMessage.classList.remove('hidden'); }
        console.log("--- Finalizing: Submitting & Downloading ---"); console.log("URL:", SUBMIT_URL); console.log("Data:", JSON.stringify(submissionData, null, 2));
        let submissionSuccess = false;
        try {
            if (!SUBMIT_URL || SUBMIT_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL") { throw new Error("Submission URL is not configured in script.js."); }
            const response = await fetch(SUBMIT_URL, { method: 'POST', mode: 'no-cors', cache: 'no-cache', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(submissionData) });
            console.log("Submission request sent (no-cors mode). Assuming success if no error.");
            submissionSuccess = true;
            if (submitStatusMessage) { submitStatusMessage.textContent = 'Submission sent! Preparing PDF download...'; submitStatusMessage.className = 'text-sm text-center mb-4 text-green-600'; }
            showToast("Submission sent successfully!", "success");
        } catch (error) {
            console.error('Error during submission fetch:', error); showToast(`Submission Error: ${error.message}. PDF will not be downloaded.`, "error");
            if (submitStatusMessage) { submitStatusMessage.textContent = `Network Error: ${error.message}. Submission failed.`; submitStatusMessage.className = 'text-sm text-center mb-4 text-red-600'; }
            submissionSuccess = false;
        } finally {
            if (submissionSuccess) {
                try { console.log("Attempting PDF download..."); exportToPdf(); if (submitStatusMessage) { submitStatusMessage.textContent = 'Submission sent & PDF download initiated.'; submitStatusMessage.className = 'text-sm text-center mb-4 text-green-600'; } }
                catch (pdfError) { console.error('Error during PDF export:', pdfError); showToast(`PDF Export Error: ${pdfError.message}`, "error"); if (submitStatusMessage) { submitStatusMessage.textContent = 'Submission sent, but PDF download failed.'; submitStatusMessage.className = 'text-sm text-center mb-4 text-yellow-600'; } }
            }
            state.isSubmitting = false; if (finalizeButtonText) finalizeButtonText.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Finalize & Download'; if (finalizeButtonSpinner) finalizeButtonSpinner.classList.add('hidden');
            generateSummary(); // Re-evaluate button state
        }
    }

    // ===== Event Listeners =====
    welcomeForm?.addEventListener('submit', handleWelcomeSubmit);
    hamburgerButton?.addEventListener('click', openMobileMenu);
    closeMobileMenuButton?.addEventListener('click', closeMobileMenu);
    sidebarOverlay?.addEventListener('click', closeMobileMenu);
    navHome?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('home'); });
    navHomeTitle?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('home'); });
    navSummary?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('summary'); });
    navSummaryCard?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('summary'); });
    navHelp?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('help'); });
    navHelpIcon?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('help'); });
    backToHomeFromSummary?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('home'); });
    backToHomeFromHelp?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('home'); });
    document.querySelectorAll('.sidebar-link, .quick-access-card').forEach(link => { if(link.dataset.section) { link.addEventListener('click', (e) => { e.preventDefault(); const section = link.dataset.section; if (section && sectionConfig[section]) { if (!compassView || compassView.classList.contains('hidden')) { navigateTo('home'); setTimeout(() => openSectionPanel(section), 150); } else { openSectionPanel(section); } if (window.innerWidth < 768) closeMobileMenu(); } else { console.warn("Link/Card clicked without valid section:", section); } }); } });
    closePanelButton?.addEventListener('click', closePanel);
    panelOverlay?.addEventListener('click', closePanel);
    panelTextArea?.addEventListener('input', updateCharacterCount);
    saveButton?.addEventListener('click', () => { if (state.currentSection && panelTextArea) { state.entries[state.currentSection] = panelTextArea.value; updateCompletedSections(); saveEntriesToStorage(); const title = sectionConfig[state.currentSection]?.title || 'Section'; closePanel(); showToast(`${title} entry saved locally.`); } else { closePanel(); } });
    resetButton?.addEventListener('click', () => { if (panelTextArea && confirm('Clear text in this section?')) { panelTextArea.value = ''; updateCharacterCount(); panelTextArea.focus(); } });
    collapsibleExamplesBtn?.addEventListener('click', () => { if (!examplesContainer || !examplesChevron) return; const isHidden = examplesContainer.classList.contains('hidden'); examplesContainer.classList.toggle('hidden', !isHidden); examplesChevron.classList.toggle('rotate-180', !isHidden); });
    summaryContent?.addEventListener('click', (e) => { const btn = e.target.closest('.summary-edit-btn'); if (btn) { e.preventDefault(); const section = btn.dataset.section; if (section && sectionConfig[section]) { if (!compassView || compassView.classList.contains('hidden')) { navigateTo('home'); setTimeout(() => openSectionPanel(section), 150); } else { openSectionPanel(section); } } } });
    // summaryExportPdfButton?.addEventListener('click', exportToPdf); // REMOVED Listener
    startOverButton?.addEventListener('click', startOver);
    finalizeButton?.addEventListener('click', finalizeAndDownload); // *** UPDATED LISTENER ***

    // ===== Initialize the App =====
    function initApp() {
        console.log("Initializing app...");
        // *** ERROR OCCURS HERE because loadDataFromStorage doesn't return object ***
        const { hasUserInfo } = loadDataFromStorage();
        if (slidingPanel) slidingPanel.classList.add('translate-x-full');
        if (panelOverlay) panelOverlay.classList.add('hidden');
        if (sidebarOverlay) sidebarOverlay.classList.add('hidden');
        if (sidebar) sidebar.classList.add('-translate-x-full');
        if (hasUserInfo) {
            console.log("User info found, showing main app interface.");
            if (homeScreen) homeScreen.classList.add('hidden');
            if (appInterface) appInterface.classList.remove('hidden');
            navigateTo('home');
        } else {
            console.log("No complete user info found, showing welcome screen.");
            if (homeScreen) homeScreen.classList.remove('hidden');
            if (appInterface) appInterface.classList.add('hidden');
            if (welcomeForm) welcomeForm.reset();
        }
        if (examplesContainer) examplesContainer.classList.add('hidden');
        if (examplesChevron) examplesChevron.classList.remove('rotate-180');
        console.log("App initialized.");
    }

    // --- Run Initialization ---
    initApp();

}); // End DOMContentLoaded
