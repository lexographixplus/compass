// admin.js

// Import only Firebase Auth module from firebase-config.js
import { auth } from './firebase-config.js'; // Ensure this path is correct

// Import only necessary Auth functions from Firebase SDK
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// --- Google Apps Script URL for fetching data ---
// This URL should be configured in your Google Apps Script to handle GET requests
// and return the sheet data as a JSON array.
const GOOGLE_SHEET_FETCH_URL = "https://script.google.com/macros/s/AKfycbxaKyMdceTBGd13sYhchpDVCw03rBCPI_TkrgyI9Zq_MwXUTRoRUSLsykEXYkI0nLQk/exec";

// --- DOM Elements ---
const loginSection = document.getElementById('login-section');
const dataSection = document.getElementById('data-section');
const manualLoginForm = document.getElementById('manual-login-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginButton = document.getElementById('login-button');
const loginButtonText = document.getElementById('login-button-text');
const loginSpinner = document.getElementById('login-spinner');
const loginErrorMessage = document.getElementById('login-error-message');
const loginMessage = document.getElementById('login-message');

const userInfo = document.getElementById('user-info');
const userEmailDisplay = document.getElementById('user-email');
const logoutButton = document.getElementById('logout-button');

// Data display elements
const searchNameInput = document.getElementById('search-name');
const searchEmailInput = document.getElementById('search-email');
const searchCommunityInput = document.getElementById('search-community');
const searchCountryInput = document.getElementById('search-country');

const loadingIndicator = document.getElementById('loading-indicator');
const errorMessageDiv = document.getElementById('error-message-div'); // Updated ID
const errorTextP = document.getElementById('error-text-p'); // Updated ID
const retryButton = document.getElementById('retry-button');
const noResultsMessage = document.getElementById('no-results-message');
const tableContainer = document.getElementById('table-container');
const dataTableBody = document.getElementById('data-table-body');
const totalEntriesP = document.getElementById('total-entries');

// Modal elements
const detailModalOverlay = document.getElementById('detail-modal-overlay');
const modalCloseButton = document.getElementById('modal-close-button'); // Updated ID
const modalTimestamp = document.getElementById('modal-timestamp');
const modalName = document.getElementById('modal-name');
const modalEmail = document.getElementById('modal-email');
const modalCommunity = document.getElementById('modal-community');
const modalCountry = document.getElementById('modal-country');
const modalPeople = document.getElementById('modal-people');
const modalObservations = document.getElementById('modal-observations');
const modalPrinciples = document.getElementById('modal-principles');
const modalIdeas = document.getElementById('modal-ideas');
const modalExperiments = document.getElementById('modal-experiments');

// --- Global State ---
let allSheetEntries = []; // To store all fetched entries for client-side filtering

// --- Helper Functions ---
function showElement(el) { if (el) el.classList.remove('hidden'); }
function hideElement(el) { if (el) el.classList.add('hidden'); }
function setText(el, text) { if (el) el.textContent = text; }
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string' && typeof unsafe !== 'number') return ''; // Handle non-strings/numbers
    return String(unsafe) // Ensure it's a string
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// --- Firebase Auth Listener ---
onAuthStateChanged(auth, user => {
    if (user) {
        console.log("User is signed in:", user.email);
        showElement(dataSection);
        showElement(userInfo);
        hideElement(loginSection);
        setText(userEmailDisplay, user.email);
        fetchSheetEntries(); // Fetch data from Google Sheets
    } else {
        console.log("User is signed out.");
        hideElement(dataSection);
        hideElement(userInfo);
        showElement(loginSection);
        setText(userEmailDisplay, '');
        if(dataTableBody) dataTableBody.innerHTML = '';
        allSheetEntries = [];
        if(totalEntriesP) setText(totalEntriesP, '');
    }
    if(loginButton) loginButton.disabled = false;
    if(loginSpinner) hideElement(loginSpinner);
    if(loginButtonText) setText(loginButtonText, 'Sign in');
    if(loginErrorMessage) hideElement(loginErrorMessage);
});

// --- Login Logic ---
if (manualLoginForm) {
    manualLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginButton.disabled = true;
        showElement(loginSpinner);
        setText(loginButtonText, 'Signing in...');
        hideElement(loginErrorMessage);
        const email = loginEmailInput.value.trim();
        const password = loginPasswordInput.value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log("Login attempt successful for:", email);
        } catch (error) {
            console.error("Login error:", error);
            setText(loginErrorMessage, `Login failed: ${error.message}`);
            showElement(loginErrorMessage);
            loginButton.disabled = false;
            hideElement(loginSpinner);
            setText(loginButtonText, 'Sign in');
        }
    });
}

