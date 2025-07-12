document.addEventListener('DOMContentLoaded', () => {
    new Main();
});

class Main {
    constructor() {
        this.main = document.querySelector('main');
        this.blockList = {};
        this.sphObj = new SPH();

        if (Main.isset(this.main)) {
            this.main.addEventListener('click', event => this.clickHandler(event.target));
            this.getBlockList();
            this.setCategory();
        }
    }

    clickHandler(elem) {
        if (elem.hasAttribute('data-mf-click')) {
            let nextCheck = true;

            switch (elem.dataset.mfClick) {
                case 'menu':
                case 'expense':
                case 'income':
                    this.activeBlock(elem.dataset.mfClick);
                    nextCheck = false;
                    break;
                case 'add_income':
                    this.addIncome();
                    nextCheck = false;
                    break;
                case 'expense_add':
                    this.addExpense();
                    nextCheck = false;
                    break;
                case 'statistic':
                    this.activeBlock(elem.dataset.mfClick);
                    this.getStatistic();
                    nextCheck = false;
                    break;
            }

            if (nextCheck) {
                this.sphObj.clickHandler(elem, this);
            }
        }
    }

    setCategory() {
        const expenseCategory = this.main.querySelector('select[data-mf-input="expense_category"]');

        let optionHtml = '';

        for (const code in Dictionary.expenseCategory) {
            optionHtml += `<option value="${code}">${Dictionary.expenseCategory[code]}</option>`
        }

        expenseCategory.innerHTML = optionHtml;
    }

    getBlockList() {
        const rawList = this.main.querySelectorAll('div[data-mf-block]');

        rawList.forEach(elem => {
            this.blockList[elem.dataset['mfBlock']] = elem;
        });
    }

    activeBlock(codeBlock) {
        for (const code in this.blockList) {
            if (codeBlock === code) {
                if (this.blockList[code].classList.contains('hide')) this.blockList[code].classList.remove('hide');
            } else {
                this.blockList[code].classList.add('hide');
            }
        }
    }

    /**
     * @param elem
     * @return boolean
     */
    static isset(elem) {
        return elem !== null && elem !== undefined;
    }

    addIncome() {
        const incomeBlock = this.main.querySelector('div[data-mf-block="income"]');
        const sumInput = incomeBlock.querySelector('input[data-mf-input="income"]');

        if (sumInput.value.length > 0) {
            this.addRecord(sumInput.value, 'income').then(result => {
                if (result) {
                    sumInput.value = '';
                    this.activeBlock('menu');
                }
            });
        } else {
            alert('Обовʼязково необхідно вказати суму');
        }
    }

    addExpense() {
        const expenseBlock = this.main.querySelector('div[data-mf-block="expense"]');
        const expenseCat = expenseBlock.querySelector('select[data-mf-input="expense_category"]');
        const expenseSum = expenseBlock.querySelector('input[data-mf-input="expense_sum"]');
        const expenseCom = expenseBlock.querySelector('textarea[data-mf-input="expense_comment"]');

        if (expenseSum.value.length > 0 && expenseCat.value.length) {
            this.addRecord(expenseSum.value, 'expense', expenseCat.value, expenseCom.value).then(result => {
                if (result) {
                    expenseCat.value = '';
                    expenseSum.value = '';
                    expenseCom.value = '';
                    this.activeBlock('menu');
                }
            });
        } else {
            alert('Обовʼязково необхідно вказати суму та категорію');
        }

    }

    getStatistic(tab = 's_today') {
        let where = '';
        switch (tab) {
            case 's_today':
                const paramToday = DateWorker.getTodayRange();
                where = `created_at=eq.${paramToday.today}`;
                this.setToday();
                break;
            case 's_week':
                const paramWeek = DateWorker.getWeekRange();
                where = `created_at=gte.${paramWeek.start}&created_at=lte.${paramWeek.end}`;
                break;
            case 's_month':
                const paramMonth = DateWorker.getMonthRange();
                where = `created_at=gte.${paramMonth.start}&created_at=lte.${paramMonth.end}`;
                break;
            case 's_date':
                console.log(tab);
                break;
        }

        this.getRecords(where).then(result => {
            const data = Main.groupData(result);
            switch (tab) {
                case 's_today':
                    this.sphObj.activeToday(result, data);
                    break;
                case 's_week':
                    this.sphObj.activeWeek(result, data);
                    break;
                case 's_month':
                    this.sphObj.activeWeek(result, data);
                    break;
            }
        });
    }

    setToday() {
        const todayBlock = this.main.querySelector('div[data-mfs-block="s_today_date"]');
        todayBlock.innerHTML = DateWorker.getDateTableFormat(new Date());
    }

