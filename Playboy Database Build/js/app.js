// ===============================
// Playboy Magazine Database App
// ===============================

const db = new MagazineDatabase();

let allMagazines = [];
let currentSortColumn = null;
let sortDirection = 'asc'; // 'asc' or 'desc'
let isChronologicalSort = false; // Track if chronological sort is active

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await db.init();
    console.log('Database initialized');
    
    // Set up event listeners
    document.getElementById('csvFileInput').addEventListener('change', handleCSVLoad);
    document.getElementById('backupFileInput').addEventListener('change', handleBackupRestore);
    document.getElementById('loadBtn').addEventListener('click', () => {
      document.getElementById('csvFileInput').click();
    });
    document.getElementById('restoreBtn').addEventListener('click', () => {
      document.getElementById('backupFileInput').click();
    });
    document.getElementById('newRecordBtn').addEventListener('click', () => openModal());
    document.getElementById('sortChronologicalBtn').addEventListener('click', sortChronologically);
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('resetBtn').addEventListener('click', resetDatabase);
    document.getElementById('toggleFiltersBtn').addEventListener('click', toggleFilters);
    document.getElementById('toggleStatsBtn').addEventListener('click', toggleStats);
    // Prevent form submission on Enter key
    document.getElementById('filterForm').addEventListener('submit', (e) => {
      e.preventDefault();
      applyFilters();
    });
    
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('magazineFilter').addEventListener('change', applyFilters);
    document.getElementById('yearFilter').addEventListener('change', applyFilters);
    document.getElementById('yearFromFilter').addEventListener('change', applyFilters);
    document.getElementById('yearToFilter').addEventListener('change', applyFilters);
    document.getElementById('monthFilter').addEventListener('change', applyFilters);
    document.getElementById('specialOnly').addEventListener('change', applyFilters);
    document.getElementById('clearFiltersBtn').addEventListener('click', clearAllFilters);
    document.getElementById('recordForm').addEventListener('submit', handleFormSubmit);
    
    // Set up sortable column headers
    document.querySelectorAll('.sortable').forEach(header => {
      header.addEventListener('click', () => {
        const column = header.getAttribute('data-column');
        sortTable(column);
      });
    });
    
    // Close modal when clicking outside
    document.getElementById('recordModal').addEventListener('click', (e) => {
      if (e.target.id === 'recordModal') {
        closeModal();
      }
    });
    
    // Load existing data
    await refreshTable();
    await populateFilters();
    await updateUIForDataState();
    updateChronologicalButtonState(); // Initialize button state
  } catch (error) {
    console.error('Initialization error:', error);
    showError('Failed to initialize database: ' + error.message);
  }
});

// Update UI visibility based on whether data exists
async function updateUIForDataState() {
  const stats = await db.getStats();
  const hasData = stats.total > 0;
  
  const searchSection = document.getElementById('searchSection');
  const filterStatsToggleSection = document.getElementById('filterStatsToggleSection');
  const newRecordBtn = document.getElementById('newRecordBtn');
  const sortChronologicalBtn = document.getElementById('sortChronologicalBtn');
  const exportBtn = document.getElementById('exportBtn');
  const tableHead = document.querySelector('#magazineTable thead');
  
  if (hasData) {
    // Show search, filter/stats toggles, action buttons, and table headers when data exists
    searchSection.classList.remove('hidden');
    filterStatsToggleSection.classList.remove('hidden');
    newRecordBtn.classList.remove('hidden');
    sortChronologicalBtn.classList.remove('hidden');
    exportBtn.classList.remove('hidden');
    tableHead.classList.remove('hidden');
    
    // Re-initialize sort listeners when table becomes visible
    setTimeout(() => {
      initializeSortableHeaders();
      // Restore sort state if one was set
      if (currentSortColumn) {
        updateSortIndicators();
      }
    }, 100);
  } else {
    // Hide search, filter/stats toggles, action buttons, and table headers when no data
    searchSection.classList.add('hidden');
    filterStatsToggleSection.classList.add('hidden');
    newRecordBtn.classList.add('hidden');
    sortChronologicalBtn.classList.add('hidden');
    exportBtn.classList.add('hidden');
    tableHead.classList.add('hidden');
    
    // Also hide filters and stats if they were visible
    document.getElementById('filterForm').classList.add('hidden');
    document.getElementById('statsSection').classList.add('hidden');
    document.getElementById('toggleFiltersBtn').textContent = '🔍 Filters';
    document.getElementById('toggleStatsBtn').innerHTML = '📊 Statistics <span class="caret">▶</span>';
  }
}

