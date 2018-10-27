const express = require('express');
const menuRouter = express.Router();
const menuItemRouter = require('./menu-items')
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const isValid = (req, res, next) => {
  if(!req.body.menu.title) {
    res.sendStatus(400);
  };
  next();
};

menuRouter.param('menuId', (req, res, next, menuId) => {
  const sql = `SELECT * FROM Menu WHERE id = ${menuId}`;
  db.get(sql, (error, row) => {
    if(error) {
      next(error);
    } else if (row) {
      req.menu = row;
      next();
    } else {
      res.sendStatus(404);
    };
  });
});

menuRouter.use('/:menuId/menu-items', menuItemRouter);

menuRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Menu', (error, rows) => {
    error ? next(error) : res.status(200).json({menus: rows});
  });
});

menuRouter.get('/:menuId', (req, res, next) => {
  db.get(`SELECT * FROM Menu WHERE id = ${req.params.menuId}`, (error, row) => {
    error ? next(error) : res.status(200).json({menu: row});
  });
});

menuRouter.put('/:menuId', isValid, (req, res, next) => {
  const sql = `UPDATE Menu SET title = $title WHERE id = $id`;
  const values = {
                  $title: req.body.menu.title,
                  $id: req.params.menuId
                 };
  db.run(sql, values, (error) => {
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE id = ${req.params.menuId}`, (error, row) => {
        error ? next(error) : res.status(200).json({menu: row});
      });
    };
  });
});

menuRouter.delete('/:menuId', (req, res, next) => {
  const id = req.params.menuId;
  db.get(`SELECT * FROM MenuItem WHERE menu_id = ${id}`, (error, row) => {
    if(error) {
      next(error);
    } else if(row) {
      res.sendStatus(400);
    } else {
      db.run(`DELETE FROM Menu WHERE id = ${id}`, (error) => {
        error ? next(error) : res.sendStatus(204)
      });
    };
  });
});

menuRouter.post('/', isValid, (req, res, next) => {
  const sql = `INSERT INTO Menu (title) VALUES ($title)`;
  db.run(sql, {$title: req.body.menu.title}, function(error) {
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE id = ${this.lastID}`, (error, row) => {
        error ? next(error) : res.status(201).json({menu: row});
      });
    };
  });
});

module.exports = menuRouter;
