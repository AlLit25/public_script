class DataWorker {
    constructor(mainObj, mainBlock, auth, sphObj) {
        this.dh = new DataHandler(auth);
        this.mainObj = mainObj;
        this.main = mainBlock;
        this.sphObj = sphObj;
    }

    setCategory() {
        const expenseCategory = this.main.querySelector('select[data-mf-input="expense_category"]');

        let optionHtml = '';

        for (const code in Dictionary.expenseCategory) {
            optionHtml += `<option value="${code}">${Dictionary.expenseCategory[code]}</option>`
        }

        expenseCategory.innerHTML = optionHtml;
    }

    addIncome() {
        const incomeBlock = this.main.querySelector('div[data-mf-block="income"]');
        const sumInput = incomeBlock.querySelector('input[data-mf-input="income"]');

        if (sumInput.value.length > 0) {
            this.dh.addRecord(sumInput.value, 'income').then(result => {
                if (result) {
                    sumInput.value = '';
                    this.mainObj.activeBlock('menu');
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
            this.dh.addRecord(expenseSum.value, 'expense', expenseCat.value, expenseCom.value).then(result => {
                if (result) {
                    expenseCat.value = '';
                    expenseSum.value = '';
                    expenseCom.value = '';
                    this.main.activeBlock('menu');
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
                this.mainObj.setToday();
                break;
            case 's_week':
                const paramWeek = DateWorker.getWeekRange();
                where = `created_at=gte.${paramWeek.start}&created_at=lte.${paramWeek.end}`;
                this.mainObj.setWeekdays(paramWeek.start, paramWeek.end);
                break;
            case 's_month':
                const paramMonth = DateWorker.getMonthRange();
                where = `created_at=gte.${paramMonth.start}&created_at=lte.${paramMonth.end}`;
                this.mainObj.setMonth(paramMonth.start, paramMonth.end);
                break;
            case 's_date':
                const paramDate = this.getWhereForDateTab();
                where = paramDate.where;
                break;
        }

        this.dh.getRecords(where).then(result => {
            const data = DataWorker.groupData(result);
            switch (tab) {
                case 's_today':
                    this.sphObj.activeToday(result, data);
                    break;
                case 's_week':
                    this.sphObj.activeWeek(result, data);
                    break;
                case 's_month':
                    this.sphObj.activeMonth(result, data);
                    break;
                case 's_date':
                    this.sphObj.activeDate(result, data);
                    break;
            }
        });
    }

    getWhereForDateTab() {
        const dateBlock = this.main.querySelector('div[data-mfs-block="s_date"]');
        const dateFrom = dateBlock.querySelector('input[data-mf-elem="s_date_from"]');
        const dateTo = dateBlock.querySelector('input[data-mf-elem="s_date_to"]');

        return {
            "start": dateFrom,
            "end": dateTo,
            "where": `created_at=gte.${dateFrom.value}&created_at=lte.${dateTo.value}`
        };
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
}