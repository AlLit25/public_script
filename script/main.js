document.addEventListener('DOMContentLoaded', () => {
    new Main();
});

class Main {
    constructor() {
        this.main = document.querySelector('main');
        this.blockList = {};
        this.sphObj = new SPH();

        if (Main.isset(this.main)) {
            this.getBlockList();
            this.main.addEventListener('click', event => this.clickHandler(event.target));
            this.setCategory();

            this.firstScreen();
        }
    }

    firstScreen() {
        if (!this.isTokenExpired()) {
            this.activeBlock('menu');
        } else {
            this.activeBlock('auth');
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

    static isset(elem) {
        return elem !== null && elem !== undefined;
    }

    auth() {
        const login = this.main.querySelector('input[data-mf-input="login"]');
        const pass = this.main.querySelector('input[data-mf-input="pass"]');

        this.signIn(login.value, pass.value).then(loginData => {
            console.log(loginData);

            this.setCookie('access_token', loginData.session['access_token'], 7);
            this.setCookie('expires_at', loginData.session['expires_at'], 7);
            this.setCookie('refresh_token', loginData.session['refresh_token'], 7);
            this.setCookie('token_type', loginData.session['token_type'], 7);
            this.setCookie('email', loginData.user['email'], 7);
            this.setCookie('u_id', loginData.user['id'], 7);
            this.setCookie('role', loginData.user['role'], 7);

            location.reload();
        })
    }

    isTokenExpired() {
        const expiresAt = this.getCookie('expires_at');

        if (!expiresAt) {
            return true;
        }

        let expiresAtDate;

        if (!isNaN(expiresAt) && Number(expiresAt) > 0) {
            expiresAtDate = new Date(Number(expiresAt) * 1000);
        } else {
            expiresAtDate = new Date(expiresAt);
        }

        if (isNaN(expiresAtDate.getTime())) {
            console.error('Invalid expires_at format:', expiresAt);
            return true;
        }

        return expiresAtDate < new Date();
    }

    async refreshAccessToken() {
        const refreshToken = this.getCookie('refresh_token');
        if (!refreshToken) {
            console.error('No refresh token found');
            return null;
        }

        try {
            const response = await fetch(`https://${Dictionary.supabaseAuth}/auth/v1/token?grant_type=refresh_token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': Dictionary.anonTocken
                },
                body: JSON.stringify({refresh_token: refreshToken})
            });

            if (!response.ok) {
                console.error(`Failed to refresh token: ${response.status}`);
            }

            const {access_token, expires_at, refresh_token} = await response.json();
            this.setCookie('access_token', access_token, 7);
            this.setCookie('expires_at', new Date(Date.now() + expires_at * 1000).toISOString(), 7);
            this.setCookie('refresh_token', refresh_token, 7);

            return access_token;
        } catch (error) {
            console.error('Error refreshing token:', error);
            return null;
        }
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

    setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/";
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.indexOf(nameEQ) === 0) {
                return decodeURIComponent(cookie.substring(nameEQ.length));
            }
        }
        return null;
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
        let accessToken = this.getCookie('access_token');
        const tokenType = this.getCookie('token_type') || 'Bearer';
        const userId = this.getCookie('u_id');

        if (!accessToken || this.isTokenExpired()) {
            accessToken = await this.refreshAccessToken();
            if (!accessToken) {
                console.error('Failed to refresh token, cannot proceed');
                return false;
            }
        }

        try {
            const response = await fetch(Dictionary.supabaseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `${tokenType} ${accessToken}`,
                    'Content-Type': 'application/json',
                    'apikey': Dictionary.anonTocken,
                },
                body: JSON.stringify({
                    sum: sum,
                    type: type,
                    category: category,
                    comment: comment,
                    created_at: new Date().toISOString(),
                    user_id: userId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Supabase error:', response.status, errorData);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error adding record:', error);
            return false;
        }
    }

    async getRecords(where = '') {
        let accessToken = this.getCookie('access_token');
        const tokenType = this.getCookie('token_type') || 'Bearer';
        const userId = this.getCookie('u_id');
        let whereUrl = `&user_id=eq.${encodeURIComponent(userId)}`;

        if (where) {
            whereUrl = `&${where}&user_id=eq.${encodeURIComponent(userId)}`;
        }

        if (!accessToken || this.isTokenExpired()) {
            accessToken = await this.refreshAccessToken();
            if (!accessToken) {
                console.error('Failed to refresh token, cannot proceed');
                return false;
            }
        }
        console.log(Dictionary.supabaseUrl + '?select=*' + whereUrl);
        const response = await fetch(Dictionary.supabaseUrl + '?select=*' + whereUrl, {
            method: 'GET',
            headers: {
                'Authorization': `${tokenType} ${accessToken}`,
                'Content-Type': 'application/json',
                'apikey': Dictionary.anonTocken,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Ошибка:', response.statusText);
            return;
        }

        return await response.json();
    }
}