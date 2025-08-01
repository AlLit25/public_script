document.addEventListener('DOMContentLoaded', () => {
    new Main();
});

class Main {
    constructor() {
        this.main = document.querySelector('main');
        this.blockList = {};
        this.sphObj = new SPH();

        if (Main.isset(this.main)) {
            this.auth = new Auth(this.main);
            this.dw = new DataWorker(this, this.main, this.auth, this.sphObj);
            this.getBlockList();
            this.main.addEventListener('click', event => this.clickHandler(event.target));
            this.dw.setCategory();

            this.firstScreen();
        }
    }

    firstScreen() {
        if (!this.auth.isTokenExpired()) {
            this.setLogin();
            this.activeBlock('menu');
        } else {
            this.activeBlock('auth');
        }
    }

    setLogin() {
        const loginElem = document.querySelector('p[data-mf-elem="login"]');
        loginElem.innerHTML = this.auth.getCookie('email');
    }

    setToday() {
        const todayBlock = this.main.querySelector('div[data-mfs-block="s_today_date"]');
        todayBlock.innerHTML = DateWorker.getDateTableFormat(new Date());
    }

    setWeekdays(dateStart, dateEnd) {
        const weekBlock = this.main.querySelector('div[data-mfs-block="s_week_date"]');
        const startName = DateWorker.getNameDayOfWeek(dateStart);
        const endName = DateWorker.getNameDayOfWeek(dateEnd);
        weekBlock.innerHTML = `<b>${dateStart} (${startName}) - ${dateEnd} (${endName})</b>`;
    }

    setMonth(dateStart, dateEnd) {
        const weekBlock = this.main.querySelector('div[data-mfs-block="s_month_date"]');
        const startName = DateWorker.getNameDayOfWeek(dateStart);
        const endName = DateWorker.getNameDayOfWeek(dateEnd);
        weekBlock.innerHTML = `<b>${dateStart} (${startName}) - ${dateEnd} (${endName})</b>`;
    }

    clickHandler(elem) {
        if (elem.hasAttribute('data-mf-click')) {
            let nextCheck = true;

            switch (elem.dataset.mfClick) {
                case 'auth':
                    this.auth.auth();
                    break;
                case 'menu':
                case 'expense':
                case 'income':
                    this.activeBlock(elem.dataset.mfClick);
                    nextCheck = false;
                    break;
                case 'add_income':
                    this.dw.addIncome();
                    nextCheck = false;
                    break;
                case 'expense_add':
                    this.dw.addExpense();
                    nextCheck = false;
                    break;
                case 'statistic':
                    this.activeBlock(elem.dataset.mfClick);
                    this.dw.getStatistic();
                    nextCheck = false;
                    break;
            }

            if (nextCheck) {
                this.sphObj.clickHandler(elem, this.dw);
            }
        }
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
                if (this.blockList[code].classList.contains('hide'))
                    this.blockList[code].classList.remove('hide');
            } else {
                this.blockList[code].classList.add('hide');
            }
        }
    }

    static isset(elem) {
        return elem !== null && elem !== undefined;
    }
}