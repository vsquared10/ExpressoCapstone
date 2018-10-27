const express = require('express');
const menuItemRouter = express.Router({mergeParams: true});
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const isValid = (req, res, next) => {
  const mi = req.body.menuItem;
  const name = mi.name;
  const desc = mi.description;
  const inv = mi.inventory;
  const price = mi.price;
  if(!name || !desc || !inv || !price) {
    res.sendStatus(400);
  };
  next();
};

menuItemRouter.param('menuItemId', (req, res, next, menuItemId) => {
  db.get(`SELECT * FROM MenuItem WHERE id = ${menuItemId}`, (error, row) => {
    if(error) {
      next(error);
    };
    row ? next() : res.sendStatus(404);
  });
});

menuItemRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM MenuItem WHERE menu_id = ${req.params.menuId}`, (error, rows) => {
    error ? next(error) : res.status(200).json({menuItems: rows});
  });
});

menuItemRouter.put('/:menuItemId', isValid, (req, res, next) => {
  const menuItemId = req.params.menuItemId;
  const sql = `UPDATE MenuItem SET name = $name, description = $desc,
               inventory = $inv, price = $price
               WHERE id = $id`;
  const values = {
                  $name: req.body.menuItem.name,
                  $desc: req.body.menuItem.description,
                  $inv: req.body.menuItem.inventory,
                  $price: req.body.menuItem.price,
                  $id: menuItemId
                 };
  db.run(sql, values, function(error) {
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM MenuItem WHERE id = ${menuItemId}`, (error, row) => {
        error ? next(error) : res.status(200).json({menuItem: row});
      });
    };
  });
});

menuItemRouter.post('/', isValid, (req, res, next) => {
  const sql = `INSERT INTO MenuItem (name, description, inventory, price, menu_id)
               VALUES ($name, $desc, $inv, $price, $menuId)`;
  const values = {
                  $name: req.body.menuItem.name,
                  $desc: req.body.menuItem.description,
                  $inv: req.body.menuItem.inventory,
                  $price: req.body.menuItem.price,
                  $menuId: req.params.menuId
                };
  db.run(sql, values, function(error) {
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM MenuItem WHERE id = ${this.lastID}`, (errow, row) => {
        error ? next(error) : res.status(201).json({menuItem: row});
      });
    };
  });
});

menuItemRouter.delete('/:menuItemId', (req, res, next) => {
  db.run(`DELETE FROM MenuItem WHERE id = ${req.params.menuItemId}`, (error) => {
    error ? next(error) : res.sendStatus(204);
  });
});

module.exports = menuItemRouter;
