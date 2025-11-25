// services/templateAnalyzer.ts
/**
 * Sistema completo para analizar templates de WhatsApp
 * y generar la estructura exacta que espera la API
 */

type ComponentType = 'header' | 'body' | 'button';
type HeaderFormat = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION';
type ParameterType = 'text' | 'currency' | 'date_time' | 'image' | 'video' | 'document' | 'payload' | 'coupon_code';
type ButtonSubType = 'quick_reply' | 'url' | 'phone_number' | 'copy_code' | 'catalog' | 'otp' | 'flow';

interface WhatsAppParameter {
  type: ParameterType;
  text?: string;
  coupon_code?: string;
  image?: { link: string };
  video?: { link: string };
  document?: { link: string; filename?: string };
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
  date_time?: {
    fallback_value: string;
    day_of_week?: number;
    year?: number;
    month?: number;
    day_of_month?: number;
    hour?: number;
    minute?: number;
    calendar?: string;
  };
  payload?: string;
}

interface RequiredField {
  id: string; // header_image, body_0, button_0, etc.
  componentType: ComponentType;
  componentIndex?: number; // Para buttons
  parameterType: ParameterType;
  subType?: ButtonSubType;
  label: string;
  placeholder: string;
  required: boolean;
  validation?: {
    type: 'url' | 'text' | 'email' | 'phone' | 'number' | 'currency' | 'date';
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  // Para mostrar info adicional en el frontend
  hint?: string;
}

interface WhatsAppComponent {
  type: ComponentType;
  sub_type?: ButtonSubType;
  index?: string;
  parameters: WhatsAppParameter[];
}

interface TemplateAnalysis {
  name: string;
  language: string;
  category: string;
  status: string;

  // Campos que el usuario debe completar
  requiredFields: RequiredField[];

  // Template vacío listo para llenar
  componentsTemplate: WhatsAppComponent[];

  // Metadata útil
  metadata: {
    hasHeader: boolean;
    headerFormat?: HeaderFormat;
    bodyParameterCount: number;
    bodyParameterTypes: string[]; // ['text', 'currency', 'date_time']
    buttonCount: number;
    buttonTypes: ButtonSubType[];
    totalFields: number;
  };
}

class TemplateAnalyzer {
  /**
   * Analiza el HEADER y genera los campos requeridos
   */
  private analyzeHeader(component: any): {
    fields: RequiredField[];
    template: WhatsAppComponent | null;
  } {
    const fields: RequiredField[] = [];
    let template: WhatsAppComponent | null = null;

    const format = component.format as HeaderFormat;

    switch (format) {
      case 'IMAGE':
        fields.push({
          id: 'header_image',
          componentType: 'header',
          parameterType: 'image',
          label: 'Imagem do Cabeçalho',
          placeholder: 'https://exemplo.com/imagem.jpg',
          required: true,
          validation: {
            type: 'url',
            minLength: 10,
          },
          hint: 'URL da imagem (HTTPS obrigatório)',
        });

        template = {
          type: 'header',
          parameters: [
            {
              type: 'image',
              image: { link: '' },
            },
          ],
        };
        break;

      case 'VIDEO':
        fields.push({
          id: 'header_video',
          componentType: 'header',
          parameterType: 'video',
          label: 'Vídeo do Cabeçalho',
          placeholder: 'https://exemplo.com/video.mp4',
          required: true,
          validation: {
            type: 'url',
          },
          hint: 'URL do vídeo (MP4 recomendado)',
        });

        template = {
          type: 'header',
          parameters: [
            {
              type: 'video',
              video: { link: '' },
            },
          ],
        };
        break;

      case 'DOCUMENT':
        fields.push({
          id: 'header_document',
          componentType: 'header',
          parameterType: 'document',
          label: 'Documento do Cabeçalho',
          placeholder: 'https://exemplo.com/documento.pdf',
          required: true,
          validation: {
            type: 'url',
          },
          hint: 'URL do documento (PDF recomendado)',
        });

        template = {
          type: 'header',
          parameters: [
            {
              type: 'document',
              document: { link: '' },
            },
          ],
        };
        break;

      case 'TEXT':
        fields.push({
          id: 'header_text',
          componentType: 'header',
          parameterType: 'text',
          label: 'Texto do Cabeçalho',
          placeholder: 'Digite o texto',
          required: true,
          validation: {
            type: 'text',
            maxLength: 60,
          },
        });

        template = {
          type: 'header',
          parameters: [
            {
              type: 'text',
              text: '',
            },
          ],
        };
        break;

      case 'LOCATION':
        // Location no requiere parámetros del usuario
        template = {
          type: 'header',
          parameters: [],
        };
        break;
    }

    return { fields, template };
  }

