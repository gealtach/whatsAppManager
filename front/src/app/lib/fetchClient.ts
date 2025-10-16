// lib/fetchClient.ts
class FetchClient {
    private readonly baseURL: string = process.env.NEXT_PUBLIC_API_URL || '';
    private csrfToken: string | null = null;

    // Método para inicializar el CSRF token
    async initializeCSRF() {
        try {
            const response = await fetch(`${this.baseURL}/csrf-token`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                this.csrfToken = data.csrfToken;
            } else {
                console.warn('⚠️ Could not initialize CSRF token');
            }
        } catch (error) {
            console.error('❌ Error initializing CSRF token:', error);
        }
    }

    async fetch(url: string, options: RequestInit = {}) {
        const config: RequestInit = {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        // ✅ Agregar CSRF token para métodos no seguros (POST, PUT, DELETE, PATCH)
        if (this.csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(options.method || 'GET')) {
            config.headers = {
                ...config.headers,
                'X-CSRF-Token': this.csrfToken,
            };
        }

        try {
            const response = await fetch(`${this.baseURL}${url}`, config);

            // Si hay error de autenticación, podrías redirigir al login
            if (response.status === 401) {
                // Opcional: redirigir al login
                // window.location.href = '/login';
                throw new Error('Não autenticado');
            }

            return response;
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    // Métodos helpers
    get(url: string) {
        return this.fetch(url);
    }

    post(url: string, data?: unknown) {
        return this.fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    put(url: string, data?: unknown) {
        return this.fetch(url, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    delete(url: string) {
        return this.fetch(url, {
            method: 'DELETE',
        });
    }
}

export const fetchClient = new FetchClient();