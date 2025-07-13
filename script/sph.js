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