class DataHandler {
    constructor(auth) {
        this.auth = auth;
    }

    async getAuth() {
        let accessToken = this.auth.getCookie('access_token');
        const tokenType = this.auth.getCookie('token_type') || 'Bearer';
        const userId = this.auth.getCookie('u_id');

        if (!accessToken || this.auth.isTokenExpired()) {
            accessToken = await this.auth.refreshAccessToken();

            if (!accessToken) {
                Notification.show('token_false');
                this.clearCookie();
            } else {
                Notification.show('token_true');
            }
        }

        return {'tokenType': tokenType, 'accessToken': accessToken, 'userId': userId};
    }

    clearCookie() {
        const cookies = ['access_token', 'email', 'expires_at', 'refresh_token', 'role', 'token_type', 'u_id'];

        for (const name of cookies) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }

    }

    async addRecord(sum, type, date = null, category = null, comment = null) {
        const {tokenType, accessToken, userId} = await this.getAuth();
        let dbDate = new Date().toISOString();

        if (date !== null) {
            dbDate = new Date(date).toISOString();
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
                    created_at: dbDate,
                    user_id: userId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                Notification.showAlert('Supabase error:'+response.status);
                return false;
            }

            return true;
        } catch (error) {
            Notification.showAlert('Error adding record: '+error);
            return false;
        }
    }

    async getRecords(where = '') {
        const {tokenType, accessToken, userId} = await this.getAuth();

        let whereUrl = `&user_id=eq.${encodeURIComponent(userId)}`;

        if (where) {
            whereUrl = `&${where}&user_id=eq.${encodeURIComponent(userId)}`;
        }

        // console.log(Dictionary.supabaseUrl + '?select=*' + whereUrl);
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
            Notification.showAlert('Ошибка:'+response);
            return;
        }

        return await response.json();
    }

    async getBalance() {
        const {tokenType, accessToken, userId} = await this.getAuth();

        if (accessToken !== null) {
            const response = await fetch(Dictionary.balanceUrl +
                `?select=*&user_id=eq.${encodeURIComponent(userId)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `${tokenType} ${accessToken}`,
                    'Content-Type': 'application/json',
                    'apikey': Dictionary.anonTocken,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                Notification.showAlert('Ошибка:', response);
                return;
            }

            return await response.json();
        }

        return null;
    }

    async addBalance(sumUah, sumUsd) {
        const {tokenType, accessToken, userId} = await this.getAuth();

        try {
            const response = await fetch(Dictionary.balanceUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `${tokenType} ${accessToken}`,
                    'Content-Type': 'application/json',
                    'apikey': Dictionary.anonTocken,
                },
                body: JSON.stringify({
                    user_id: userId,
                    uah: sumUah,
                    usd: sumUsd,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                Notification.showAlert('Supabase error:', response.status, errorData);
                return false;
            }

            return true;
        } catch (error) {
            Notification.showAlert('Error adding record:', error);
            return false;
        }
    }

    async updateBalance(id, sumUah, sumUsd) {
        const {tokenType, accessToken, userId} = await this.getAuth();

        try {
            const response = await fetch(`${Dictionary.balanceUrl}?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `${tokenType} ${accessToken}`,
                    'Content-Type': 'application/json',
                    'apikey': Dictionary.anonTocken,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    user_id: userId,
                    uah: sumUah,
                    usd: sumUsd,
                    updated_at: new Date().toISOString()
                })
            });

            return response.ok;
        } catch (error) {
            Notification.showAlert('Error updating record:', error);
            return false;
        }
    }

    async updateDifference(id, difference) {
        const {tokenType, accessToken, userId} = await this.getAuth();

        try {
            const response = await fetch(`${Dictionary.balanceUrl}?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `${tokenType} ${accessToken}`,
                    'Content-Type': 'application/json',
                    'apikey': Dictionary.anonTocken,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    user_id: userId,
                    difference: difference,
                    last_check: new Date().toISOString()
                })
            });

            return response.ok;
        } catch (error) {
            Notification.showAlert('Error updating record:', error);
            return false;
        }
    }
}