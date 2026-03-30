// Initialiser le thème
function initTheme() {
    const savedTheme = loadFromLocalStorage('theme', 'light');
    const themeToggle = document.getElementById('theme-toggle');
    
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        if (themeToggle) themeToggle.checked = true;
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.documentElement.classList.add('dark');
                saveToLocalStorage('theme', 'dark');
                showNotification('Mode sombre activé', 'info');
            } else {
                document.documentElement.classList.remove('dark');
                saveToLocalStorage('theme', 'light');
                showNotification('Mode clair activé', 'info');
            }
        });
    }
}