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
                alert('Failed to refresh token, cannot proceed');
                // location.reload();
            } else {
                alert('Access token updated');
            }
        }

        return {'tokenType': tokenType, 'accessToken': accessToken, 'userId': userId};
    }

    async addRecord(sum, type, category = null, comment = null) {
        const {tokenType, accessToken, userId} = await this.getAuth();

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
            console.error('Ошибка:', response.statusText);
            return;
        }

        return await response.json();
    }

    async getBalance() {
        const {tokenType, accessToken, userId} = await this.getAuth();

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
            console.error('Ошибка:', response.statusText);
            return;
        }

        return await response.json();
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
                console.error('Supabase error:', response.status, errorData);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error adding record:', error);
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
            console.error('Error updating record:', error);
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
            console.error('Error updating record:', error);
            return false;
        }
    }
}