// Handle CSV file selection and load
async function handleCSVLoad(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  
  try {
    const csvText = await readFileAsText(file);
    const count = await db.importCSV(csvText);
    
    showSuccess(`Loaded ${count} magazines from CSV file: ${file.name}`);
    await refreshTable();
    await populateFilters();
    await updateUIForDataState();
    // Update stats if already visible
    if (!document.getElementById('statsSection').classList.contains('hidden')) {
      await showStats();
    }
    
    // Reset file input for next load
    document.getElementById('csvFileInput').value = '';
  } catch (error) {
    console.error('CSV load error:', error);
    showError('Failed to load CSV file: ' + error.message);
    // Reset file input on error
    document.getElementById('csvFileInput').value = '';
  }
}

// Handle backup file selection and restore
async function handleBackupRestore(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  
  try {
    const jsonText = await readFileAsText(file);
    const count = await db.importJSON(jsonText);
    
    showSuccess(`Restored ${count} magazines from backup file: ${file.name}`);
    await refreshTable();
    await populateFilters();
    await updateUIForDataState();
    // Update stats if already visible
    if (!document.getElementById('statsSection').classList.contains('hidden')) {
      await showStats();
    }
    
    // Reset file input for next restore
    document.getElementById('backupFileInput').value = '';
  } catch (error) {
    console.error('Backup restore error:', error);
    showError('Failed to restore backup: ' + error.message);
    // Reset file input on error
    document.getElementById('backupFileInput').value = '';
  }
}

// Read file as text
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Refresh table
async function refreshTable() {
  const filters = {
    magazine: document.getElementById('magazineFilter').value,
    year: document.getElementById('yearFilter').value,
    yearFrom: document.getElementById('yearFromFilter').value,
    yearTo: document.getElementById('yearToFilter').value,
    month: document.getElementById('monthFilter').value,
    specialOnly: document.getElementById('specialOnly').checked,
    search: document.getElementById('searchInput').value.trim()
  };
  
  allMagazines = await db.getFiltered(filters);
  
  // Apply sorting if a column is selected or chronological sort is active
  if (isChronologicalSort) {
    sortChronologically(false); // false = don't show success message
  } else if (currentSortColumn) {
    sortTable(currentSortColumn, false); // false = don't toggle, just apply current sort
  } else {
    renderTable(allMagazines);
  }
}

// Initialize sortable column headers
function initializeSortableHeaders() {
  document.querySelectorAll('.sortable').forEach(header => {
    // Remove any existing listeners by cloning
    const newHeader = header.cloneNode(true);
    header.parentNode.replaceChild(newHeader, header);
    // Add click listener
    newHeader.addEventListener('click', () => {
      const column = newHeader.getAttribute('data-column');
      sortTable(column);
    });
  });
}

