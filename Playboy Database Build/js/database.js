// ===============================
// Playboy Magazine Database
// IndexedDB Database System
// ===============================

class MagazineDatabase {
  constructor() {
    this.dbName = 'PlayboyMagazineDB';
    this.version = 1;
    this.db = null;
    this.stores = {
      magazines: 'magazines'
    };
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(this.stores.magazines)) {
          const store = db.createObjectStore(this.stores.magazines, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('magazine', 'magazine', { unique: false });
          store.createIndex('year', 'year', { unique: false });
          store.createIndex('month', 'monthFull', { unique: false });
          store.createIndex('isSpecial', 'isSpecial', { unique: false });
          store.createIndex('created', 'created', { unique: false });
          store.createIndex('yearMonth', ['year', 'monthFull'], { unique: false });
        }
      };
    });
  }

  // Parse CSV and import
  async importCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return 0;
    
    const headers = this.parseCSVLine(lines[0]).map(h => this.cleanValue(h));
    const magazines = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      // Skip empty lines or lines with insufficient data (need at least Magazine column)
      if (values.length === 0 || !values[0] || values[0].trim() === '') continue;

      // Create value map for easier access
      const data = {};
      headers.forEach((header, idx) => {
        data[header] = this.cleanValue(values[idx] || '');
      });

      // Parse year - try Year column first, then YearInput
      let year = null;
      
      // Try Year column
      if (data.Year && data.Year !== 'undefined' && data.Year.trim()) {
        const parsed = parseInt(data.Year, 10);
        if (!isNaN(parsed) && parsed > 0) {
          if (parsed >= 1900 && parsed < 2100) {
            year = parsed;
          } else if (parsed < 100) {
            year = parsed < 50 ? 2000 + parsed : 1900 + parsed;
          }
        }
      }
      
      // Fallback to YearInput
      if (!year && data.YearInput && data.YearInput !== 'undefined' && data.YearInput.trim()) {
        const parsed = parseInt(data.YearInput, 10);
        if (!isNaN(parsed) && parsed > 0) {
          if (parsed < 100) {
            year = parsed < 50 ? 2000 + parsed : 1900 + parsed;
          } else if (parsed >= 1900 && parsed < 2100) {
            year = parsed;
          }
        }
      }

      // Normalize month names during import
      // Handle multiple possible column names: Month, Month_Full, Month_Abbr
      const rawMonth = (data.Month || data.Month_Full || data.Month_Abbr || '').trim();
      let normalizedMonthFull = '';
      let normalizedMonthAbbr = '';
      
      if (rawMonth && rawMonth !== 'undefined') {
        // Normalize the month value (handles both abbreviations and full names)
        normalizedMonthFull = this.normalizeMonthName(rawMonth);
        
        // If normalization didn't work, try to use the raw value if it's already a full month name
        if (!normalizedMonthFull) {
          const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 
                             'July', 'August', 'September', 'October', 'November', 'December'];
          if (fullMonths.includes(rawMonth)) {
            normalizedMonthFull = rawMonth;
          } else {
            // Last resort: use raw value even if not recognized
            normalizedMonthFull = rawMonth;
          }
        }
        
        // Generate lowercase abbreviation from full name
        normalizedMonthAbbr = normalizedMonthFull ? normalizedMonthFull.substring(0, 3).toLowerCase() : '';
      }
      
      const magazine = {
        magazine: data.Magazine || '',
        monthFull: normalizedMonthFull,
        monthAbbr: normalizedMonthAbbr || (normalizedMonthFull ? normalizedMonthFull.substring(0, 3).toLowerCase() : ''),
        year: year,
        yearInput: data.YearInput || '',
        special: data.Special || '',
        isSpecial: data.isSpecial === 'true' || data.isSpecial === true,
        created: data.Created || new Date().toISOString()
      };

      magazines.push(magazine);
    }

    // Clear existing data
    await this.clearAll();

    // Add all magazines
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.stores.magazines], 'readwrite');
      const store = tx.objectStore(this.stores.magazines);
      
      let completed = 0;
      const total = magazines.length;
      
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve(total);
      
      for (const mag of magazines) {
        const request = store.add(mag);
        request.onsuccess = () => {
          completed++;
        };
        request.onerror = () => reject(request.error);
      }
    });
  }

  // Import from JSON backup
  async importJSON(jsonText) {
    let data;
    try {
      data = JSON.parse(jsonText);
    } catch (error) {
      throw new Error('Invalid JSON format: ' + error.message);
    }
    
    // Handle both direct array and wrapped format
    let magazines = [];
    if (Array.isArray(data)) {
      magazines = data;
    } else if (data.magazines && Array.isArray(data.magazines)) {
      magazines = data.magazines;
    } else {
      throw new Error('Invalid JSON structure. Expected array of magazines or object with magazines property.');
    }
    
    if (magazines.length === 0) {
      return 0;
    }
    
    // Clear existing data
    await this.clearAll();
    
    // Add all magazines
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.stores.magazines], 'readwrite');
      const store = tx.objectStore(this.stores.magazines);
      
      let completed = 0;
      const total = magazines.length;
      
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve(total);
      
      for (const mag of magazines) {
        // Ensure required fields exist
        const magazine = {
          magazine: mag.magazine || '',
          monthFull: mag.monthFull || '',
          monthAbbr: mag.monthAbbr || '',
          year: mag.year || null,
          yearInput: mag.yearInput || '',
          special: mag.special || '',
          isSpecial: mag.isSpecial === true,
          created: mag.created || new Date().toISOString()
        };
        
        const request = store.add(magazine);
        request.onsuccess = () => {
          completed++;
        };
        request.onerror = () => reject(request.error);
      }
    });
  }

  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    return values;
  }

  cleanValue(value) {
    if (!value) return '';
    return value.trim().replace(/^"|"$/g, '');
  }

  normalizeMonthName(monthValue) {
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
    return monthMap[normalized] || '';
  }

  parseBoolean(value) {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return false;
  }

  // CRUD Operations
  async getAllMagazines() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.stores.magazines], 'readonly');
      const store = tx.objectStore(this.stores.magazines);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getMagazine(id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.stores.magazines], 'readonly');
      const store = tx.objectStore(this.stores.magazines);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async addMagazine(magazine) {
    const tx = this.db.transaction([this.stores.magazines], 'readwrite');
    const store = tx.objectStore(this.stores.magazines);
    return store.add(magazine);
  }

  async updateMagazine(id, magazine) {
    const tx = this.db.transaction([this.stores.magazines], 'readwrite');
    const store = tx.objectStore(this.stores.magazines);
    magazine.id = id;
    return store.put(magazine);
  }

  async deleteMagazine(id) {
    const tx = this.db.transaction([this.stores.magazines], 'readwrite');
    const store = tx.objectStore(this.stores.magazines);
    return store.delete(id);
  }

  // Filtered queries
  async getByYear(year) {
    const tx = this.db.transaction([this.stores.magazines], 'readonly');
    const store = tx.objectStore(this.stores.magazines);
    const index = store.index('year');
    return index.getAll(year);
  }

  async getByMonth(month) {
    const tx = this.db.transaction([this.stores.magazines], 'readonly');
    const store = tx.objectStore(this.stores.magazines);
    const index = store.index('month');
    return index.getAll(month);
  }

  async getSpecialOnly() {
    const tx = this.db.transaction([this.stores.magazines], 'readonly');
    const store = tx.objectStore(this.stores.magazines);
    const index = store.index('isSpecial');
    return index.getAll(true);
  }

  async getFiltered(filters) {
    let all = await this.getAllMagazines();
    
    if (!Array.isArray(all)) {
      return [];
    }
    
    if (filters.magazine) {
      all = all.filter(m => m.magazine === filters.magazine);
    }
    
    // Year range filter (takes precedence over single year filter)
    if (filters.yearFrom || filters.yearTo) {
      const yearFrom = filters.yearFrom ? parseInt(filters.yearFrom) : null;
      const yearTo = filters.yearTo ? parseInt(filters.yearTo) : null;
      
      all = all.filter(m => {
        if (!m.year) return false;
        if (yearFrom && m.year < yearFrom) return false;
        if (yearTo && m.year > yearTo) return false;
        return true;
      });
    } else if (filters.year) {
      // Single year filter (only if range not specified)
      all = all.filter(m => m.year === parseInt(filters.year));
    }
    
    if (filters.month) {
      all = all.filter(m => m.monthFull === filters.month);
    }
    
    if (filters.specialOnly) {
      all = all.filter(m => m.isSpecial === true);
    }
    
    // Text search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      all = all.filter(m => {
        const magazine = (m.magazine || '').toLowerCase();
        const special = (m.special || '').toLowerCase();
        const month = (m.monthFull || '').toLowerCase();
        const yearStr = m.year ? String(m.year) : '';
        
        return magazine.includes(searchLower) || 
               special.includes(searchLower) || 
               month.includes(searchLower) ||
               yearStr.includes(searchLower);
      });
    }
    
    return all;
  }

  // Statistics
  async getStats() {
    const all = await this.getAllMagazines();
    
    const stats = {
      total: all.length,
      byMagazine: {},
      byYear: {},
      byMonth: {},
      special: 0,
      years: [],
      magazines: []
    };
    
    all.forEach(mag => {
      if (mag.magazine) {
        stats.byMagazine[mag.magazine] = (stats.byMagazine[mag.magazine] || 0) + 1;
        if (!stats.magazines.includes(mag.magazine)) {
          stats.magazines.push(mag.magazine);
        }
      }
      
      if (mag.year) {
        stats.byYear[mag.year] = (stats.byYear[mag.year] || 0) + 1;
        if (!stats.years.includes(mag.year)) {
          stats.years.push(mag.year);
        }
      }
      
      if (mag.monthFull) {
        stats.byMonth[mag.monthFull] = (stats.byMonth[mag.monthFull] || 0) + 1;
      }
      
      if (mag.isSpecial) {
        stats.special++;
      }
    });
    
    stats.years.sort();
    stats.magazines.sort();
    
    return stats;
  }

  // Export
  async exportData() {
    const magazines = await this.getAllMagazines();
    return {
      version: this.version,
      timestamp: Date.now(),
      count: magazines.length,
      magazines: magazines
    };
  }

  // Clear all
  async clearAll() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.stores.magazines], 'readwrite');
      const store = tx.objectStore(this.stores.magazines);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
