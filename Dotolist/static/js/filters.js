// Filtrer les tâches
function filterTasks(tasks) {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('status-filter')?.value || 'all';
    const categoryFilter = document.getElementById('category-filter')?.value || 'all';
    const priorityFilter = document.getElementById('priority-filter')?.value || 'all';
    
    return tasks.filter(task => {
        // Filtre recherche
        if (searchTerm) {
            const matchesTitle = task.title.toLowerCase().includes(searchTerm);
            const matchesDesc = task.description && task.description.toLowerCase().includes(searchTerm);
            const matchesCategory = task.category_name && task.category_name.toLowerCase().includes(searchTerm);
            if (!matchesTitle && !matchesDesc && !matchesCategory) return false;
        }
        
        // Filtre statut
        if (statusFilter === 'completed' && !task.completed) return false;
        if (statusFilter === 'pending' && task.completed) return false;
        if (statusFilter === 'overdue' && (!task.due_date || task.completed || new Date(task.due_date) >= new Date())) return false;
        
        // Filtre catégorie
        if (categoryFilter !== 'all' && task.category_id != categoryFilter) return false;
        
        // Filtre priorité
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
        
        return true;
    });
}

// Trier les tâches
function sortTasks(tasks) {
    const sortBy = document.getElementById('sort-by')?.value || 'date-desc';
    
    return [...tasks].sort((a, b) => {
        switch(sortBy) {
            case 'date-desc':
                return new Date(b.created_at) - new Date(a.created_at);
            case 'date-asc':
                return new Date(a.created_at) - new Date(b.created_at);
            case 'title-asc':
                return a.title.localeCompare(b.title);
            case 'title-desc':
                return b.title.localeCompare(a.title);
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
            case 'due-date':
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date) - new Date(b.due_date);
            default:
                return 0;
        }
    });
}

// Effacer tous les filtres
function clearFilters() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) statusFilter.value = 'all';
    
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) categoryFilter.value = 'all';
    
    const priorityFilter = document.getElementById('priority-filter');
    if (priorityFilter) priorityFilter.value = 'all';
    
    const sortBy = document.getElementById('sort-by');
    if (sortBy) sortBy.value = 'date-desc';
    
    displayTasks();
    showNotification('Filtres réinitialisés', 'info');
}