  /**
   * Analiza el BODY y detecta tipos de parámetros
   */
  private analyzeBody(component: any): {
    fields: RequiredField[];
    template: WhatsAppComponent | null;
    parameterTypes: string[];
  } {
    const fields: RequiredField[] = [];
    const parameters: WhatsAppParameter[] = [];
    const parameterTypes: string[] = [];

    const bodyText = component.text || '';

    // Detectar parámetros {{1}}, {{2}}, etc.
    const paramRegex = /\{\{(\d+)\}\}/g;
    const matches = Array.from(bodyText.matchAll(paramRegex));

    if (matches.length === 0) {
      return { fields: [], template: null, parameterTypes: [] };
    }

    // Solución: Convertir los matches a un tipo conocido
    const typedMatches = matches as RegExpMatchArray[];

    // Por ahora, asumimos que todos son TEXT
    // Pero podrías tener lógica para detectar currency o date_time
    typedMatches.forEach((match: RegExpMatchArray, index: number) => {
      const paramNumber = parseInt(match[1]);

      // Detectar tipo por contexto (opcional)
      const paramType = this.detectParameterType(bodyText, paramNumber);

      parameterTypes.push(paramType);

      if (paramType === 'text') {
        fields.push({
          id: `body_${index}`,
          componentType: 'body',
          parameterType: 'text',
          label: `Parâmetro ${paramNumber} do Corpo`,
          placeholder: `Valor para {{${paramNumber}}}`,
          required: true,
          validation: {
            type: 'text',
            maxLength: 1024,
          },
        });

        parameters.push({
          type: 'text',
          text: '',
        });
      } else if (paramType === 'currency') {
        fields.push({
          id: `body_${index}_currency_code`,
          componentType: 'body',
          parameterType: 'currency',
          label: `Moeda ${paramNumber} - Código`,
          placeholder: 'USD',
          required: true,
          validation: {
            type: 'text',
            maxLength: 3,
          },
        });

        fields.push({
          id: `body_${index}_currency_amount`,
          componentType: 'body',
          parameterType: 'currency',
          label: `Moeda ${paramNumber} - Valor`,
          placeholder: '100.99',
          required: true,
          validation: {
            type: 'number',
          },
        });

        parameters.push({
          type: 'currency',
          currency: {
            fallback_value: '',
            code: '',
            amount_1000: 0,
          },
        });
      } else if (paramType === 'date_time') {
        fields.push({
          id: `body_${index}_datetime`,
          componentType: 'body',
          parameterType: 'date_time',
          label: `Data/Hora ${paramNumber}`,
          placeholder: 'DD/MM/YYYY HH:MM',
          required: true,
          validation: {
            type: 'date',
          },
        });

        parameters.push({
          type: 'date_time',
          date_time: {
            fallback_value: '',
          },
        });
      }
    });

    const template: WhatsAppComponent = {
      type: 'body',
      parameters,
    };

    return { fields, template, parameterTypes };
  }

  /**
   * Detecta el tipo de parámetro por contexto (heurística simple)
   */
  private detectParameterType(bodyText: string, paramNumber: number): string {
    const lowercaseText = bodyText.toLowerCase();
    const paramPattern = `{{${paramNumber}}}`;
    const paramIndex = lowercaseText.indexOf(paramPattern.toLowerCase());

    if (paramIndex === -1) return 'text';

    // Buscar contexto alrededor del parámetro
    const contextBefore = lowercaseText.substring(Math.max(0, paramIndex - 20), paramIndex);
    const contextAfter = lowercaseText.substring(paramIndex, Math.min(lowercaseText.length, paramIndex + 40));

    // Detectar currency
    if (
      /(\$|€|£|price|preço|valor|custo|total)/i.test(contextBefore) ||
      /(\$|€|£)/i.test(contextAfter)
    ) {
      return 'currency';
    }

    // Detectar date_time
    if (
      /(data|hora|date|time|quando|when|dia|day)/i.test(contextBefore) ||
      /(data|hora|date|time)/i.test(contextAfter)
    ) {
      return 'date_time';
    }

    return 'text';
  }