// Sort table by column
function sortTable(column, toggleDirection = true) {
  // Clear chronological sort when using column sort
  isChronologicalSort = false;
  updateChronologicalButtonState();
  
  if (toggleDirection) {
    // Toggle sort direction if clicking the same column
    if (currentSortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, start with ascending
      currentSortColumn = column;
      sortDirection = 'asc';
    }
  }
  
  // Sort the magazines array
  const sorted = [...allMagazines].sort((a, b) => {
    let aVal, bVal;
    
    switch (column) {
      case 'magazine':
        aVal = (a.magazine || '').toLowerCase();
        bVal = (b.magazine || '').toLowerCase();
        break;
      case 'month':
        // Sort by month order (January = 1, February = 2, etc.)
        const months = ['january', 'february', 'march', 'april', 'may', 'june', 
                       'july', 'august', 'september', 'october', 'november', 'december'];
        aVal = months.indexOf((a.monthFull || '').toLowerCase());
        bVal = months.indexOf((b.monthFull || '').toLowerCase());
        // Handle invalid months
        if (aVal === -1) aVal = 999;
        if (bVal === -1) bVal = 999;
        break;
      case 'year':
        aVal = a.year || 0;
        bVal = b.year || 0;
        break;
      case 'special':
        // Sort by special text, then by isSpecial flag
        aVal = (a.special || '').toLowerCase() + (a.isSpecial ? '1' : '0');
        bVal = (b.special || '').toLowerCase() + (b.isSpecial ? '1' : '0');
        break;
      case 'created':
        aVal = new Date(a.created || 0).getTime();
        bVal = new Date(b.created || 0).getTime();
        break;
      default:
        return 0;
    }
    
    // Compare values
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  // Update sort indicators
  updateSortIndicators();
  
  // Render sorted table
  renderTable(sorted);
}

// Sort chronologically by year and month
function sortChronologically(showMessage = true) {
  // Month order for chronological sorting
  const monthOrder = ['january', 'february', 'march', 'april', 'may', 'june', 
                      'july', 'august', 'september', 'october', 'november', 'december'];
  
  // Sort the magazines array chronologically (year first, then month)
  const sorted = [...allMagazines].sort((a, b) => {
    // First, sort by year
    const aYear = a.year || 0;
    const bYear = b.year || 0;
    
    if (aYear !== bYear) {
      return aYear - bYear; // Ascending year order
    }
    
    // If years are the same, sort by month
    const aMonth = (a.monthFull || '').toLowerCase();
    const bMonth = (b.monthFull || '').toLowerCase();
    
    const aMonthIndex = monthOrder.indexOf(aMonth);
    const bMonthIndex = monthOrder.indexOf(bMonth);
    
    // Handle invalid/missing months (put them at the end)
    if (aMonthIndex === -1 && bMonthIndex === -1) return 0;
    if (aMonthIndex === -1) return 1; // a goes after b
    if (bMonthIndex === -1) return -1; // b goes after a
    
    return aMonthIndex - bMonthIndex; // Ascending month order
  });
  
  // Set chronological sort as active
  isChronologicalSort = true;
  currentSortColumn = null;
  sortDirection = 'asc';
  updateSortIndicators();
  updateChronologicalButtonState();
  
  // Render sorted table
  renderTable(sorted);
  
  if (showMessage) {
    showSuccess('Sorted chronologically by year and month');
  }
}

// Update chronological sort button visual state
function updateChronologicalButtonState() {
  const btn = document.getElementById('sortChronologicalBtn');
  if (btn) {
    if (isChronologicalSort) {
      btn.classList.add('active');
      btn.textContent = '📅 Chronological (Active)';
    } else {
      btn.classList.remove('active');
      btn.textContent = '📅 Sort Chronologically';
    }
  }
}

// Update sort indicators in table headers
function updateSortIndicators() {
  document.querySelectorAll('.sortable').forEach(header => {
    const indicator = header.querySelector('.sort-indicator');
    const column = header.getAttribute('data-column');
    
    if (currentSortColumn === column) {
      indicator.textContent = sortDirection === 'asc' ? ' ↑' : ' ↓';
      header.classList.add('sorted');
    } else {
      indicator.textContent = '';
      header.classList.remove('sorted');
    }
  });
}

// Render table
function renderTable(magazines) {
  const tbody = document.getElementById('tableBody');
  
  // Ensure magazines is an array
  if (!Array.isArray(magazines)) {
    console.error('magazines is not an array:', magazines);
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Error: Invalid data format</td></tr>';
    return;
  }
  
  if (magazines.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">No magazines found</td></tr>';
    return;
  }
  
  tbody.innerHTML = magazines.map(mag => {
    // Get year - use stored year, or parse from yearInput as fallback
    let year = mag.year;
    
    if (!year && mag.yearInput) {
      const parsed = parseInt(mag.yearInput);
      if (!isNaN(parsed) && parsed > 0) {
        year = parsed < 100 ? (parsed < 50 ? 2000 + parsed : 1900 + parsed) : parsed;
      }
    }
    
    if (!year) {
      year = mag.yearInput || 'N/A';
    }
    
    // Get month - normalize monthFull (which might contain abbreviations) or use monthAbbr as fallback
    let monthDisplay = '';
    const rawMonthFull = mag.monthFull ? String(mag.monthFull).trim() : '';
    const rawMonthAbbr = mag.monthAbbr ? String(mag.monthAbbr).trim() : '';
    
    // Try monthFull first (skip if it's empty or 'undefined')
    if (rawMonthFull && rawMonthFull !== 'undefined' && rawMonthFull !== '') {
      monthDisplay = normalizeMonthName(rawMonthFull);
      // If normalization returned empty or same value, check if it's already a full month
      if (!monthDisplay || monthDisplay === rawMonthFull) {
        const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        if (fullMonths.includes(rawMonthFull)) {
          monthDisplay = rawMonthFull;
        } else if (!monthDisplay) {
          // Normalization failed, but show the raw value anyway
          monthDisplay = rawMonthFull;
        }
      }
    }
    
    // Fallback to monthAbbr if monthFull didn't work
    if (!monthDisplay && rawMonthAbbr && rawMonthAbbr !== 'undefined' && rawMonthAbbr !== '') {
      monthDisplay = normalizeMonthName(rawMonthAbbr);
      if (!monthDisplay) {
        monthDisplay = rawMonthAbbr;
      }
    }
    
    // Debug: log if we still don't have a month
    if (!monthDisplay && magazines.length > 0) {
      console.log('Missing month for record:', { id: mag.id, monthFull: mag.monthFull, monthAbbr: mag.monthAbbr });
    }
    
    const specialText = mag.special ? mag.special : '';
    const isSpecial = mag.isSpecial === true;
    const specialDisplay = isSpecial 
      ? `<span class="special-badge">✓ Special${specialText ? ': ' + specialText : ''}</span>`
      : (specialText ? `<span class="special-text">${specialText}</span>` : '');
    
    return `
    <tr class="${isSpecial ? 'special-row' : ''}">
      <td>${mag.magazine || ''}</td>
      <td>${monthDisplay}</td>
      <td class="year-cell">${year}</td>
      <td>${specialDisplay}</td>
      <td>${formatDate(mag.created)}</td>
      <td>
        <button onclick="editMagazine(${mag.id})" class="btn-small btn-edit">Edit</button>
        <button onclick="deleteMagazine(${mag.id})" class="btn-small">Delete</button>
      </td>
    </tr>
    `;
  }).join('');
}

// Populate filters
async function populateFilters() {
  const stats = await db.getStats();
  
  // Populate year filter
  const yearSelect = document.getElementById('yearFilter');
  yearSelect.innerHTML = '<option value="">All Years</option>';
  stats.years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  });
  
  // Populate year range filters
  const yearFromSelect = document.getElementById('yearFromFilter');
  yearFromSelect.innerHTML = '<option value="">From Year</option>';
  stats.years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearFromSelect.appendChild(option);
  });
  
  const yearToSelect = document.getElementById('yearToFilter');
  yearToSelect.innerHTML = '<option value="">To Year</option>';
  stats.years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearToSelect.appendChild(option);
  });
  
  // Populate magazine filter
  const magazineSelect = document.getElementById('magazineFilter');
  magazineSelect.innerHTML = '<option value="">All Magazines</option>';
  stats.magazines.forEach(mag => {
    const option = document.createElement('option');
    option.value = mag;
    option.textContent = mag;
    magazineSelect.appendChild(option);
  });
  
  // Populate month filter dynamically with months that exist in data
  const monthSelect = document.getElementById('monthFilter');
  const currentMonthValue = monthSelect.value; // Preserve current selection
  monthSelect.innerHTML = '<option value="">All Months</option>';
  
  // Get all unique months from stats
  const monthsInData = Object.keys(stats.byMonth || {}).sort((a, b) => {
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    return monthOrder.indexOf(a) - monthOrder.indexOf(b);
  });
  
  monthsInData.forEach(month => {
    const option = document.createElement('option');
    option.value = month;
    option.textContent = month;
    monthSelect.appendChild(option);
  });
  
  // Restore previous selection if it still exists
  if (currentMonthValue && monthsInData.includes(currentMonthValue)) {
    monthSelect.value = currentMonthValue;
  }
}

