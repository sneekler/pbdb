# Playboy Magazine Database

A functional and scalable database system for managing Playboy magazine collection data.

## Features

- ✅ **IndexedDB Storage** - Client-side database with no server required
- ✅ **CSV Import** - Load data from CSV file
- ✅ **Filtering** - Filter by year, month, and special issues
- ✅ **Statistics** - View collection statistics
- ✅ **Export** - Export data as JSON
- ✅ **CRUD Operations** - Add, edit, delete magazines

## Project Structure

```
Playboy Database Build/
├── csv/
│   └── NLS_Magazine_Database.csv    # Source CSV data
├── js/
│   ├── database.js                  # IndexedDB database class
│   └── app.js                       # Application logic
├── css/
│   └── style.css                    # Styling
├── index.html                       # Main interface
└── README.md                        # This file
```

## Usage

1. Open `index.html` in a web browser
2. Click "Load CSV Data" to import the CSV file
3. Use filters to search by year, month, or special issues
4. View statistics with "Show Statistics"
5. Export data with "Export Data"

## Database Schema

### Magazine Object
```javascript
{
  id: 1,                              // Auto-increment
  magazine: "Playboy",
  monthFull: "November",
  monthAbbr: "nov",
  year: 1965,
  yearInput: "65",
  special: "",
  isSpecial: false,
  created: "2026-01-11T04:09:42.931Z"
}
```

## API Reference

### Database Methods

- `init()` - Initialize database
- `importCSV(csvText)` - Import CSV data
- `getAllMagazines()` - Get all magazines
- `getMagazine(id)` - Get single magazine
- `addMagazine(magazine)` - Add new magazine
- `updateMagazine(id, magazine)` - Update magazine
- `deleteMagazine(id)` - Delete magazine
- `getByYear(year)` - Filter by year
- `getByMonth(month)` - Filter by month
- `getSpecialOnly()` - Get special issues only
- `getFiltered(filters)` - Apply multiple filters
- `getStats()` - Get statistics
- `exportData()` - Export all data
- `clearAll()` - Clear all data

## Browser Compatibility

Requires a modern browser with IndexedDB support:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Future Enhancements

- [ ] Add/edit magazine form
- [ ] Search functionality
- [ ] Duplicate detection
- [ ] Image upload support
- [ ] Advanced filtering
- [ ] Data validation
- [ ] Import from multiple sources
