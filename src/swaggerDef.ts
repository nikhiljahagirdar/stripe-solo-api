const swaggerDef = {
  info: {
    version: '1.0.0',
    title: 'Stripe Management API',
    description: 'API documentation for the Stripe Management application.',
  },
  security: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  // Set the base directory for the API
  baseDir: __dirname,
  // Glob pattern to find your jsdoc files (controllers and routes)
  filesPattern: ['./controllers/**/*.ts', './routes/**/*.ts'],
  // URL where SwaggerUI will be rendered
  swaggerUIPath: '/api-docs',
  // Expose OpenAPI UI
  exposeSwaggerUI: true,
  // Expose Open API JSON Docs documentation in `api-docs.json` path.
  exposeApiDocs: true,
  // Open API JSON Docs endpoint.
  apiDocsPath: '/api-docs.json',
  // Set non-required fields as nullable by default
  notRequiredAsNullable: false,
  // You can customize your UI options
  swaggerUiOptions: {},
};

export default swaggerDef;