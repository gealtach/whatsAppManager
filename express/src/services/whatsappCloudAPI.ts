// backend/services/whatsappCloudAPI.ts
interface WhatsAppMessage {
    messaging_product: "whatsapp";
    to: string;
    type: "text" | "image" | "video" | "document";
    text?: { body: string };
    image?: { link: string; caption?: string };
    video?: { link: string; caption?: string };
    document?: { link: string; caption?: string; filename: string };
}

export class WhatsAppCloudAPI {
    private readonly baseURL = 'https://graph.facebook.com/v24.0';

    async enviar(phoneId: string, accessToken: string, toPhone: string, message: string, complement: string | null) {
        let messageData: WhatsAppMessage;

        // Si hay complement (media URL), determinar el tipo de mensaje
        if (complement) {
            // Detectar el tipo de medio por la extensión o estructura del complement
            if (/\.(jpg|jpeg|png|gif)$/i.exec(complement)) {
                messageData = {
                    messaging_product: "whatsapp",
                    to: this.formatPhoneNumber(toPhone),
                    type: "image",
                    image: {
                        link: complement,
                        caption: message
                    }
                };
            } else if (/\.(mp4|avi|mov)$/i.exec(complement)) {
                messageData = {
                    messaging_product: "whatsapp",
                    to: this.formatPhoneNumber(toPhone),
                    type: "video",
                    video: {
                        link: complement,
                        caption: message
                    }
                };
            } else if (/\.(pdf|doc|docx|txt)$/i.exec(complement)) {
                messageData = {
                    messaging_product: "whatsapp",
                    to: this.formatPhoneNumber(toPhone),
                    type: "document",
                    document: {
                        link: complement,
                        caption: message,
                        filename: "documento"
                    }
                };
            } else {
                // Por defecto, texto
                messageData = {
                    messaging_product: "whatsapp",
                    to: this.formatPhoneNumber(toPhone),
                    type: "text",
                    text: { body: message }
                };
            }
        } else {
            // Mensaje de texto simple
            messageData = {
                messaging_product: "whatsapp",
                to: this.formatPhoneNumber(toPhone),
                type: "text",
                text: { body: message }
            };
        }

        try {
            const response = await fetch(`${this.baseURL}/${phoneId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(`WhatsApp API Error: ${JSON.stringify(result)}`);
            }

            return result;
        } catch (error) {
            console.error('Error enviando mensaje WhatsApp:', error);
            throw error;
        }
    }

    private formatPhoneNumber(phone: string): string {
        return phone.replaceAll(/\D/g, '');
    }
}