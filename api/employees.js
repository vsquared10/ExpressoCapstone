const express = require('express');
const employeeRouter = express.Router();
const timesheetRouter = require('./timesheets');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const isValid = (req, res, next) => {
  const emp = req.body.employee;
  const name = emp.name;
  const pos = emp.position;
  const wage = emp.wage;
  if(!name || !pos || !wage) {
    res.sendStatus(400);
  };
  next();
};

employeeRouter.param('employeeId', (req, res, next, employeeId) => {
  db.get(`SELECT * FROM Employee WHERE id = ${employeeId}`, (error, row) => {
    if(error){
      next(error);
    } else if(row) {
      req.employee = row;
      next();
    } else {
      res.sendStatus(404);
    };
  });
});

employeeRouter.use('/:employeeId/timesheets', timesheetRouter);

employeeRouter.get('/', (req, res, next) => {
  db.all("SELECT * FROM Employee WHERE is_current_employee = 1", (error, rows) => {
    error ? next(error) : res.status(200).json({employees: rows});
  });
});

employeeRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({employee: req.employee});
});

employeeRouter.post('/', isValid, (req, res, next) => {
  const sql = `INSERT INTO Employee (name, position, wage)
          VALUES ($name, $position, $wage)`;
  const values = {$name: req.body.employee.name,
                  $position: req.body.employee.position,
                  $wage: req.body.employee.wage};
  db.run(sql, values, function(error) {
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE id = ${this.lastID}`, (error, row) => {
        error ? next(error) : res.status(201).json({employee: row});
      });
    };
  });
});

employeeRouter.put('/:employeeId', isValid, (req, res, next) => {
  const sql = `UPDATE Employee SET name = $name, position = $position, wage = $wage
               WHERE id = $id`;
  const values = {$name: req.body.employee.name,
                  $position: req.body.employee.position,
                  $wage: req.body.employee.wage,
                  $id: req.params.employeeId};
  db.run(sql, values, (error) => {
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`, (error, row) => {
        error ? next(error) : res.status(200).json({employee: row});
      });
    };
  });
});

employeeRouter.delete('/:employeeId', (req, res, next) => {
  const sql = `UPDATE Employee SET is_current_employee = 0
               WHERE id = ${req.params.employeeId}`;
  db.run(sql, (error) => {
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`, (error, row) => {
        error ? next(error) : res.status(200).json({employee: row});
      });
    };
  });
});

module.exports = employeeRouter;
