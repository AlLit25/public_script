class DataHandler {
    constructor(auth) {
        this.auth = auth;
    }

    async addRecord(sum, type, category = null, comment = null) {
        let accessToken = this.auth.getCookie('access_token');
        const tokenType = this.auth.getCookie('token_type') || 'Bearer';
        const userId = this.auth.getCookie('u_id');

        if (!accessToken || this.auth.isTokenExpired()) {
            accessToken = await this.auth.refreshAccessToken();
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
        let accessToken = this.auth.getCookie('access_token');
        const tokenType = this.auth.getCookie('token_type') || 'Bearer';
        const userId = this.auth.getCookie('u_id');
        let whereUrl = `&user_id=eq.${encodeURIComponent(userId)}`;

        if (where) {
            whereUrl = `&${where}&user_id=eq.${encodeURIComponent(userId)}`;
        }

        if (!accessToken || this.auth.isTokenExpired()) {
            accessToken = await this.auth.refreshAccessToken();
            if (!accessToken) {
                console.error('Failed to refresh token, cannot proceed');
                return false;
            }
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
        let accessToken = this.auth.getCookie('access_token');
        const tokenType = this.auth.getCookie('token_type') || 'Bearer';
        const userId = this.auth.getCookie('u_id');

        if (!accessToken || this.auth.isTokenExpired()) {
            accessToken = await this.auth.refreshAccessToken();
            if (!accessToken) {
                console.error('Failed to refresh token, cannot proceed');
                return false;
            }
        }

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
        let accessToken = this.auth.getCookie('access_token');
        const tokenType = this.auth.getCookie('token_type') || 'Bearer';
        const userId = this.auth.getCookie('u_id');

        if (!accessToken || this.auth.isTokenExpired()) {
            accessToken = await this.auth.refreshAccessToken();
            if (!accessToken) {
                console.error('Failed to refresh token, cannot proceed');
                return false;
            }
        }

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
        let accessToken = this.auth.getCookie('access_token');
        const tokenType = this.auth.getCookie('token_type') || 'Bearer';
        const userId = this.auth.getCookie('u_id');

        if (!accessToken || this.auth.isTokenExpired()) {
            accessToken = await this.auth.refreshAccessToken();
            if (!accessToken) {
                console.error('Failed to refresh token, cannot proceed');
                return false;
            }
        }

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
}