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
                case 'auth':
                    this.auth();
                    break;
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

    auth() {
        const login = this.main.querySelector('input[data-mf-input="login"]');
        const pass = this.main.querySelector('input[data-mf-input="pass"]');

        console.log(login.value);
        console.log(pass.value);
        this.signIn(login.value, pass.value).then(loginData => {
            console.log(loginData);
            // сохранить значения в куки
        })
    }

    async signIn(email, password) {
        try {
            const response = await fetch(`${Dictionary.supabaseAuth}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: Dictionary.supabaseToken,
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Помилка під час входу');
            }

            return {
                user: data.user,
                session: data
            };
        } catch (error) {
            console.error('помилка входу:', error.message);
            return null;
        }
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