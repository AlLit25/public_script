class DataWorker {
    constructor(mainObj, mainBlock, auth, sphObj) {
        this.dh = new DataHandler(auth);
        this.mainObj = mainObj;
        this.main = mainBlock;
        this.sphObj = sphObj;

        const balanceBlock = this.main.querySelector('div[data-mf-block="balance"]');
        this.inputUah = balanceBlock.querySelector('input[data-mf-elem="balance_uah"]');
        this.inputUsd = balanceBlock.querySelector('input[data-mf-elem="balance_usd"]');
        this.balanceeUpdate = 0;

        this.getBalance();
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
                    this.updateUahBalance(sumInput.value, 'income');
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
                    this.updateUahBalance(expenseSum.value, 'expense');
                    expenseCat.value = '';
                    expenseSum.value = '';
                    expenseCom.value = '';
                    this.mainObj.activeBlock('menu');
                }
            });
        } else {
            alert('Обовʼязково необхідно вказати суму та категорію');
        }
    }

    updateUahBalance(sum, type) {
        this.dh.getBalance().then(balance => {
            let sumUpdate = 0;
            let idRow = 0;
            let sumUsd = 0;

            if (Main.isset(balance[0]['uah'])) {
                sumUpdate = Number(balance[0]['uah']);
                idRow = Number(balance[0]['id']);
                sumUsd = Number(balance[0]['usd']);
            }

            if (type === 'income') {
                sumUpdate = sumUpdate + Number(sum);
            } else if (type === 'expense') {
                sumUpdate = sumUpdate - Number(sum);
            }

            if (idRow > 0) {
                this.dh.updateBalance(idRow, sumUpdate, sumUsd).then();
            }
        });

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

    getBalance() {
        this.dh.getBalance().then(result => {
           if (result.length > 0) {
               for (const item of result) {
                   this.balanceeUpdate = item['id'];
                   this.inputUah.value = item['uah'];
                   this.inputUsd.value = item['usd'];
               }
           }
        });
    }

    saveBalance() {
        if (this.inputUah.value.length > 0 || this.inputUsd.value.length > 0) {
            if (this.balanceeUpdate > 0) {
                this.dh.updateBalance(this.balanceeUpdate, Number(this.inputUah.value), Number(this.inputUsd.value))
                    .then(() => { location.reload(); })
            } else {
                this.dh.addBalance(Number(this.inputUah.value), Number(this.inputUsd.value))
                    .then(() => { location.reload(); });
            }
        }
    }
}