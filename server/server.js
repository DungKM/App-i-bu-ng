
// --- MEDICATION: MAR ---
app.get('/api/mar/patients', (req, res) => {
    const { fromDate, toDate, deptCode } = req.query;
    
    // Mock Logic: The static MAR data is assumed to be for "Today".
    // If a date filter is applied that does NOT include Today, return empty MAR items.
    let isDateInRange = true;
    if (fromDate && toDate) {
        const today = new Date().toISOString().split('T')[0];
        if (today < fromDate || today > toDate) {
            isDateInRange = false;
        }
    }

    let visits = MED_VISITS;
    if (deptCode) {
        visits = visits.filter(v => v.deptCode === deptCode);
    }

    const r = visits.map(v => {
        // If date is out of range, simulate no items for this day
        const items = isDateInRange ? MAR_ITEMS.filter(m => m.visitId === v.id) : [];
        
        return {
            ...v,
            marSummary: {
                total: items.length,
                pending: items.filter(m => m.status === 'SCHEDULED').length,
                missed: items.filter(m => m.status === 'MISSED').length,
                returnPending: items.filter(m => m.status === 'RETURN_PENDING').length
            }
        };
    });
    res.json(r);
});
app.get('/api/mar/detail', (req, res) => res.json(MAR_ITEMS.filter(m => m.visitId === req.query.visitId)));