// Toggle filters visibility
function toggleFilters() {
  const filterForm = document.getElementById('filterForm');
  const toggleBtn = document.getElementById('toggleFiltersBtn');
  
  filterForm.classList.toggle('hidden');
  
  if (filterForm.classList.contains('hidden')) {
    toggleBtn.textContent = '🔍 Filters';
  } else {
    toggleBtn.textContent = '✕ Hide Filters';
  }
}

// Clear all filters
function clearAllFilters() {
  document.getElementById('magazineFilter').value = '';
  document.getElementById('yearFilter').value = '';
  document.getElementById('yearFromFilter').value = '';
  document.getElementById('yearToFilter').value = '';
  document.getElementById('monthFilter').value = '';
  document.getElementById('specialOnly').checked = false;
  // Note: Search input is intentionally NOT cleared here since it's separate from filters
  applyFilters();
}

// Apply filters
async function applyFilters() {
  await refreshTable();
}

// Toggle statistics visibility
async function toggleStats() {
  const statsSection = document.getElementById('statsSection');
  const toggleBtn = document.getElementById('toggleStatsBtn');
  const caret = toggleBtn.querySelector('.caret');
  
  if (statsSection.classList.contains('hidden')) {
    // Show stats
    statsSection.classList.remove('hidden');
    toggleBtn.innerHTML = '📊 Statistics <span class="caret">▼</span>';
    await showStats();
  } else {
    // Hide stats
    statsSection.classList.add('hidden');
    toggleBtn.innerHTML = '📊 Statistics <span class="caret">▶</span>';
  }
}

