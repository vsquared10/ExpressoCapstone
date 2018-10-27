const express = require('express');
const apiRouter = express.Router();
const employeeRouter = require('./employees');
const menuRouter = require('./menus');

apiRouter.use('/employees', employeeRouter);
apiRouter.use('/menus', menuRouter);

module.exports = apiRouter;
