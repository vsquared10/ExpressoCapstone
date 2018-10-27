const express = require('express');
const timesheetRouter = express.Router({mergeParams: true});
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const isValid = (req, res, next) => {
  const ts = req.body.timesheet;
  const hours = ts.hours;
  const rate = ts.rate;
  const date = ts.date;
  const empId = req.params.employeeId;
  db.get(`SELECT * FROM Employee WHERE id = ${empId}`, (error, row) => {
    if(error) {
      next(error)
    } else if(!hours || !rate || !date) {
        res.sendStatus(400);
    };
  });
  next();
};

timesheetRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const sql = `SELECT * FROM Timesheet WHERE id = ${timesheetId}`;
  db.get(sql, (error, row) => {
    if(error) {
      next(error);
    } else if(row) {
      next();
    } else {
      res.sendStatus(404);
    };
  });
});

timesheetRouter.get('/', (req, res, next) => {
  const sql = `SELECT * FROM Timesheet WHERE employee_id = ${req.params.employeeId}`;
  db.all(sql, (error, rows) => {
    error ? next(error) : res.status(200).json({timesheets: rows});
  });
});

timesheetRouter.post('/', isValid, (req, res, next) => {
  const ts = req.body.timesheet;
  const sql = `INSERT INTO Timesheet (hours, rate, date, employee_id)
               VALUES ($hours, $rate, $date, $employeeId)`;
  const values = {
                  $hours: ts.hours,
                  $rate: ts.rate,
                  $date: ts.date,
                  $employeeId: req.params.employeeId
                 };
  db.run(sql, values, function(error) {
    if(error) {
      next(error);
    } else {
      const query = `SELECT * FROM Timesheet WHERE id = ${this.lastID}`;
      db.get(query, (error, row) => {
        error ? next(error) : res.status(201).json({timesheet: row});
      });
    };
  });
});

timesheetRouter.put('/:timesheetId', isValid, (req, res, next) => {
  const sql = `UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date
               WHERE id = $id`;
  const values = {
                  $hours: req.body.timesheet.hours,
                  $rate: req.body.timesheet.rate,
                  $date: req.body.timesheet.date,
                  $id: req.params.timesheetId
                };
  db.run(sql, values, function(error) {
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Timesheet WHERE id = ${req.params.timesheetId}`, (error, row) => {
        error ? next(error) : res.status(200).json({timesheet: row});
      });
    };
  });
});

timesheetRouter.delete('/:timesheetId', (req, res, next) => {
  const sql = `DELETE FROM Timesheet WHERE id = ${req.params.timesheetId}`;
  db.run(sql, (error) => {
    error ? next(error) : res.sendStatus(204);
  });
});

module.exports = timesheetRouter;
