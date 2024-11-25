const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Api spotify',
    description: 'Progetto tecnologia e linguaggi per il web',
  },
  host: 'localhost:3100',
  schemes: ['http'],
};

const outputFile = './path/swagger-output.json';
const endpointsFiles = ['./path/endpointsUser.js', './path/endpointsBook.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);