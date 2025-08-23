class DataWorker {
    constructor(mainObj, mainBlock, auth, sphObj) {
        this.dh = new DataHandler(auth);
        this.mainObj = mainObj;
        this.main = mainBlock;
        this.sphObj = sphObj;

        const balanceBlock = this.main.querySelector('div[data-mf-block="balance"]');
        this.inputUah = balanceBlock.querySelector('input[data-mf-elem="balance_uah"]');
        this.inputUsd = balanceBlock.querySelector('input[data-mf-elem="balance_usd"]');
        this.differenceSpan = balanceBlock.querySelector('span[data-mf-elem="difference"]');
        this.balanceeUpdate = 0;
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
        const dateInput = incomeBlock.querySelector('input[data-mf-input="date_income"]');

        if (sumInput.value.length > 0) {
            this.dh.addRecord(sumInput.value, 'income', dateInput.value).then(result => {
                if (result) {
                    this.updateUahBalance(sumInput.value, 'income');
                    sumInput.value = '';
                }
            });
        } else {
            alert('Обовʼязково необхідно вказати суму');
        }
    }

    static setDate(codeInput) {
        const dateInput = document.querySelector(`input[data-mf-input="date_${codeInput}"]`);

        if (dateInput.value.length === 0) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');

            dateInput.value = `${year}-${month}-${day}`;
        }
    }

    addExpense() {
        const expenseBlock = this.main.querySelector('div[data-mf-block="expense"]');
        const expenseCat = expenseBlock.querySelector('select[data-mf-input="expense_category"]');
        const expenseDate = expenseBlock.querySelector('input[data-mf-input="date_expense"]');
        const expenseSum = expenseBlock.querySelector('input[data-mf-input="expense_sum"]');
        const expenseCom = expenseBlock.querySelector('textarea[data-mf-input="expense_comment"]');

        if (expenseSum.value.length > 0 && expenseCat.value.length) {
            this.dh.addRecord(expenseSum.value, 'expense', expenseDate.value, expenseCat.value, expenseCom.value)
                .then(result => {
                    if (result) {
                        this.updateUahBalance(expenseSum.value, 'expense');
                        expenseSum.value = '';
                        expenseCom.value = '';
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
            if (Main.isset(result)) {
                if (result.length > 0) {

                    const spanLastDiff = this.main.querySelector('span[data-mf-elem="last_date_difference"]');
                    for (const item of result) {
                        this.balanceeUpdate = item['id'];
                        this.inputUah.value = item['uah'];
                        this.inputUsd.value = item['usd'];
                        this.differenceSpan.innerHTML = item['uah'];

                        if (item['last_check'] !== null) {
                            const lastCheck = DateWorker.formatDate(item['last_check']);
                            const lastCheckDayName = DateWorker.getNameDayOfWeek(lastCheck);
                            spanLastDiff.innerHTML = `${lastCheck} (${lastCheckDayName}) - ${item['difference']} uah`;
                        }
                    }
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

    addItemCheckBalance() {
        const block = document.querySelector('div[data-mf-block-balance="balance_check_list"]');
        let check = true;

        if (Main.isset(block)) {
            const itemListCheck =
                block.querySelectorAll('input[data-mf-input="balance_check"]');

            if (itemListCheck.length > 1) {
                itemListCheck.forEach(item => {
                    if (item.value.length === 0) {check = false;}
                });
            } else {
                if (itemListCheck[0].value.length === 0) {check = false;}
            }

            if (check) {
                this.insertInputBalance(block, itemListCheck[0]);
            }
        }
    }

    insertInputBalance(blockParent, input) {
        const copyBlock = input.closest('div[data-mf-block-balance="balance_check_elem"]');
        const newBlock = copyBlock.cloneNode(true);
        const inputNewBlock = newBlock.querySelector('input[data-mf-input="balance_check"]');

        inputNewBlock.value = '';

        blockParent.appendChild(newBlock);
    }

    dropElem(elem) {
        const block = document.querySelector('div[data-mf-block-balance="balance_check_list"]');
        const listElem = block.querySelectorAll('div[data-mf-block-balance="balance_check_elem"]');

        if (listElem.length > 1) {
            const dropElem = elem.closest('div[data-mf-block-balance="balance_check_elem"]');
            dropElem.remove();
        }
    }

    setDifference() {
        const balanceInput = this.main.querySelector('input[data-mf-elem="balance_uah"]');
        const balanceCheckList = this.main.querySelectorAll('input[data-mf-input="balance_check"]');

        let sumCheck = 0;
        for (const item of balanceCheckList) {
            sumCheck += Number(item.value);
        }

        this.differenceSpan.innerHTML = `${Number(balanceInput.value) - sumCheck}`;
    }

    saveDateDifference() {
        const difference = this.main.querySelector('span[data-mf-elem="difference"]');

        this.dh.updateDifference(this.balanceeUpdate, Number(difference.innerText)).then(() => {
            location.reload();
        });
    }
}