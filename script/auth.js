class Auth {
    constructor(mainBlock) {
        this.main = mainBlock;
    }

    auth() {
        const login = this.main.querySelector('input[data-mf-input="login"]');
        const pass = this.main.querySelector('input[data-mf-input="pass"]');

        this.signIn(login.value, pass.value).then(loginData => {
            this.setCookie('access_token', loginData.session['access_token'], 7);
            this.setCookie('expires_at', loginData.session['expires_at'], 7);
            this.setCookie('refresh_token', loginData.session['refresh_token'], 7);
            this.setCookie('token_type', loginData.session['token_type'], 7);
            this.setCookie('email', loginData.user['email'], 7);
            this.setCookie('u_id', loginData.user['id'], 7);
            this.setCookie('role', loginData.user['role'], 7);

            location.reload();
        });
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
            return true;
        }

        return expiresAtDate < new Date();
    }

    async refreshAccessToken() {
        const refreshToken = this.getCookie('refresh_token');

        if (!refreshToken) {
            return null;
        }

        try {
            const response = await fetch(`${Dictionary.supabaseAuth}/auth/v1/token?grant_type=refresh_token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': Dictionary.anonTocken
                },
                body: JSON.stringify({refresh_token: refreshToken})
            });

            if (!response.ok) {
                alert(`Failed to refresh token: ${response.status}`);
            }

            const {access_token, expires_at, refresh_token} = await response.json();
            this.setCookie('access_token', access_token, 7);
            this.setCookie('expires_at', new Date(Date.now() + expires_at * 1000).toISOString(), 7);
            this.setCookie('refresh_token', refresh_token, 7);

            return access_token;
        } catch (error) {
            // console.error('Error refreshing token:', error);
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
                // console.error('Помилка під час входу');
            }

            return {
                user: data.user,
                session: data
            };
        } catch (error) {
            // console.error('помилка входу:', error.message);
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
}