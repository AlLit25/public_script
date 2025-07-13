class DateWorker {
    static formatDate(date) {
        return date.split('T')[0]; // Возвращает YYYY-MM-DD
    }

    static getTodayRange() {
        const today = new Date().toISOString();
        return {today: DateWorker.formatDate(today)};
    }

    static getWeekRange() {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 (вс) - 6 (сб)
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Смещение до понедельника
        const start = new Date(today);
        start.setDate(today.getDate() - diffToMonday);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return {start: DateWorker.formatDate(start.toISOString()), end: DateWorker.formatDate(end.toISOString())};
    }

    static getMonthRange() {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        return {start: DateWorker.formatDate(start.toISOString()), end: DateWorker.formatDate(end.toISOString())};
    }

    static getDateTableFormat(date) {
        const dateDay = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
        const dateMonth = date.getMonth() < 10 ? "0" + date.getMonth() : date.getMonth();

        return `<b>${dateDay}.${dateMonth}.${date.getFullYear()}</b>`;
    }
}