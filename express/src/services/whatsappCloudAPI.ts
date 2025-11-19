// services/whatsappMarketingService.ts
import axios from 'axios';

interface MessageTemplate {
    name: string;
    language: string;
    status?:string;
    components?: Array<{
        type: string;
        parameters: Array<{
            type: string;
            text: string;
        }>;
    }>;
}

interface SendMessageParams {
    phoneNumberId: string;
    accessToken: string;
    to: string;
    template: MessageTemplate;
}

interface SendMessageResponse {
    messaging_product: string;
    contacts: Array<{ input: string; wa_id: string }>;
    messages: Array<{ id: string }>;
}

class WhatsAppMarketingService {
    private readonly baseUrl = 'https://graph.facebook.com/v21.0';

    /**
     * Envía un mensaje usando Marketing Messages API
     */
    async sendTemplateMessage(params: SendMessageParams): Promise<SendMessageResponse> {
        const { phoneNumberId, accessToken, to, template } = params;

        const url = `${this.baseUrl}/${phoneNumberId}/messages`;

        try {
            const response = await axios.post<SendMessageResponse>(
                url,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: to.replaceAll(/\D/g, ''), // Eliminar caracteres no numéricos
                    type: 'template',
                    template: template,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('WhatsApp API Error:', error.response?.data);
                throw new Error(
                    `WhatsApp API Error: ${JSON.stringify(error.response?.data || error.message)}`
                );
            }
            throw error;
        }
    }

    /**
     * Envía mensajes en lote con control de tasa (rate limiting)
     */
    async sendBulkMessages(
        phoneNumberId: string,
        accessToken: string,
        recipients: Array<{ phone: string; id: string }>,
        template: MessageTemplate,
        onProgress?: (sent: number, total: number, recipientId: string, success: boolean) => void,
        delayMs: number = 1000 // Delay entre mensajes para evitar límites de tasa
    ): Promise<Array<{ recipientId: string; success: boolean; messageId?: string; error?: string }>> {
        const results: Array<{ recipientId: string; success: boolean; messageId?: string; error?: string }> = [];

        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];

            try {
                const response = await this.sendTemplateMessage({
                    phoneNumberId,
                    accessToken,
                    to: recipient.phone,
                    template,
                });

                results.push({
                    recipientId: recipient.id,
                    success: true,
                    messageId: response.messages[0]?.id,
                });

                onProgress?.(i + 1, recipients.length, recipient.id, true);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                results.push({
                    recipientId: recipient.id,
                    success: false,
                    error: errorMessage,
                });

                onProgress?.(i + 1, recipients.length, recipient.id, false);
            }

            // Esperar antes del siguiente mensaje (excepto en el último)
            if (i < recipients.length - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        return results;
    }

    /**
     * Obtiene las plantillas disponibles para una cuenta
     */
    async getMessageTemplates(
        wabaId: string, // WhatsApp Business Account ID
        accessToken: string
    ): Promise<MessageTemplate[]> {
        const url = `${this.baseUrl}/${wabaId}/message_templates`;

        try {
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                params: {
                    limit: 100,
                },
            });

            return response.data.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Error fetching templates:', error.response?.data);
                throw new Error(`Failed to fetch templates: ${JSON.stringify(error.response?.data)}`);
            }
            throw error;
        }
    }

    /**
     * Verifica el estado de una cuenta de WhatsApp Business
     */
    async verifyAccount(phoneNumberId: string, accessToken: string): Promise<{
        verified_name: string,
        code_verification_status: string,
        display_phone_number: string,
        quality_rating: string,
        platform_type: string,
        messaging_limit_tier: string,
        throughput: {
            level: string
        },
        id: string
    }> {
        const url = `${this.baseUrl}/${phoneNumberId}`;

        try {
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                params: {
                    fields: 'verified_name,display_phone_number,quality_rating,messaging_limit_tier',
                },
            });

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Account verification failed: ${JSON.stringify(error.response?.data)}`);
            }
            throw error;
        }
    }

    /**
     * Construye una plantilla con parámetros dinámicos
     */
    buildTemplate(
        templateName: string,
        languageCode: string = 'en',
        bodyParameters?: string[]
    ): MessageTemplate {
        const template: MessageTemplate = {
            name: templateName,
            language: languageCode,
        };

        if (bodyParameters && bodyParameters.length > 0) {
            template.components = [
                {
                    type: 'body',
                    parameters: bodyParameters.map(param => ({
                        type: 'text',
                        text: param,
                    })),
                },
            ];
        }

        return template;
    }
}

export const whatsappMarketingService = new WhatsAppMarketingService();
export { WhatsAppMarketingService, MessageTemplate, SendMessageParams };