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
                ...options.headers,
            },
        };

        //  Solo agregar Content-Type: application/json si NO es FormData
        const isFormData = options.body instanceof FormData;
        if (!isFormData) {
            config.headers = {
                'Content-Type': 'application/json',
                ...config.headers,
            };
        }

        //  Agregar CSRF token para métodos no seguros (POST, PUT, DELETE, PATCH)
        if (this.csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(options.method || 'GET')) {
            config.headers = {
                ...config.headers,
                'X-CSRF-Token': this.csrfToken,
            };
        }

        try {
            const response = await fetch(`${this.baseURL}${url}`, config);

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
            body: data instanceof FormData ? data : JSON.stringify(data),
        });
    }

    put(url: string, data?: unknown) {
        return this.fetch(url, {
            method: 'PUT',
            body: data instanceof FormData ? data : JSON.stringify(data),
        });
    }

    delete(url: string) {
        return this.fetch(url, {
            method: 'DELETE',
        });
    }

    async uploadWithProgress(
        url: string,
        formData: FormData,
        onProgress?: (progress: number) => void
    ): Promise<Response> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Configurar tracking de progreso
            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const progress = (e.loaded / e.total) * 100;
                        onProgress(progress);
                    }
                });
            }

            xhr.onload = () => {
                // Crear objeto Response compatible
                const response = new Response(xhr.responseText, {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    headers: new Headers(
                        xhr.getAllResponseHeaders()
                            .split('\r\n')
                            .reduce((headers, line) => {
                                const [key, value] = line.split(': ');
                                if (key && value) {
                                    headers[key] = value;
                                }
                                return headers;
                            }, {} as Record<string, string>)
                    ),
                });

                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(response);
                } else {
                    reject(new Error(`HTTP Error: ${xhr.status}`));
                }
            };

            xhr.onerror = () => reject(new Error('Network error'));
            xhr.ontimeout = () => reject(new Error('Request timeout'));

            // Abrir conexión
            xhr.open('POST', `${this.baseURL}${url}`);

            // Agregar credenciales
            xhr.withCredentials = true;

            //  Agregar CSRF token si existe
            if (this.csrfToken) {
                xhr.setRequestHeader('X-CSRF-Token', this.csrfToken);
            }
            xhr.send(formData);
        });
    }
}

export const fetchClient = new FetchClient();