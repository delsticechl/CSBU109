// Swagger / OpenAPI 3.0 configuration
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Orders & Inventory Management API',
      version: '1.0.0',
      description:
        'Lab 3 homework - e-commerce orders API built with Node.js, Express and MySQL (mysql2/promise).'
    },
    servers: [{ url: 'http://localhost:3000/api/v1', description: 'Development Local Server' }],
    components: {
      parameters: {
        id: {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer', minimum: 1, example: 1 },
          description: 'Numeric ID of the resource'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Order 999 not found' }
          }
        }
      }
    }
  },
  // glob patterns need forward slashes (path.join returns backslashes on Windows)
  apis: [path.join(__dirname, '../routes/*.js').replace(/\\/g, '/')]
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('Swagger UI documentation is ready at: http://localhost:3000/api-docs');
};

module.exports = setupSwagger;