    static groupData(dataRaw) {
        const result = new Map([
            ['income', new Map()],
            ['expense', new Map()]
        ]);

        if (!Array.isArray(dataRaw)) {
            console.error('Ошибка: dataRaw должен быть массивом');
            return {income: {}, expense: {}};
        }

        for (const item of dataRaw) {
            if (!item.type || !item.created_at || !item.sum) {
                console.warn('Пропущена запись с некорректными данными:', item);
                continue;
            }

            const date = DateWorker.formatDate(item.created_at);
            const elem = {
                sum: item.sum,
                date: date,
                category: item.category || null,
                comment: item.comment || null
            };

            let dateMap = result.get(item.type);
            if (!dateMap) {
                if (item.type !== 'income' && item.type !== 'expense') continue;
                dateMap = new Map();
                result.set(item.type, dateMap);
            }

            let entries = dateMap.get(date) || [];
            entries.push(elem);
            dateMap.set(date, entries);
        }

        return {
            income: Object.fromEntries(result.get('income') || []),
            expense: Object.fromEntries(result.get('expense') || [])
        };
    }

    async addRecord(sum, type, category = null, comment = null) {
        const response = await fetch(Dictionary.supabaseUrl, {
            method: 'POST',
            headers: Dictionary.supabaseToken,
            body: JSON.stringify({
                sum: sum,
                type: type,
                category: category,
                comment: comment,
                created_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            console.error('Error supabase:', response.statusText);
            return false;
        }

        return true;
    }

    async getRecords(where = '') {
        let url = '';
        if (where) {
            url += `&${where}`;
        }
        const response = await fetch(Dictionary.supabaseUrl + '?select=*' + url, {
            headers: Dictionary.supabaseToken
        });

        if (!response.ok) {
            console.error('Ошибка:', response.statusText);
            return;
        }

        return await response.json();
    }
}

/**
 * StatisticPageHandler
 */
class SPH {
    static sBlock = document.querySelector('div[data-mf-block="statistic"]');

    constructor() {
        this.mf_s = SPH.sBlock;

        if (Main.isset(this.mf_s)) {
            this.initTabs();
        }
    }

    clickHandler(elem, mObj) {
        switch (elem.dataset['mfClick']) {
            case 's_today':
                this.activeTab(elem.dataset['mfClick']);
                mObj.getStatistic(elem.dataset['mfClick']);
                break;
            case 's_week':
                this.activeTab(elem.dataset['mfClick']);
                mObj.getStatistic(elem.dataset['mfClick']);
                break;
            case 's_month':
                this.activeTab(elem.dataset['mfClick']);
                mObj.getStatistic(elem.dataset['mfClick']);
                break;
            case 's_date':
                this.activeTab(elem.dataset['mfClick']);
                mObj.getStatistic(elem.dataset['mfClick']);
                break;
        }
    }

    activeTab(activeTab) {
        for (const tabCode in this.tabsList) {
            if (tabCode === activeTab) {
                if (this.tabsList[tabCode].classList.contains('hide')) this.tabsList[tabCode].classList.remove('hide');
            } else {
                this.tabsList[tabCode].classList.add('hide');
            }
        }

        this.tabsMenu.forEach(elem => {
            if (elem.dataset['mfClick'] === activeTab) {
                elem.classList.add('active');
            } else {
                if (elem.classList.contains('active')) elem.classList.remove('active');
            }
        });
    }

    initTabs() {
        this.tabToday = this.mf_s.querySelector('div[data-mfs-block="s_today"]');
        this.tabWeek = this.mf_s.querySelector('div[data-mfs-block="s_week"]');
        this.tabMonth = this.mf_s.querySelector('div[data-mfs-block="s_month"]');
        this.tabDate = this.mf_s.querySelector('div[data-mfs-block="s_date"]');

        const tabsListMenu = this.mf_s.querySelector('ul[data-mfs-block="s_tabs_list"]');
        this.tabsMenu = tabsListMenu.querySelectorAll('span[data-mf-click]');

        this.tabsList = {
            's_today': this.tabToday,
            's_week': this.tabWeek,
            's_month': this.tabMonth,
            's_date': this.tabDate,
        };
    }

    activeToday(result, data) {
        const incomeTable = this.tabToday.querySelector('tbody[data-mf-block="table_income"]');
        const expenseTable = this.tabToday.querySelector('tbody[data-mf-block="table_expense"]');

        if (result.length > 0) {
            incomeTable.innerHTML = Template.getStatisticIncome(data.income);
            expenseTable.innerHTML = Template.getStatisticExpense(data.expense);
        } else {
            incomeTable.innerHTML = '<tr><td>Дані відсутні</td></tr>';
            expenseTable.innerHTML = '<tr><td colspan="3">Дані відсутні</td></tr>';
        }
    }

    activeWeek(result, data) {
        const incomeTable = this.tabWeek.querySelector('tbody[data-mf-block="table_income"]');
        const expenseTable = this.tabWeek.querySelector('tbody[data-mf-block="table_expense"]');
        const expenseTotalTable = this.tabWeek.querySelector('tbody[data-mf-block="table_expense_total"]');

        if (result.length > 0) {
            incomeTable.innerHTML = Template.getStatisticIncomeWeek(data.income);
            expenseTable.innerHTML = Template.getStatisticExpenseWeek(data.expense, expenseTotalTable);
        } else {
            incomeTable.innerHTML = '<tr><td>Дані відсутні</td></tr>';
            expenseTable.innerHTML = '<tr><td colspan="3">Дані відсутні</td></tr>';
        }
    }

    activeMonth(result, data) {

        console.log(result, data);
    }
}

class Template {
    static getStatisticIncome(data) {
        let html = '';
        let sum = 0;

        for (const date in data) {
            for (const elem of data[date]) {
                html += `<tr><td>${elem.sum}</td></tr>`;
                sum += elem.sum;
            }
        }
        html += `<tr><td>Загалом: <b>${sum}</b></td></tr>`;

        return html;
    }

    static getStatisticIncomeWeek(data) {
        let html = '';
        let sum = 0;

        for (const date in data) {
            html += `<tr><td>${DateWorker.getDateTableFormat(new Date(date))}</td></tr>`;
            for (const elem of data[date]) {
                html += `<tr><td>${elem.sum}</td></tr>`;
                sum += elem.sum;
            }
        }
        html += `<tr><td>Загалом: <b>${sum}</b></td></tr>`;

        return html;
    }

    static getStatisticExpense(data) {
        let html = '';
        let sum = 0;

        for (const date in data) {
            for (const elem of data[date]) {
                html +=
                    `<tr>
                        <td>${elem.sum}</td>
                        <td>${Dictionary.expenseCategory[elem.category]}</td>
                        <td>${elem.comment || ''}</td>
                    </tr>`;
                sum += elem.sum;
            }
        }
        html += `<tr><td>Загалом: <b>${sum}</b></td></tr>`;

        return html;
    }

    static getStatisticExpenseWeek(data, categoryTable) {
        let html = '';
        let sum = 0;
        const categorySum = {};

        for (const date in data) {
            html += `<tr><td>${DateWorker.getDateTableFormat(new Date(date))}</td></tr>`;
            for (const elem of data[date]) {
                html +=
                    `<tr>
                        <td>${elem.sum}</td>
                        <td>${Dictionary.expenseCategory[elem.category]}</td>
                        <td>${elem.comment || ''}</td>
                    </tr>`;
                sum += elem.sum;
                if (categorySum[elem.category] > 0) {
                    categorySum[elem.category] += elem.sum;
                } else {
                    categorySum[elem.category] = elem.sum;
                }
            }
        }
        html += `<tr><td>Загалом: <b>${sum}</b></td></tr>`;
        Template.setDataToExpenseWeekTotalTable(categorySum, categoryTable)
        return html;
    }

    static setDataToExpenseWeekTotalTable(data, table) {
        let html = '';
        
        for (const category in data) {
            html += `<tr><td>${data[category]}</td><td>${Dictionary.expenseCategory[category]}</td></tr>`;
        }

        table.innerHTML = html;
    }
}

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

class Dictionary {
    static type = {
        "income": "Дохід",
        "expense": "Витрати"
    };

    static expenseCategory = {
        "pr": "Продукти",
        "cf": "Кафе",
        "cm": "Кумунальні платежі",
        "md": "Аптека",
        "eva": "Eva/Makeup",
        "zoo": "Зоотовари",
        "cl": "Одяг",
        "usd": "Валюта",
        "ot": "Інше",
    };

    static supabaseUrl = 'https://vntunuzrneoakdckqjvk.supabase.co/rest/v1/fin_statistic';

    static supabaseToken = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudHVudXpybmVvYWtkY2txanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MTI5NzEsImV4cCI6MjA2NzI4ODk3MX0.CWJIVqq-x5_doDk8rsl8ZJWP7um9VakuIDBihcfsrsU',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudHVudXpybmVvYWtkY2txanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MTI5NzEsImV4cCI6MjA2NzI4ODk3MX0.CWJIVqq-x5_doDk8rsl8ZJWP7um9VakuIDBihcfsrsU'
    }
}