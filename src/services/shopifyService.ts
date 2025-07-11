import axios, { AxiosInstance } from 'axios';
import { Customer, Advisor, Metafield } from '../types/shopify';

export class ShopifyService {
  private api: AxiosInstance;
  private shopDomain: string;
  private accessToken: string;

  constructor() {
    this.shopDomain = process.env.SHOPIFY_SHOP_DOMAIN || 'api-gnp';
    this.accessToken = process.env.SHOPIFY_ACCESS_TOKEN || '';
    
    console.log('Shopify Service initialized with domain:', this.shopDomain);
    
    this.api = axios.create({
      baseURL: `https://${this.shopDomain}.myshopify.com/admin/api/2023-10`,
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Obtiene información de un cliente por ID usando GraphQL
   */
  async getCustomer(customerId?: number): Promise<Customer | null> {
    if (!customerId) {
      return null;
    }

    try {
      const query = `
        query getCustomer($id: ID!) {
          customer(id: $id) {
            id
            firstName
            lastName
            email
            phone
            metafields(first: 50) {
              edges {
                node {
                  id
                  namespace
                  key
                  value
                  type
                }
              }
            }
          }
        }
      `;

      const response = await this.api.post('/graphql.json', {
        query,
        variables: {
          id: `gid://shopify/Customer/${customerId}`
        }
      });

      if (response.data.errors) {
        console.error('GraphQL errors:', response.data.errors);
        return null;
      }

      return response.data.data.customer;
    } catch (error) {
      console.error('Error obteniendo cliente con GraphQL:', error);
      return null;
    }
  }

  /**
   * Obtiene el asesor asociado a un cliente a través de metafields usando GraphQL
   */
  async getCustomerAdvisor(customerId: number): Promise<Advisor | null> {
    try {
      console.log(`🔍 Buscando asesor para cliente ID: ${customerId} usando GraphQL`);

      const query = `
        query getCustomerWithMetafields($id: ID!) {
          customer(id: $id) {
            id
            firstName
            lastName
            email
            metafields(first: 50) {
              edges {
                node {
                  id
                  namespace
                  key
                  value
                  type
                }
              }
            }
          }
        }
      `;

      const response = await this.api.post('/graphql.json', {
        query,
        variables: {
          id: `gid://shopify/Customer/${customerId}`
        }
      });

      if (response.data.errors) {
        console.error('GraphQL errors:', response.data.errors);
        return null;
      }

      const customer = response.data.data.customer;
      
      if (!customer) {
        console.log('Cliente no encontrado');
        return null;
      }

      console.log('✅ Cliente encontrado con GraphQL:', customer.firstName, customer.lastName);

      // Buscar el metafield del ejecutivo de cuenta
      const metafields = customer.metafields.edges.map((edge: any) => edge.node);
      const ejecutivoMetafield = metafields.find(
        (metafield: any) => 
          metafield.namespace === 'custom' && 
          metafield.key === 'ejecutivo_de_cuenta'
      );

      if (!ejecutivoMetafield) {
        console.log('❌ No se encontró metafield de ejecutivo de cuenta');
        console.log('Metafields disponibles:', metafields.map((m: any) => `${m.namespace}.${m.key}: ${m.value}`));
        return null;
      }

      console.log('✅ Metafield de ejecutivo encontrado:', ejecutivoMetafield.value);

      // El valor del metafield contiene la referencia al metaobject
      // Formato: gid://shopify/Metaobject/123456789
      const metaobjectGid = ejecutivoMetafield.value;
      
      if (!metaobjectGid || !metaobjectGid.includes('Metaobject/')) {
        console.log('❌ Referencia al metaobject inválida:', metaobjectGid);
        return null;
      }

      // Extraer el ID del metaobject
      const metaobjectId = metaobjectGid.split('/').pop();
      
      if (!metaobjectId) {
        console.log('❌ No se pudo extraer el ID del metaobject');
        return null;
      }

      console.log('🔍 Buscando metaobject con ID:', metaobjectId);

      // Obtener el metaobject del ejecutivo usando GraphQL
      const metaobjectQuery = `
        query getMetaobject($id: ID!) {
          metaobject(id: $id) {
            id
            type
            fields {
              key
              value
              type
            }
          }
        }
      `;

      const metaobjectResponse = await this.api.post('/graphql.json', {
        query: metaobjectQuery,
        variables: {
          id: metaobjectGid
        }
      });

      if (metaobjectResponse.data.errors) {
        console.error('GraphQL errors al obtener metaobject:', metaobjectResponse.data.errors);
        return null;
      }

      const metaobject = metaobjectResponse.data.data.metaobject;
      
      if (!metaobject) {
        console.log('❌ Metaobject no encontrado');
        return null;
      }

      console.log('✅ Metaobject encontrado:', metaobject.type);

      // Extraer los datos del ejecutivo del metaobject
      const fields = metaobject.fields;
      console.log('🔍 Campos del metaobject encontrados:', fields.length);
      console.log('📋 Lista completa de campos:', JSON.stringify(fields, null, 2));
      
      const nombreField = fields.find((field: any) => field.key === 'nombre');
      const emailField = fields.find((field: any) => field.key === 'correo');
      const telefonoField = fields.find((field: any) => field.key === 'telefono');

      console.log('🔍 Búsqueda de campos específicos:');
      console.log('  - nombreField encontrado:', !!nombreField, nombreField?.value);
      console.log('  - emailField encontrado:', !!emailField, emailField?.value);
      console.log('  - telefonoField encontrado:', !!telefonoField, telefonoField?.value);

      if (!nombreField || !emailField) {
        console.log('❌ Campos requeridos no encontrados en el metaobject');
        console.log('Campos disponibles:', fields.map((f: any) => `${f.key}: ${f.value}`));
        return null;
      }

      // Separar nombre y apellido
      const nombreCompleto = nombreField.value || '';
      const nombres = nombreCompleto.split(' ');
      const firstName = nombres[0] || '';
      const lastName = nombres.slice(1).join(' ') || '';

      const advisor: Advisor = {
        id: parseInt(metaobjectId),
        email: emailField.value,
        first_name: firstName,
        last_name: lastName,
        phone: telefonoField?.value || '',
        role: 'Ejecutivo de Cuenta',
      };

      console.log('✅ Asesor encontrado:', advisor.first_name, advisor.last_name, advisor.email);
      return advisor;
    } catch (error) {
      console.error('❌ Error obteniendo asesor del cliente con GraphQL:', error);
      return null;
    }
  }

  /**
   * Obtiene metafields de un cliente usando GraphQL
   */
  async getCustomerMetafields(customerId: number): Promise<Metafield[]> {
    try {
      const query = `
        query getCustomerMetafields($id: ID!) {
          customer(id: $id) {
            metafields(first: 50) {
              edges {
                node {
                  id
                  namespace
                  key
                  value
                  type
                }
              }
            }
          }
        }
      `;

      const response = await this.api.post('/graphql.json', {
        query,
        variables: {
          id: `gid://shopify/Customer/${customerId}`
        }
      });

      if (response.data.errors) {
        console.error('GraphQL errors:', response.data.errors);
        return [];
      }

      return response.data.data.customer.metafields.edges.map((edge: any) => edge.node);
    } catch (error) {
      console.error('Error obteniendo metafields del cliente con GraphQL:', error);
      return [];
    }
  }

  /**
   * Verifica la conexión con Shopify usando GraphQL
   */
  async testConnection(): Promise<boolean> {
    try {
      const query = `
        query {
          shop {
            id
            name
            myshopifyDomain
          }
        }
      `;

      const response = await this.api.post('/graphql.json', { query });
      
      if (response.data.errors) {
        console.error('GraphQL errors:', response.data.errors);
        return false;
      }

      console.log('✅ Conexión con Shopify exitosa:', response.data.data.shop.name);
      return true;
    } catch (error) {
      console.error('❌ Error conectando con Shopify:', error);
      return false;
    }
  }
} 