// Show statistics
async function showStats() {
  const stats = await db.getStats();
  const statsDiv = document.getElementById('stats');
  
  const magazineBreakdown = Object.entries(stats.byMagazine)
    .map(([mag, count]) => `${mag}: ${count}`)
    .join(', ');
  
  const yearBreakdown = Object.entries(stats.byYear)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([year, count]) => `${year}: ${count}`)
    .join(', ');
  
  const yearRange = stats.years.length > 0 
    ? `${stats.years[0]} - ${stats.years[stats.years.length - 1]}`
    : 'N/A';
  
  statsDiv.innerHTML = `
    <h3>Database Statistics</h3>
    <p><strong>Total Magazines:</strong> ${stats.total}</p>
    <p><strong>By Magazine:</strong> ${magazineBreakdown || 'None'}</p>
    <p><strong>Special Issues:</strong> ${stats.special}</p>
    <p><strong>Year Range:</strong> ${yearRange}</p>
    <p><strong>By Year:</strong> ${yearBreakdown || 'None'}</p>
  `;
}

// Export data
async function exportData() {
  try {
    const data = await db.exportData();
    const json = JSON.stringify(data, null, 2);
    
    // Create download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `playboy-database-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showSuccess('Data exported successfully');
  } catch (error) {
    console.error('Export error:', error);
    showError('Failed to export: ' + error.message);
  }
}

