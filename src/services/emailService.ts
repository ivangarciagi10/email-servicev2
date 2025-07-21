import sgMail from '@sendgrid/mail';
import { DraftOrder, Customer, Advisor } from '../types/shopify';

export class EmailService {
  private sendGridApiKey: string;
  private fromEmail: string;
  private fromName: string;
  private sentEmails: Set<string> = new Set();

  constructor() {
    this.sendGridApiKey = process.env.SENDGRID_API_KEY || '';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@em949.generandoideas.com';
    this.fromName = process.env.FROM_NAME || 'GNP';

    console.log('Email Service initialized with from email:', this.fromEmail);

    if (this.sendGridApiKey) {
      sgMail.setApiKey(this.sendGridApiKey);
    } else {
      console.warn('SENDGRID_API_KEY no está configurada. Los correos no se enviarán.');
    }

    // Limpiar el Set de correos enviados cada hora
    setInterval(() => {
      this.sentEmails.clear();
      console.log('🧹 Limpieza de cache de correos enviados');
    }, 60 * 60 * 1000); // Cada hora
  }

  /**
   * Envía correo de confirmación al cliente
   */
  async sendCustomerConfirmationEmail(
    customerEmail: string,
    draftOrder: DraftOrder,
    customer: Customer
  ): Promise<void> {
    const subject = 'Cotización Creada Exitosamente';
    
    // Validar email del cliente
    if (!customerEmail || !/^[^@]+@[^@]+\.[^@]+$/.test(customerEmail)) {
      console.error('❌ El email del cliente es inválido o está vacío:', customerEmail);
      return;
    }

    // Crear clave única para este correo
    const emailKey = `customer_${draftOrder.id}_${customerEmail}`;
    
    // Verificar si ya se envió este correo
    if (this.sentEmails.has(emailKey)) {
      console.log(`⚠️ Correo al cliente ya enviado para draft order ${draftOrder.id}, ignorando...`);
      return;
    }

    const htmlContent = this.generateCustomerEmailHTML(draftOrder, customer);
    const textContent = this.generateCustomerEmailText(draftOrder, customer);

    const msg = {
      to: customerEmail,
      from: {
        email: this.fromEmail,
        name: this.fromName,
      },
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    console.log('📧 Datos del correo al cliente:');
    console.log('  - Destinatario:', customerEmail);
    console.log('  - Remitente:', this.fromEmail);
    console.log('  - Nombre remitente:', this.fromName);
    console.log('  - Asunto:', subject);
    console.log('  - Cliente:', `${customer.first_name} ${customer.last_name}`);

    try {
      if (!this.sendGridApiKey) {
        console.log('Simulando envío de correo al cliente:', customerEmail);
        console.log('Contenido del correo:', textContent);
        // Marcar como enviado incluso en simulación
        this.sentEmails.add(emailKey);
        return;
      }
      
      await sgMail.send(msg);
      console.log(`✅ Correo de confirmación enviado a: ${customerEmail}`);
      
      // Marcar como enviado después del envío exitoso
      this.sentEmails.add(emailKey);
      console.log(`📝 Correo al cliente marcado como enviado: ${emailKey}`);
    } catch (error) {
      const err = error as any;
      if (err.response && err.response.body && err.response.body.errors) {
        console.error('Errores de SendGrid:', err.response.body.errors);
      }
      console.error('Error enviando correo al cliente:', err);
      throw err;
    }
  }

  /**
   * Envía correo de notificación al asesor
   */
  async sendAdvisorNotificationEmail(
    advisorEmail: string,
    draftOrder: DraftOrder,
    customer: Customer,
    advisor: Advisor
  ): Promise<void> {
    const subject = 'Nueva Cotización Generada por Cliente';
    
    // Validar email del asesor
    if (!advisorEmail || !/^[^@]+@[^@]+\.[^@]+$/.test(advisorEmail)) {
      console.error('❌ El email del asesor es inválido o está vacío:', advisorEmail);
      return;
    }

    // Crear clave única para este correo
    const emailKey = `advisor_${draftOrder.id}_${advisorEmail}`;
    
    // Verificar si ya se envió este correo
    if (this.sentEmails.has(emailKey)) {
      console.log(`⚠️ Correo al asesor ya enviado para draft order ${draftOrder.id}, ignorando...`);
      return;
    }

    const htmlContent = this.generateAdvisorEmailHTML(draftOrder, customer, advisor);
    const textContent = this.generateAdvisorEmailText(draftOrder, customer, advisor);

    const msg = {
      to: advisorEmail,
      from: {
        email: this.fromEmail,
        name: this.fromName,
      },
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    console.log('📧 Datos del correo al asesor:');
    console.log('  - Destinatario:', advisorEmail);
    console.log('  - Remitente:', this.fromEmail);
    console.log('  - Nombre remitente:', this.fromName);
    console.log('  - Asunto:', subject);
    console.log('  - Asesor:', `${advisor.first_name} ${advisor.last_name}`);

    try {
      if (!this.sendGridApiKey) {
        console.log('Simulando envío de correo al asesor:', advisorEmail);
        console.log('Contenido del correo:', textContent);
        // Marcar como enviado incluso en simulación
        this.sentEmails.add(emailKey);
        return;
      }
      
      await sgMail.send(msg);
      console.log(`✅ Correo de notificación enviado a asesor: ${advisorEmail}`);
      
      // Marcar como enviado después del envío exitoso
      this.sentEmails.add(emailKey);
      console.log(`📝 Correo al asesor marcado como enviado: ${emailKey}`);
    } catch (error) {
      const err = error as any;
      if (err.response && err.response.body && err.response.body.errors) {
        console.error('Errores de SendGrid:', err.response.body.errors);
      }
      console.error('Error enviando correo al asesor:', err);
      throw err;
    }
  }

  /**
   * Genera el contenido HTML del correo para el cliente
   */
  private generateCustomerEmailHTML(draftOrder: DraftOrder, customer: Customer): string {
    const customerName = `${customer.first_name} ${customer.last_name}`;
    const orderNumber = draftOrder.name;
    const currency = draftOrder.currency;

    // Calcular precios correctos
    const { adjustedLineItems } = this.calculateDecorationPrice(draftOrder.line_items);
    // NUEVO: Calcular precios base y decorado por producto
    const itemsHtml = adjustedLineItems.map(item => {
      const basePrice = parseFloat(item.price) - (item.decorationPrice || 0);
      const decoration = item.decorationPrice || 0;
      const totalBase = basePrice * item.quantity;
      const totalDecoration = decoration; // decorado ya es el total para la línea
      const total = totalBase + totalDecoration;
      const unitario = (totalBase + totalDecoration) / item.quantity;
      return `
        <div class="item">
          <p><strong>${item.title}</strong></p>
          <p>Cantidad: ${item.quantity}</p>
          <p>Precio unitario: ${currency} ${unitario.toFixed(2)}</p>
          <p>Precio total: ${currency} ${total.toFixed(2)}</p>
        </div>
      `;
    }).join('');
    const totalPrice = adjustedLineItems.reduce((acc, item) => {
      const basePrice = parseFloat(item.price) - (item.decorationPrice || 0);
      const decoration = item.decorationPrice || 0;
      return acc + basePrice * item.quantity + decoration;
    }, 0).toFixed(2);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Cotización Creada</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; }
          .order-details { background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .item { margin: 10px 0; padding: 10px; border-bottom: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Cotización Creada Exitosamente!</h1>
          </div>
          <div class="content">
            <p>Estimado/a ${customerName}
            <p>Su cotización ha sido creada exitosamente. A continuación encontrará los detalles:</p>
            <div class="order-details">
              <h3>Detalles de la Cotización</h3>
              <p><strong>Número de Cotización:</strong> ${orderNumber}</p>
              <p><strong>Fecha:</strong> ${new Date(draftOrder.created_at).toLocaleDateString('es-ES')}</p>
              <p><strong>Total:</strong> ${currency} ${totalPrice}</p>
            </div>
            <h3>Productos Cotizados:</h3>
            ${itemsHtml}
            <p>Nuestro equipo de asesores se pondrá en contacto con usted pronto para continuar con el proceso.</p>
            <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no responda a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Genera el contenido de texto del correo para el cliente
   */
  private generateCustomerEmailText(draftOrder: DraftOrder, customer: Customer): string {
    const customerName = `${customer.first_name} ${customer.last_name}`;
    const orderNumber = draftOrder.name;
    const currency = draftOrder.currency;

    // Calcular precio del decorado y total real
    const { adjustedLineItems } = this.calculateDecorationPrice(draftOrder.line_items);
    const totalPrice = this.calculateTotalWithDecoration(adjustedLineItems).toFixed(2);

    return `
¡Cotización Creada Exitosamente!

Estimado/a ${customerName},

Su cotización ha sido creada exitosamente. A continuación encontrará los detalles:

DETALLES DE LA COTIZACIÓN:
- Número de Cotización: ${orderNumber}
- Fecha: ${new Date(draftOrder.created_at).toLocaleDateString('es-ES')}
- Total: ${currency} ${totalPrice}

PRODUCTOS COTIZADOS:
${adjustedLineItems.map(item => `
- ${item.title}
  Cantidad: ${item.quantity}
  Precio: ${currency} ${parseFloat(item.price).toFixed(2)}
`).join('')}

Nuestro equipo de asesores se pondrá en contacto con usted pronto para continuar con el proceso.

Si tiene alguna pregunta, no dude en contactarnos.

Este es un correo automático, por favor no responda a este mensaje.
    `;
  }

  /**
   * Genera el contenido HTML del correo para el asesor
   */
  private generateAdvisorEmailHTML(
    draftOrder: DraftOrder, 
    customer: Customer, 
    advisor: Advisor
  ): string {
    const customerName = `${customer.first_name} ${customer.last_name}`;
    const advisorName = `${advisor.first_name} ${advisor.last_name}`;
    const orderNumber = draftOrder.name;
    const currency = draftOrder.currency;

    // Calcular precios correctos
    const { adjustedLineItems } = this.calculateDecorationPrice(draftOrder.line_items);
    const itemsHtml = adjustedLineItems.map(item => {
      const basePrice = parseFloat(item.price) - (item.decorationPrice || 0);
      const decoration = item.decorationPrice || 0;
      const totalBase = basePrice * item.quantity;
      const totalDecoration = decoration;
      const total = totalBase + totalDecoration;
      const unitario = (totalBase + totalDecoration) / item.quantity;
      return `
        <div class="item">
          <p><strong>${item.title}</strong></p>
          <p>Cantidad: ${item.quantity}</p>
          <p>Precio unitario: ${currency} ${unitario.toFixed(2)}</p>
          <p>Precio total: ${currency} ${total.toFixed(2)}</p>
        </div>
      `;
    }).join('');
    const totalPrice = adjustedLineItems.reduce((acc, item) => {
      const basePrice = parseFloat(item.price) - (item.decorationPrice || 0);
      const decoration = item.decorationPrice || 0;
      return acc + basePrice * item.quantity + decoration;
    }, 0).toFixed(2);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nueva Cotización</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; }
          .customer-info { background-color: #e9ecef; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .order-details { background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .item { margin: 10px 0; padding: 10px; border-bottom: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nueva Cotización Generada</h1>
          </div>
          <div class="content">
            <p>Estimado/a ${advisorName}</p>
            <p>Se ha generado una nueva cotización para uno de sus clientes asignados.</p>
            <div class="customer-info">
              <h3>Información del Cliente</h3>
              <p><strong>Nombre:</strong> ${customerName}</p>
              <p><strong>Email:</strong> ${customer.email}</p>
              <p><strong>Teléfono:</strong> ${customer.phone || 'No proporcionado'}</p>
            </div>
            <div class="order-details">
              <h3>Detalles de la Cotización</h3>
              <p><strong>Número de Cotización:</strong> ${orderNumber}</p>
              <p><strong>Fecha:</strong> ${new Date(draftOrder.created_at).toLocaleDateString('es-ES')}</p>
              <p><strong>Total:</strong> ${currency} ${totalPrice}</p>
            </div>
            <h3>Productos Cotizados:</h3>
            ${itemsHtml}
            <p>Por favor, contacte al cliente lo antes posible para continuar con el proceso de venta.</p>
            <p>Puede acceder a la cotización desde el panel de administración de Shopify.</p>
          </div>
          <div class="footer">
            <p>Este es un correo automático del sistema de notificaciones.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Genera el contenido de texto del correo para el asesor
   */
  private generateAdvisorEmailText(
    draftOrder: DraftOrder, 
    customer: Customer, 
    advisor: Advisor
  ): string {
    const customerName = `${customer.first_name} ${customer.last_name}`;
    const advisorName = `${advisor.first_name} ${advisor.last_name}`;
    const orderNumber = draftOrder.name;
    const currency = draftOrder.currency;

    // Calcular precio del decorado y total real
    const { adjustedLineItems } = this.calculateDecorationPrice(draftOrder.line_items);
    const totalPrice = this.calculateTotalWithDecoration(adjustedLineItems).toFixed(2);

    return `
Nueva Cotización Generada

Estimado/a ${advisorName},

Se ha generado una nueva cotización para uno de sus clientes asignados.

INFORMACIÓN DEL CLIENTE:
- Nombre: ${customerName}
- Email: ${customer.email}
- Teléfono: ${customer.phone || 'No proporcionado'}

DETALLES DE LA COTIZACIÓN:
- Número de Cotización: ${orderNumber}
- Fecha: ${new Date(draftOrder.created_at).toLocaleDateString('es-ES')}
- Total: ${currency} ${totalPrice}

PRODUCTOS COTIZADOS:
${adjustedLineItems.map(item => `
- ${item.title}
  Cantidad: ${item.quantity}
  Precio: ${currency} ${parseFloat(item.price).toFixed(2)}
`).join('')}

Por favor, contacte al cliente lo antes posible para continuar con el proceso de venta.

Puede acceder a la cotización desde el panel de administración de Shopify.

Este es un correo automático del sistema de notificaciones.
    `;
  }

  /**
   * Calcula el precio del decorado basado en los custom attributes
   */
  private calculateDecorationPrice(lineItems: any[]): { totalDecorationPrice: number; decorationDetails: string[]; adjustedLineItems: any[] } {
    let totalDecorationPrice = 0;
    const decorationDetails: string[] = [];
    const adjustedLineItems: any[] = [];

    lineItems.forEach((item) => {
      // Log sólo del precio base
      console.log(`📦 Producto: ${item.title} - Precio base: ${item.price}`);
      // Crear una copia del item para ajustar el precio
      const adjustedItem = { ...item };
      let itemDecorationPrice = 0;
      // Verificar si tiene custom attributes (puede venir como properties o customAttributes)
      const customAttrs = item.customAttributes || item.properties || [];
      if (customAttrs && Array.isArray(customAttrs)) {
        customAttrs.forEach((attr: any) => {
          const attrName = attr.key || attr.name;
          const attrValue = attr.value;
          // Buscar el atributo "Decorado" (case-insensitive)
          if (attrName && attrName.toLowerCase().includes('decorado')) {
            // Log sólo del precio del decorado
            console.log(`     🎨 Decorado encontrado (${attrName}): ${attrValue}`);
            const decorationPrice = this.extractDecorationPrice(attrValue);
            if (decorationPrice > 0) {
              itemDecorationPrice = decorationPrice;
              const itemDecorationTotal = decorationPrice * item.quantity;
              totalDecorationPrice += itemDecorationTotal;
              decorationDetails.push(`${item.title}: ${item.quantity}x $${decorationPrice.toFixed(2)} = $${itemDecorationTotal.toFixed(2)}`);
            }
          }
        });
      }
      if (itemDecorationPrice > 0) {
        const originalPrice = parseFloat(item.price);
        const newPrice = originalPrice + itemDecorationPrice;
        adjustedItem.price = newPrice.toFixed(2);
        adjustedItem.decorationPrice = itemDecorationPrice;
      }
      adjustedLineItems.push(adjustedItem);
    });
    return { totalDecorationPrice, decorationDetails, adjustedLineItems };
  }

  /**
   * Extrae el precio del decorado del valor del custom attribute
   */
  private extractDecorationPrice(value: string): number {
    if (!value) return 0;

    console.log(`🔍 Extrayendo precio de: "${value}"`);

    // Primero, limpiar el valor removiendo espacios y caracteres no numéricos excepto comas y puntos
    const cleanedValue = value.trim();
    
    // Buscar patrones comunes de precios
    const pricePatterns = [
      /\$([\d,]+(?:\.\d{2})?)/,           // $1,234.56
      /([\d,]+(?:\.\d{2})?)\s*pesos?/i,   // 1,234.56 pesos
      /([\d,]+(?:\.\d{2})?)\s*mxn/i,      // 1,234.56 MXN
      /([\d,]+(?:\.\d{2})?)\s*usd/i,      // 1,234.56 USD
      /precio[:\s]*([\d,]+(?:\.\d{2})?)/i, // precio: 1,234.56
      /costo[:\s]*([\d,]+(?:\.\d{2})?)/i,  // costo: 1,234.56
      /por\s*unidad[:\s]*([\d,]+(?:\.\d{2})?)/i, // por unidad: 1,234.56
      /([\d,]+(?:\.\d{2})?)\s*por\s*unidad/i, // 1,234.56 por unidad
      /([\d,]+(?:\.\d{2})?)/               // cualquier número con comas y decimales
    ];

    for (const pattern of pricePatterns) {
      const match = cleanedValue.match(pattern);
      if (match && match[1]) {
        // Remover comas del número antes de parsear
        const numericValue = match[1].replace(/,/g, '');
        const price = parseFloat(numericValue);
        if (!isNaN(price) && price > 0) {
          console.log(`✅ Precio extraído: $${price.toFixed(2)} (patrón: ${pattern})`);
          return price;
        }
      }
    }

    console.log(`❌ No se pudo extraer precio de: "${value}"`);
    console.log(`💡 Formatos esperados: $1,234.56, 1,234.56 pesos, precio: 1,234.56, etc.`);
    return 0;
  }

  /**
   * Calcula el total real sumando todos los productos con sus decorados incluidos
   */
  private calculateTotalWithDecoration(adjustedLineItems: any[]): number {
    return adjustedLineItems.reduce((total, item) => {
      console.log("EL ITEM ES: ", item);
      const itemTotal = parseFloat(item.price) * item.quantity;
      return total + itemTotal;
    }, 0);
  }
} 