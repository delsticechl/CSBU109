const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Shop API Documentation',
      version: '1.0.0',
      description: 'API documentation for Products and Categories management',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: [path.join(__dirname, '../routes/*.js')], // Ensures routes are found correctly from any directory
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