// Reset database
async function resetDatabase() {
  const stats = await db.getStats();
  const recordCount = stats.total;
  
  if (recordCount === 0) {
    showError('Database is already empty');
    return;
  }
  
  const confirmMessage = `Are you sure you want to reset the database?\n\nThis will permanently delete all ${recordCount} record(s) in the database.\n\nA backup will be automatically saved before deletion.\n\nThis action cannot be undone.`;
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  // Double confirmation for safety
  const doubleConfirm = confirm('⚠️ FINAL WARNING ⚠️\n\nYou are about to delete ALL records. A backup will be saved first.\n\nThis action cannot be undone.\n\nAre you absolutely sure?');
  
  if (!doubleConfirm) {
    return;
  }
  
  try {
    // Automatically export/backup before resetting
    const data = await db.exportData();
    const json = JSON.stringify(data, null, 2);
    
    // Create backup download with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFilename = `playboy-database-backup-before-reset-${timestamp}.json`;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backupFilename;
    a.click();
    URL.revokeObjectURL(url);
    
    // Small delay to ensure download starts
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Now proceed with reset
    await db.clearAll();
    await refreshTable();
    await populateFilters();
    
    // Clear search input
    document.getElementById('searchInput').value = '';
    
    // Clear filters
    document.getElementById('magazineFilter').value = '';
    document.getElementById('yearFilter').value = '';
    document.getElementById('yearFromFilter').value = '';
    document.getElementById('yearToFilter').value = '';
    document.getElementById('monthFilter').value = '';
    document.getElementById('specialOnly').checked = false;
    
    // Hide stats if visible
    const statsSection = document.getElementById('statsSection');
    if (!statsSection.classList.contains('hidden')) {
      statsSection.classList.add('hidden');
      document.getElementById('toggleStatsBtn').innerHTML = '📊 Statistics <span class="caret">▶</span>';
    }
    
    // Update UI to hide search and filter sections when no data
    await updateUIForDataState();
    
    showSuccess(`Database has been reset. A backup was automatically saved as "${backupFilename}". All records have been deleted.`);
  } catch (error) {
    console.error('Reset error:', error);
    showError('Failed to reset database: ' + error.message);
  }
}

// Open modal for new record
async function openModal(magazineId = null) {
  const modal = document.getElementById('recordModal');
  const form = document.getElementById('recordForm');
  const title = document.getElementById('modalTitle');
  
  // Reset form
  form.reset();
  document.getElementById('recordId').value = '';
  
  // Populate magazine datalist with existing magazines from database
  await populateMagazineDatalist();
  
  // Show modal first
  modal.classList.add('show');
  
  if (magazineId) {
    // Edit mode
    title.textContent = 'Edit Magazine Record';
    await loadMagazineForEdit(magazineId);
  } else {
    // New record mode
    title.textContent = 'New Magazine Record';
    // Set default created date
    document.getElementById('isSpecial').checked = false;
  }
}

// Populate magazine datalist with existing magazines
async function populateMagazineDatalist() {
  try {
    const stats = await db.getStats();
    const datalist = document.getElementById('magazineOptions');
    
    // Clear existing options (keep default ones if needed, but we'll rebuild)
    datalist.innerHTML = '';
    
    // Add default/common magazines first
    const defaultMagazines = ['Playboy', 'Penthouse', 'Oui'];
    defaultMagazines.forEach(mag => {
      const option = document.createElement('option');
      option.value = mag;
      datalist.appendChild(option);
    });
    
    // Add all unique magazines from database
    if (stats.magazines && stats.magazines.length > 0) {
      stats.magazines.forEach(mag => {
        // Only add if not already in default list
        if (!defaultMagazines.includes(mag)) {
          const option = document.createElement('option');
          option.value = mag;
          datalist.appendChild(option);
        }
      });
    }
  } catch (error) {
    console.error('Error populating magazine datalist:', error);
    // Don't block modal opening if this fails
  }
}

// Close modal
function closeModal() {
  const modal = document.getElementById('recordModal');
  modal.classList.remove('show');
  document.getElementById('recordForm').reset();
}

