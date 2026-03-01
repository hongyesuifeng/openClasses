class Dashboard {
    constructor() {
        this.meetingProgress = document.getElementById('meeting-progress');
        this.tasksPending = document.getElementById('tasks-pending').querySelector('span');
        this.tasksInProgress = document.getElementById('tasks-in-progress').querySelector('span');
        this.tasksCompleted = document.getElementById('tasks-completed').querySelector('span');
        this.meetingTitle = document.getElementById('meeting-title');
        this.meetingTopic = document.getElementById('meeting-topic');
    }

    updateMeetingProgress(percentage) {
        this.meetingProgress.style.width = `${percentage}%`;
    }

    updateTasks(pending, inProgress, completed) {
        if (pending !== undefined) this.tasksPending.textContent = `○ ${pending}`;
        if (inProgress !== undefined) this.tasksInProgress.textContent = `● ${inProgress}`;
        if (completed !== undefined) this.tasksCompleted.textContent = `✓ ${completed}`;
    }

    updateMeetingInfo(title, topic) {
        this.meetingTitle.textContent = title;
        this.meetingTopic.textContent = topic;
    }
}
