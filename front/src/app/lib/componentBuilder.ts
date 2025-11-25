// lib/componentBuilder.ts
/**
 * Helper para construir el objeto de components desde el frontend
 * Toma los valores de los inputs y construye la estructura exacta
 * que espera la API de WhatsApp
 */

interface UserInputValues {
  [key: string]: string | number;
}

// Interfaz para validación
export interface FieldValidation {
  type?: 'url' | 'email' | 'phone' | 'number';
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
}

// Interfaz completa de RequiredField
interface RequiredField {
  id: string;
  componentType: 'header' | 'body' | 'button';
  componentIndex?: number;
  parameterType: string;
  subType?: string;
  required?: boolean;
  label?: string;
  validation?: FieldValidation;
}

export interface WhatsAppComponent {
  type: string;
  sub_type?: string;
  index?: string;
  parameters: Array<{
    type: string;
    text?: string;
    image?: { link: string };
    video?: { link: string };
    document?: { link: string, filename?: string };
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
    coupon_code?: string;
  }>;
}

export class ComponentBuilder {
  /**
   * Construye el array de components desde los valores del usuario
   */
  static buildComponents(
    requiredFields: RequiredField[],
    userValues: UserInputValues,
    componentsTemplate: WhatsAppComponent[]
  ): WhatsAppComponent[] {
    // Clonar template
    const components = structuredClone(componentsTemplate);
    // Rellenar cada componente
    for (const component of components) {
      if (component.type === 'header') {
        this.fillHeaderComponent(component, requiredFields, userValues);
      } else if (component.type === 'body') {
        this.fillBodyComponent(component, requiredFields, userValues);
      } else if (component.type === 'button') {
        this.fillButtonComponent(component, requiredFields, userValues);
      }
    }

    // Filtrar componentes vacíos (opcionales no completados)
    return components.filter(comp => {
      if (!comp.parameters || comp.parameters.length === 0) return false;

      // Verificar si al menos un parámetro tiene valor
      return comp.parameters.some(param => {
        if (param.text) return param.text.trim() !== '';
        if (param.image?.link) return param.image.link.trim() !== '';
        if (param.video?.link) return param.video.link.trim() !== '';
        if (param.document?.link) return param.document.link.trim() !== '';
        if (param.payload) return param.payload.trim() !== '';
        if (param.currency) return true;
        if (param.date_time) return true;
        if (param.coupon_code) return param.coupon_code.trim() !== '';
        return false;
      });
    });
  }

  /**
   * Rellena HEADER component
   */
  private static fillHeaderComponent(
    component: WhatsAppComponent,
    requiredFields: RequiredField[],
    userValues: UserInputValues
  ): void {
    const headerFields = requiredFields.filter(f => f.componentType === 'header');

    if (headerFields.length === 0) return;

    const param = component.parameters[0];
    if (!param) return;

    // Para documentos, buscar tanto la URL como el filename
    if (param.type === 'document' && param.document) {
      const urlField = headerFields.find(f => f.id === 'header_document');
      const filenameField = headerFields.find(f => f.id === 'header_document_filename');

      if (urlField) {
        const urlValue = userValues[urlField.id];
        if (urlValue) {
          param.document.link = String(urlValue);
        }
      }

      if (filenameField) {
        const filenameValue = userValues[filenameField.id];
        if (filenameValue && String(filenameValue).trim() !== '') {
          param.document.filename = String(filenameValue);
        }
      }
    } else {
      // Para otros tipos de header (imagen, video, texto)
      const field = headerFields[0];
      const value = userValues[field.id];

      if (!value) return;

      if (param.type === 'image' && param.image) {
        param.image.link = String(value);
      } else if (param.type === 'video' && param.video) {
        param.video.link = String(value);
      } else if (param.type === 'text') {
        param.text = String(value);
      }
    }
  }

