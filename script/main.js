document.addEventListener('DOMContentLoaded', () => {
    new Main()
});

class Main {
    constructor() {
        this.main = document.querySelector('main');
        this.blockList = {};

        if (Main.isset(this.main)) {
            this.main.addEventListener('click', event => this.clickHandler(event.target));
            this.getBlockList();
            this.setCategory();
        }
    }

    clickHandler(elem) {
        if (elem.hasAttribute('data-mf-click')) {
            switch (elem.dataset.mfClick) {
                case 'menu':
                case 'expense':
                case 'statistic':
                case 'income':
                    this.activeBlock(elem.dataset.mfClick);
                    break;
                case 'add_income':
                    this.addIncome();
                    break;
                case 'expense_add':
                    this.addExpense();
                    break;
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

    async addRecord(sum, type, category = null, comment = null) {
        const response = await fetch('https://vntunuzrneoakdckqjvk.supabase.co/rest/v1/fin_statistic', {
            method: 'POST',
            headers: Dictionary.supabase,
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

    static supabase = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudHVudXpybmVvYWtkY2txanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MTI5NzEsImV4cCI6MjA2NzI4ODk3MX0.CWJIVqq-x5_doDk8rsl8ZJWP7um9VakuIDBihcfsrsU',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudHVudXpybmVvYWtkY2txanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MTI5NzEsImV4cCI6MjA2NzI4ODk3MX0.CWJIVqq-x5_doDk8rsl8ZJWP7um9VakuIDBihcfsrsU'
    }
}