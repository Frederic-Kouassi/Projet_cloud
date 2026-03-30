// Queue de notifications
let notificationQueue = [];
let isShowingNotification = false;

// Afficher une notification
function showNotification(message, type = 'success', duration = 3000) {
    notificationQueue.push({ message, type, duration });
    processNotificationQueue();
}

// Traiter la file d'attente
function processNotificationQueue() {
    if (isShowingNotification || notificationQueue.length === 0) return;
    
    isShowingNotification = true;
    const { message, type, duration } = notificationQueue.shift();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${icons[type]} mr-2"></i>
            <span>${escapeHtml(message)}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
            isShowingNotification = false;
            processNotificationQueue();
        }, 300);
    }, duration);
}

// Notification persistante
function showPersistentNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cursor = 'pointer';
    
    notification.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <i class="fas ${type === 'info' ? 'fa-info-circle' : 'fa-exclamation-triangle'} mr-2"></i>
                <span>${escapeHtml(message)}</span>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 hover:opacity-75">
                <i class="fas fa-xmark"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    return notification;
}