  /**
   * Rellena BODY component
   */
  private static fillBodyComponent(
    component: WhatsAppComponent,
    requiredFields: RequiredField[],
    userValues: UserInputValues
  ): void {
    const bodyFields = requiredFields.filter(
      f => f.componentType === 'body'
    );
    for (const [index, param] of component.parameters.entries()) {
      if (param.type === 'text') {
        const field = bodyFields.find(f => f.id === `body_${index}`);
        if (field) {
          const value = userValues[field.id];
          if (value) param.text = String(value);
        }
      } else if (param.type === 'currency' && param.currency) {
        const codeField = bodyFields.find(f => f.id === `body_${index}_currency_code`);
        const amountField = bodyFields.find(f => f.id === `body_${index}_currency_amount`);

        if (codeField && amountField) {
          const code = userValues[codeField.id];
          const amount = userValues[amountField.id];

          if (code && amount) {
            const numAmount = Number.parseFloat(String(amount));
            param.currency.code = String(code).toUpperCase();
            param.currency.amount_1000 = Math.round(numAmount * 1000);
            param.currency.fallback_value = `${code} ${numAmount.toFixed(2)}`;
          }
        }
      } else if (param.type === 'date_time' && param.date_time) {
        const dateField = bodyFields.find(f => f.id === `body_${index}_datetime`);

        if (dateField) {
          const dateValue = userValues[dateField.id];

          if (dateValue) {
            const date = new Date(String(dateValue));

            param.date_time.fallback_value = date.toLocaleDateString('pt-BR');
            param.date_time.day_of_week = date.getDay();
            param.date_time.year = date.getFullYear();
            param.date_time.month = date.getMonth() + 1;
            param.date_time.day_of_month = date.getDate();
            param.date_time.hour = date.getHours();
            param.date_time.minute = date.getMinutes();
            param.date_time.calendar = 'GREGORIAN';
          }
        }
      }
    }
  }

  /**
   * Rellena BUTTON component
   */
  private static fillButtonComponent(
    component: WhatsAppComponent,
    requiredFields: RequiredField[],
    userValues: UserInputValues
  ): void {
    const buttonIndex = Number.parseInt(component.index || '0');
    const buttonFields = requiredFields.filter(
      f => f.componentType === 'button' && f.componentIndex === buttonIndex
    );

    if (buttonFields.length === 0) return;

    const field = buttonFields[0];
    const value = userValues[field.id];

    if (!value) return;

    const param = component.parameters[0];
    if (!param) return;

    if (component.sub_type === 'quick_reply') {
      if (param.type === 'payload') {
        param.payload = String(value);
      }
    } else if (component.sub_type === 'url' || component.sub_type === 'otp') {
      if (param.type === 'text') {
        param.text = String(value);
      }
    } else if (component.sub_type === 'copy_code') {
      // Cambio específico para copy_code
      if (param.type === 'coupon_code') {
        param.coupon_code = String(value);
      }
    }
  }

  /**
   * Valida que todos los campos requeridos estén completos
   */
  static validateRequiredFields(
    requiredFields: RequiredField[],
    userValues: UserInputValues
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const field of requiredFields) {
      if (field.required) {
        const value = userValues[field.id];

        if (!value || String(value).trim() === '') {
          errors.push(`${field.label} é obrigatório`);
        }

        // Validaciones adicionales
        if (value && field.validation) {
          const strValue = String(value);

          if (field.validation.type === 'url') {
            try {
              new URL(strValue);
            } catch {
              errors.push(`${field.label} deve ser uma URL válida`);
            }
          }

          if (field.validation.maxLength && strValue.length > field.validation.maxLength) {
            errors.push(
              `${field.label} não pode ter mais de ${field.validation.maxLength} caracteres`
            );
          }

          if (field.validation.pattern) {
            const regex = new RegExp(field.validation.pattern);
            if (!regex.test(strValue)) {
              errors.push(`${field.label} tem formato inválido`);
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default ComponentBuilder;