// Helper function to normalize month name (handles abbreviations and full names)
// This should match the behavior in database.js for consistency
function normalizeMonthName(monthValue) {
  if (!monthValue) return '';
  
  const monthMap = {
    'jan': 'January', 'january': 'January',
    'feb': 'February', 'february': 'February',
    'mar': 'March', 'march': 'March',
    'apr': 'April', 'april': 'April',
    'may': 'May',
    'jun': 'June', 'june': 'June',
    'jul': 'July', 'july': 'July',
    'aug': 'August', 'august': 'August',
    'sep': 'September', 'sept': 'September', 'september': 'September',
    'oct': 'October', 'october': 'October',
    'nov': 'November', 'november': 'November',
    'dec': 'December', 'december': 'December'
  };
  
  const normalized = monthValue.toLowerCase().trim();
  const result = monthMap[normalized];
  
  // Return normalized value if found, otherwise return original value
  // (for display purposes, we want to show something even if not recognized)
  return result || monthValue;
}

// Load magazine data for editing
async function loadMagazineForEdit(id) {
  try {
    console.log('Loading magazine with id:', id);
    const magazine = await db.getMagazine(id);
    console.log('Loaded magazine:', magazine);
    
    if (!magazine) {
      showError('Magazine not found');
      return;
    }
    
    // Populate form fields
    document.getElementById('recordId').value = magazine.id || '';
    document.getElementById('magazineName').value = magazine.magazine || '';
    
    // Set month select - normalize month name to match dropdown options
    const monthSelect = document.getElementById('monthFull');
    const monthOptions = Array.from(monthSelect.options).map(opt => opt.value);
    let monthToSet = '';
    
    // Debug: log what we have
    console.log('Setting month for record:', {
      id: magazine.id,
      monthFull: magazine.monthFull,
      monthAbbr: magazine.monthAbbr,
      monthFullType: typeof magazine.monthFull,
      availableOptions: monthOptions
    });
    
    // Try monthFull first
    if (magazine.monthFull) {
      const rawMonth = String(magazine.monthFull).trim();
      
      // Skip if it's empty or 'undefined' string
      if (rawMonth && rawMonth !== 'undefined' && rawMonth !== '') {
        // Check if it's already a full month name (exact match)
        if (monthOptions.includes(rawMonth)) {
          monthToSet = rawMonth;
          console.log('Found exact match:', rawMonth);
        } else {
          // Try normalizing it
          const normalizedMonth = normalizeMonthName(rawMonth);
          console.log('Normalized', rawMonth, 'to', normalizedMonth);
          
          if (normalizedMonth && normalizedMonth !== rawMonth) {
            // Normalization changed the value, check if it matches
            if (monthOptions.includes(normalizedMonth)) {
              monthToSet = normalizedMonth;
              console.log('Found normalized match:', normalizedMonth);
            }
          } else if (normalizedMonth === rawMonth && monthOptions.includes(normalizedMonth)) {
            // Normalization returned same value and it matches
            monthToSet = normalizedMonth;
            console.log('Normalized value matches:', normalizedMonth);
          }
        }
      }
    }
    
    // Fallback to monthAbbr if monthFull didn't work
    if (!monthToSet && magazine.monthAbbr) {
      const rawAbbr = String(magazine.monthAbbr).trim();
      if (rawAbbr && rawAbbr !== 'undefined' && rawAbbr !== '') {
        const normalizedFromAbbr = normalizeMonthName(rawAbbr);
        console.log('Trying abbreviation:', rawAbbr, 'normalized to:', normalizedFromAbbr);
        if (normalizedFromAbbr && monthOptions.includes(normalizedFromAbbr)) {
          monthToSet = normalizedFromAbbr;
          console.log('Found match from abbreviation:', monthToSet);
        }
      }
    }
    
    // Set the value if we found a match
    if (monthToSet) {
      monthSelect.value = monthToSet;
      console.log('✓ Month successfully set to:', monthToSet);
    } else {
      console.warn('✗ Could not set month for record:', {
        id: magazine.id,
        monthFull: magazine.monthFull,
        monthAbbr: magazine.monthAbbr,
        monthFullString: String(magazine.monthFull),
        availableOptions: monthOptions
      });
    }
    
    // Show yearInput (2-digit) if available, otherwise last 2 digits of year
    const yearDisplay = magazine.yearInput || (magazine.year ? String(magazine.year).slice(-2) : '');
    document.getElementById('year').value = yearDisplay;
    document.getElementById('special').value = magazine.special || '';
    document.getElementById('isSpecial').checked = magazine.isSpecial === true;
    
    console.log('Form populated with:', {
      id: magazine.id,
      magazine: magazine.magazine,
      monthFull: magazine.monthFull,
      monthAbbr: magazine.monthAbbr,
      monthSelectValue: monthSelect.value,
      year: magazine.year
    });
  } catch (error) {
    console.error('Load error:', error);
    showError('Failed to load magazine: ' + error.message);
  }
}