// --- Logout Logic ---
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            console.log("Logout successful.");
        } catch (error) {
            console.error("Logout error:", error);
            alert("Error signing out. Please try again.");
        }
    });
}

// --- Data Fetching from Google Sheets ---
async function fetchSheetEntries() {
    if (!loadingIndicator || !errorMessageDiv || !tableContainer || !dataTableBody || !noResultsMessage || !errorTextP) {
        console.error("One or more UI elements for data display are missing.");
        return;
    }
    showElement(loadingIndicator);
    hideElement(errorMessageDiv);
    hideElement(tableContainer);
    hideElement(noResultsMessage);
    dataTableBody.innerHTML = '';

    try {
        console.log(`Fetching entries from Google Sheet: ${GOOGLE_SHEET_FETCH_URL}`);
        const response = await fetch(GOOGLE_SHEET_FETCH_URL);
        if (!response.ok) {
            // Try to get more specific error from response if possible
            let errorDetails = `HTTP error! Status: ${response.status}`;
            try {
                const errorData = await response.json(); // Or .text() if not JSON
                errorDetails += ` - ${errorData.error || errorData.message || JSON.stringify(errorData)}`;
            } catch (e) { /* Ignore if response body can't be parsed */ }
            throw new Error(errorDetails);
        }
        const data = await response.json();
        console.log("Data received from Google Sheet:", data);

        if (!Array.isArray(data)) {
            throw new Error("Data from Google Sheet is not in the expected array format.");
        }

        allSheetEntries = data; // Assuming data is an array of entry objects
        filterAndRenderEntries();

    } catch (error) {
        console.error("Error fetching entries from Google Sheet:", error);
        setText(errorTextP, `Failed to load entries: ${error.message}. Check console for details, ensure the Apps Script URL is correct, and the script is deployed to allow anonymous GET requests if not handling auth.`);
        showElement(errorMessageDiv);
        if(totalEntriesP) setText(totalEntriesP, "Error loading data");
    } finally {
        hideElement(loadingIndicator);
    }
}

// --- Filtering and Rendering ---
function filterAndRenderEntries() {
    if (!dataTableBody || !noResultsMessage || !tableContainer || !totalEntriesP || !searchNameInput || !searchEmailInput || !searchCommunityInput || !searchCountryInput) {
        console.error("Cannot filter/render, one or more UI elements are missing.");
        return;
    }
    hideElement(noResultsMessage);
    dataTableBody.innerHTML = '';

    const nameFilter = searchNameInput.value.toLowerCase().trim();
    const emailFilter = searchEmailInput.value.toLowerCase().trim();
    const communityFilter = searchCommunityInput.value.toLowerCase().trim();
    const countryFilter = searchCountryInput.value.toLowerCase().trim();

    const filtered = allSheetEntries.filter(entry => {
        // Assuming your Google Sheet data has these exact keys (case-sensitive)
        // Adjust keys if your Apps Script returns different ones (e.g., 'Community Name' vs 'community')
        const nameMatch = !nameFilter || (entry.name && String(entry.name).toLowerCase().includes(nameFilter));
        const emailMatch = !emailFilter || (entry.email && String(entry.email).toLowerCase().includes(emailFilter));
        const communityMatch = !communityFilter || (entry.community && String(entry.community).toLowerCase().includes(communityFilter)); // Assuming 'community' from your frontend
        const countryMatch = !countryFilter || (entry.country && String(entry.country).toLowerCase().includes(countryFilter));
        return nameMatch && emailMatch && communityMatch && countryMatch;
    });

    setText(totalEntriesP, `Showing ${filtered.length} of ${allSheetEntries.length} entries`);

    if (filtered.length === 0) {
        if (allSheetEntries.length > 0) {
            setText(noResultsMessage, "No entries match your current search criteria.");
        } else {
            setText(noResultsMessage, "No entries found in the database.");
        }
        showElement(noResultsMessage);
        hideElement(tableContainer);
    } else {
        filtered.forEach(entry => renderTableRow(entry));
        showElement(tableContainer);
    }
}

