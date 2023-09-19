const inquirer = require('inquirer');
const mysql = require('mysql2');

// create the database connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'company_db'
});

// connect to the database
connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to the database.');
  // start the application
  start();
});

// function to start the application
function start() {
  inquirer.prompt({
    name: 'action',
    type: 'list',
    message: 'What would you like to do?',
    choices: [
      'View all departments',
      'View all roles',
      'View all employees',
      'Add a department',
      'Add a role',
      'Add an employee',
      'Update an employee role',
      'Exit'
    ]
  }).then((answer) => {
    switch (answer.action) {
      case 'View all departments':
        viewDepartments();
        break;
      case 'View all roles':
        viewRoles();
        break;
      case 'View all employees':
        viewEmployees();
        break;
      case 'Add a department':
        addDepartment();
        break;
      case 'Add a role':
        addRole();
        break;
      case 'Add an employee':
        addEmployee();
        break;
      case 'Update an employee role':
        updateEmployeeRole();
        break;
      case 'Exit':
        connection.end();
        break;
    }
  });
}

// function to view all departments
function viewDepartments() {
  connection.query('SELECT * FROM departments', (err, res) => {
    if (err) throw err;
    console.table(res);
    start();
  });
}

// function to view all roles
function viewRoles() {
  connection.query('SELECT roles.id, roles.title, departments.name AS department, roles.salary FROM roles LEFT JOIN departments ON roles.department_id = departments.id', (err, res) => {
    if (err) throw err;
    console.table(res);
    start();
  });
}

// function to view all employees
function viewEmployees() {
  connection.query('SELECT employees.id, employees.first_name, employees.last_name, roles.title, departments.name AS department, roles.salary, CONCAT(managers.first_name, " ", managers.last_name) AS manager FROM employees LEFT JOIN roles ON employees.role_id = roles.id LEFT JOIN departments ON roles.department_id = departments.id LEFT JOIN employees managers ON employees.manager_id = managers.id', (err, res) => {
    if (err) throw err;
    console.table(res);
    start();
  });
}

// function to add a department
function addDepartment() {
  inquirer.prompt({
    name: 'name',
    type: 'input',
    message: 'Enter the name of the department:'
  }).then((answer) => {
    connection.query('INSERT INTO departments SET ?', { name: answer.name }, (err, res) => {
      if (err) throw err;
      console.log(`${res.affectedRows} department added.`);
      start();
    });
  });
}

// function to add a role
function addRole() {
  connection.query('SELECT * FROM departments', (err, departments) => {
    if (err) throw err;
    inquirer.prompt([
      {
        name: 'title',
        type: 'input',
        message: 'Enter the title of the role:'
      },
      {
        name: 'salary',
        type: 'input',
        message: 'Enter the salary for the role:'
      },
      {
        name: 'department',
        type: 'list',
        message: 'Select the department for the role:',
        choices: departments.map((department) => department.name)
      }
    ]).then((answers) => {
      const department = departments.find((department) => department.name === answers.department);
      connection.query('INSERT INTO roles SET ?', { title: answers.title, salary: answers.salary, department_id: department.id }, (err, res) => {
        if (err) throw err;
        console.log(`${res.affectedRows} role added.`);
        start();
      });
    });
  });
}

// function to add an employee
function addEmployee() {
  connection.query('SELECT * FROM roles', (err, roles) => {
    if (err) throw err;
    connection.query('SELECT * FROM employees', (err, employees) => {
      if (err) throw err;
      inquirer.prompt([
        {
          name: 'first_name',
          type: 'input',
          message: 'Enter the employee\'s first name:'
        },
        {
          name: 'last_name',
          type: 'input',
          message: 'Enter the employee\'s last name:'
        },
        {
          name: 'role',
          type: 'list',
          message: 'Select the employee\'s role:',
          choices: roles.map((role) => role.title)
        },
        {
          name: 'manager',
          type: 'list',
          message: 'Select the employee\'s manager:',
          choices: employees.map((employee) => `${employee.first_name} ${employee.last_name}`)
        }
      ]).then((answers) => {
        const role = roles.find((role) => role.title === answers.role);
        const manager = employees.find((employee) => `${employee.first_name} ${employee.last_name}` === answers.manager);
        connection.query('INSERT INTO employees SET ?', { first_name: answers.first_name, last_name: answers.last_name, role_id: role.id, manager_id: manager.id }, (err, res) => {
          if (err) throw err;
          console.log(`${res.affectedRows} employee added.`);
          start();
        });
      });
    });
  });
}

// function to update an employee role
function updateEmployeeRole() {
  connection.query('SELECT * FROM employees', (err, employees) => {
    if (err) throw err;
    connection.query('SELECT * FROM roles', (err, roles) => {
      if (err) throw err;
      inquirer.prompt([
        {
          name: 'employee',
          type: 'list',
          message: 'Select the employee to update:',
          choices: employees.map((employee) => `${employee.first_name} ${employee.last_name}`)
        },
        {
          name: 'role',
          type: 'list',
          message: 'Select the employee\'s new role:',
          choices: roles.map((role) => role.title)
        }
      ]).then((answers) => {
        const employee = employees.find((employee) => `${employee.first_name} ${employee.last_name}` === answers.employee);
        const role = roles.find((role) => role.title === answers.role);
        connection.query('UPDATE employees SET ? WHERE ?', [{ role_id: role.id }, { id: employee.id }], (err, res) => {
          if (err) throw err;
          console.log(`${res.affectedRows} employee updated.`);
          start();
        });
      });
    });
  });
}