// Handle form submission
async function handleFormSubmit(event) {
  event.preventDefault();
  
  const id = document.getElementById('recordId').value;
  const monthFull = document.getElementById('monthFull').value.trim();
  // Generate lowercase abbreviation to match database format
  const monthAbbr = monthFull ? monthFull.substring(0, 3).toLowerCase() : '';
  
  // Parse year from 2-digit input and convert to 4-digit year
  const yearInput = document.getElementById('year').value.trim();
  let year = null;
  
  if (yearInput) {
    const parsed = parseInt(yearInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      // If it's already 4 digits (1900-2100), use as is
      if (parsed >= 1900 && parsed < 2100) {
        year = parsed;
      } 
      // If it's 2 digits, convert: < 50 = 2000s, >= 50 = 1900s
      else if (parsed < 100) {
        year = parsed < 50 ? 2000 + parsed : 1900 + parsed;
      }
    }
  }
  
  const magazine = {
    magazine: document.getElementById('magazineName').value.trim(),
    monthFull: monthFull,
    monthAbbr: monthAbbr,
    year: year,
    yearInput: yearInput,
    special: document.getElementById('special').value.trim(),
    isSpecial: document.getElementById('isSpecial').checked,
    created: new Date().toISOString()
  };
  
  // Validate required fields
  if (!magazine.magazine || !magazine.monthFull || !yearInput || !year) {
    showError('Please fill in all required fields (Magazine, Month, Year)');
    return;
  }
  
  try {
    if (id) {
      // Update existing record
      await db.updateMagazine(parseInt(id), magazine);
      showSuccess('Magazine record updated successfully');
    } else {
      // Create new record
      await db.addMagazine(magazine);
      showSuccess('Magazine record created successfully');
    }
    
    closeModal();
    await refreshTable();
    await populateFilters();
    await updateUIForDataState();
    // Update stats if already visible
    if (!document.getElementById('statsSection').classList.contains('hidden')) {
      await showStats();
    }
  } catch (error) {
    console.error('Save error:', error);
    showError('Failed to save record: ' + error.message);
  }
}

// Edit magazine
async function editMagazine(id) {
  openModal(id);
}

// Delete magazine
async function deleteMagazine(id) {
  if (!confirm('Are you sure you want to delete this magazine?')) {
    return;
  }
  
  try {
    await db.deleteMagazine(id);
    await refreshTable();
    await updateUIForDataState();
    // Update stats if already visible
    if (!document.getElementById('statsSection').classList.contains('hidden')) {
      await showStats();
    }
    showSuccess('Magazine deleted');
  } catch (error) {
    console.error('Delete error:', error);
    showError('Failed to delete: ' + error.message);
  }
}

// Utility functions
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

function showSuccess(message) {
  const div = document.createElement('div');
  div.className = 'message success';
  div.textContent = message;
  document.body.insertBefore(div, document.body.firstChild);
  setTimeout(() => div.remove(), 3000);
}

function showError(message) {
  const div = document.createElement('div');
  div.className = 'message error';
  div.textContent = message;
  document.body.insertBefore(div, document.body.firstChild);
  setTimeout(() => div.remove(), 5000);
}