  /**
   * Analiza BUTTONS
   */
  private analyzeButtons(component: any): {
    fields: RequiredField[];
    templates: WhatsAppComponent[];
  } {
    const fields: RequiredField[] = [];
    const templates: WhatsAppComponent[] = [];

    const buttons = component.buttons || [];

    buttons.forEach((button: any, index: number) => {
      const buttonType = button.type.toLowerCase() as ButtonSubType;

      // QUICK_REPLY puede tener payload opcional
      if (buttonType === 'quick_reply') {
        fields.push({
          id: `button_${index}_payload`,
          componentType: 'button',
          componentIndex: index,
          parameterType: 'payload',
          subType: buttonType,
          label: `Botão ${index + 1}: ${button.text} (Payload)`,
          placeholder: 'payload-opcional',
          required: false,
          validation: {
            type: 'text',
            maxLength: 256,
          },
          hint: 'Payload opcional para rastrear resposta',
        });

        templates.push({
          type: 'button',
          sub_type: 'quick_reply',
          index: String(index),
          parameters: [
            {
              type: 'payload',
              payload: '',
            },
          ],
        });
      }

      // URL button requiere URL dinámica si tiene {{1}}
      if (buttonType === 'url' && button.url?.includes('{{1}}')) {
        fields.push({
          id: `button_${index}_url_suffix`,
          componentType: 'button',
          componentIndex: index,
          parameterType: 'text',
          subType: buttonType,
          label: `Botão ${index + 1}: ${button.text} (URL)`,
          placeholder: 'sufixo-da-url',
          required: true,
          validation: {
            type: 'text',
            maxLength: 2000,
          },
          hint: `URL base: ${button.url.replace('{{1}}', '')}`,
        });

        templates.push({
          type: 'button',
          sub_type: 'url',
          index: String(index),
          parameters: [
            {
              type: 'text',
              text: '',
            },
          ],
        });
      }

      // COPY_CODE requiere el código
      if (buttonType === 'copy_code') {
        fields.push({
          id: `button_${index}_copy_code`,
          componentType: 'button',
          componentIndex: index,
          parameterType: 'text',
          subType: buttonType,
          label: `Botão ${index + 1}: ${button.text} (Código)`,
          placeholder: 'ABC123',
          required: true,
          validation: {
            type: 'text',
            maxLength: 15,
          },
          hint: 'Código que será copiado',
        });

        templates.push({
          type: 'button',
          sub_type: 'copy_code',
          index: String(index),
          parameters: [
            {
              type: 'coupon_code',
              coupon_code: '',
            },
          ],
        });
      }

      // OTP requiere código OTP
      if (buttonType === 'otp') {
        fields.push({
          id: `button_${index}_otp`,
          componentType: 'button',
          componentIndex: index,
          parameterType: 'text',
          subType: buttonType,
          label: `Botão ${index + 1}: ${button.text} (OTP)`,
          placeholder: '123456',
          required: true,
          validation: {
            type: 'text',
            pattern: '^[0-9]{4,8}$',
          },
          hint: 'Código OTP numérico',
        });

        templates.push({
          type: 'button',
          sub_type: 'otp',
          index: String(index),
          parameters: [
            {
              type: 'text',
              text: '',
            },
          ],
        });
      }
    });

    return { fields, templates };
  }

  /**
   * Analiza un template completo
   */
  analyzeTemplate(template: any): TemplateAnalysis {
    const requiredFields: RequiredField[] = [];
    const componentsTemplate: WhatsAppComponent[] = [];

    let hasHeader = false;
    let headerFormat: HeaderFormat | undefined;
    let bodyParameterCount = 0;
    let bodyParameterTypes: string[] = [];
    let buttonCount = 0;
    let buttonTypes: ButtonSubType[] = [];

    const components = template.components || [];

    components.forEach((component: any) => {
      if (component.type === 'HEADER') {
        hasHeader = true;
        headerFormat = component.format;

        const { fields, template: headerTemplate } = this.analyzeHeader(component);
        requiredFields.push(...fields);
        if (headerTemplate) componentsTemplate.push(headerTemplate);
      } else if (component.type === 'BODY') {
        const { fields, template: bodyTemplate, parameterTypes } = this.analyzeBody(component);
        bodyParameterCount = fields.length;
        bodyParameterTypes = parameterTypes;

        requiredFields.push(...fields);
        if (bodyTemplate) componentsTemplate.push(bodyTemplate);
      } else if (component.type === 'BUTTONS') {
        const { fields, templates } = this.analyzeButtons(component);
        buttonCount = templates.length;
        buttonTypes = templates.map(t => t.sub_type!);

        requiredFields.push(...fields);
        componentsTemplate.push(...templates);
      }
      // FOOTER no requiere parámetros
    });

    return {
      name: template.name,
      language: template.language,
      category: template.category,
      status: template.status,
      requiredFields,
      componentsTemplate,
      metadata: {
        hasHeader,
        headerFormat,
        bodyParameterCount,
        bodyParameterTypes,
        buttonCount,
        buttonTypes,
        totalFields: requiredFields.length,
      },
    };
  }

  /**
   * Procesa múltiples templates
   */
  analyzeTemplates(templates: any[]): TemplateAnalysis[] {
    return templates.map(template => this.analyzeTemplate(template));
  }
}

export const templateAnalyzer = new TemplateAnalyzer();
export { TemplateAnalysis, RequiredField, WhatsAppComponent, WhatsAppParameter };