// --- Render Table Row ---
function renderTableRow(entry) {
    if(!dataTableBody) return;
    const row = dataTableBody.insertRow();
    row.className = "hover:bg-fuchsia-50 cursor-pointer";

    let formattedTimestamp = 'N/A';
    if (entry.timestamp) { // Google Sheets often returns dates as ISO strings or serial numbers
        try {
            const date = new Date(entry.timestamp);
            if (!isNaN(date)) { // Check if date is valid
                 formattedTimestamp = date.toLocaleString();
            } else { // If not a valid date string, try to interpret if it's an Excel serial date (more complex)
                // For simplicity, we'll just display as is if not a standard date string.
                // Proper Excel serial date conversion is non-trivial.
                formattedTimestamp = escapeHtml(entry.timestamp);
            }
        } catch (e) {
            formattedTimestamp = escapeHtml(entry.timestamp); // Fallback
        }
    }

    const MAX_CELL_LENGTH = 50; // Max characters to show in a cell before truncating
    const truncateText = (text, maxLength = MAX_CELL_LENGTH) => {
        const safeText = escapeHtml(text);
        if (safeText.length <= maxLength) return safeText;
        return safeText.substring(0, maxLength) + '...';
    };

    // Adjust keys here to match EXACTLY what your Google Apps Script returns
    // Example: entry.name, entry.email, entry.community, entry.country,
    // entry.people, entry.observations, entry.principles, entry.ideas, entry.experiments
    row.insertCell().textContent = formattedTimestamp;
    row.insertCell().textContent = escapeHtml(entry.name || 'N/A');
    row.insertCell().textContent = escapeHtml(entry.email || 'N/A');
    row.insertCell().textContent = escapeHtml(entry.community || 'N/A'); // Frontend used 'userCommunity'
    row.insertCell().textContent = escapeHtml(entry.country || 'N/A');

    const createContentCell = (textValue) => {
        const cell = row.insertCell();
        cell.textContent = truncateText(textValue);
        cell.classList.add('compass-entry');
        cell.setAttribute('data-fulltext', escapeHtml(textValue || '')); // For tooltip
        return cell;
    };

    createContentCell(entry.people);
    createContentCell(entry.observations);
    createContentCell(entry.principles);
    createContentCell(entry.ideas);
    createContentCell(entry.experiments);

    row.addEventListener('click', () => openDetailModal(entry));
}

// --- Modal Logic ---
function openDetailModal(entry) {
    if(!detailModalOverlay || !modalTimestamp || !modalName || !modalEmail || !modalCommunity || !modalCountry || !modalPeople || !modalObservations || !modalPrinciples || !modalIdeas || !modalExperiments) {
        console.error("One or more modal elements are missing.");
        return;
    }
    let formattedTimestamp = 'N/A';
    if (entry.timestamp) {
        try {
            const date = new Date(entry.timestamp);
            if (!isNaN(date)) formattedTimestamp = date.toLocaleString();
            else formattedTimestamp = escapeHtml(entry.timestamp);
        } catch (e) { formattedTimestamp = escapeHtml(entry.timestamp); }
    }

    setText(modalTimestamp, formattedTimestamp);
    setText(modalName, escapeHtml(entry.name || 'N/A'));
    setText(modalEmail, escapeHtml(entry.email || 'N/A'));
    setText(modalCommunity, escapeHtml(entry.community || 'N/A'));
    setText(modalCountry, escapeHtml(entry.country || 'N/A'));
    setText(modalPeople, escapeHtml(entry.people || 'N/A'));
    setText(modalObservations, escapeHtml(entry.observations || 'N/A'));
    setText(modalPrinciples, escapeHtml(entry.principles || 'N/A'));
    setText(modalIdeas, escapeHtml(entry.ideas || 'N/A'));
    setText(modalExperiments, escapeHtml(entry.experiments || 'N/A'));

    detailModalOverlay.classList.add('active');
}

function closeDetailModal() {
    if(detailModalOverlay) detailModalOverlay.classList.remove('active');
}

if (modalCloseButton) {
    modalCloseButton.addEventListener('click', closeDetailModal);
}
if (detailModalOverlay) {
    detailModalOverlay.addEventListener('click', (event) => {
        if (event.target === detailModalOverlay) {
            closeDetailModal();
        }
    });
}

// --- Event Listeners for Search/Filter ---
const debouncedFilter = debounce(filterAndRenderEntries, 300);
if (searchNameInput) searchNameInput.addEventListener('input', debouncedFilter);
if (searchEmailInput) searchEmailInput.addEventListener('input', debouncedFilter);
if (searchCommunityInput) searchCommunityInput.addEventListener('input', debouncedFilter);
if (searchCountryInput) searchCountryInput.addEventListener('input', debouncedFilter);

if (retryButton) {
    retryButton.addEventListener('click', fetchSheetEntries);
}

// --- Initial Load Check ---
console.log("admin.js (Google Sheets Data) loaded. Waiting for auth state...");
if (!auth) {
    console.error("Firebase Auth instance is not available from firebase-config.js");
    if(loginMessage) {
        setText(loginMessage, "CRITICAL ERROR: Firebase Auth could not initialize.");
        loginMessage.classList.add('text-red-700', 'font-bold');
    }
    if(manualLoginForm) manualLoginForm.classList.add('hidden');
}
