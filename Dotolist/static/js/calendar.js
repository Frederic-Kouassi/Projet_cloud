let currentDate = new Date();
let tasks = [];

// Charger les tâches et afficher le calendrier
async function loadCalendar() {
    try {
        tasks = await getTasks();
        displayCalendar();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de chargement', 'error');
    }
}

// Afficher le calendrier
function displayCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;
    
    const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    let calendarHtml = weekDays.map(day => `
        <div class="text-center font-semibold p-2 bg-gray-100 dark:bg-gray-700 rounded">
            ${day}
        </div>
    `).join('');
    
    let dayCounter = 1;
    const totalCells = 42;
    
    for (let i = 0; i < totalCells; i++) {
        const dayOfWeek = i % 7;
        const isCurrentMonth = i >= (startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1) && dayCounter <= daysInMonth;
        
        if (isCurrentMonth) {
            const currentDay = dayCounter;
            const date = new Date(year, month, currentDay);
            const dayTasks = tasks.filter(task => {
                if (!task.due_date) return false;
                const taskDate = new Date(task.due_date);
                return taskDate.toDateString() === date.toDateString();
            });
            
            const isToday = date.toDateString() === new Date().toDateString();
            
            calendarHtml += `
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-2 min-h-[100px] ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}">
                    <div class="font-semibold mb-1 ${isToday ? 'text-blue-600' : 'dark:text-white'}">${currentDay}</div>
                    <div class="space-y-1">
                        ${dayTasks.slice(0, 3).map(task => `
                            <div class="text-xs p-1 rounded ${task.completed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'} cursor-pointer hover:opacity-75"
                                 onclick="showTaskDetail(${task.id})">
                                ${escapeHtml(task.title)}
                            </div>
                        `).join('')}
                        ${dayTasks.length > 3 ? `<div class="text-xs text-gray-500">+${dayTasks.length - 3} autres</div>` : ''}
                    </div>
                </div>
            `;
            dayCounter++;
        } else {
            calendarHtml += `<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-2 min-h-[100px] bg-gray-50 dark:bg-gray-800/50"></div>`;
        }
    }
    
    document.getElementById('calendar-grid').innerHTML = calendarHtml;
}

// Navigation mois
document.addEventListener('DOMContentLoaded', () => {
    loadNavbar();
    initTheme();
    loadCalendar();
    
    document.getElementById('prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        loadCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        loadCalendar();
    });
});