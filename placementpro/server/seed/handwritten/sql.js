const SCHEMA = `
CREATE TABLE departments (dept_id INTEGER PRIMARY KEY, dept_name TEXT NOT NULL);
CREATE TABLE employees (emp_id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT, dept_id INTEGER REFERENCES departments(dept_id), manager_id INTEGER REFERENCES employees(emp_id), salary INTEGER, hire_date TEXT, city TEXT);
CREATE TABLE customers (cust_id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT);
CREATE TABLE orders (order_id INTEGER PRIMARY KEY, cust_id INTEGER REFERENCES customers(cust_id), amount INTEGER, order_date TEXT, status TEXT);`;
const SEED = `
INSERT INTO departments VALUES (1,'Engineering'),(2,'Sales'),(3,'HR'),(4,'Finance');
INSERT INTO employees VALUES
(1,'Asha','asha@corp.com',1,NULL,95000,'2019-03-15','Pune'),
(2,'Bala','bala@corp.com',1,1,72000,'2021-07-01','Chennai'),
(3,'Chitra','chitra@corp.com',1,1,72000,'2022-01-10','Pune'),
(4,'Dinesh','dinesh@corp.com',2,1,55000,'2020-11-20','Mumbai'),
(5,'Esha','esha@corp.com',2,4,48000,'2022-05-05','Pune'),
(6,'Farhan','farhan@corp.com',2,4,61000,'2018-09-09',NULL),
(7,'Gita','gita@corp.com',3,1,45000,'2022-08-30','Delhi'),
(8,'Hari','hari@corp.com',3,7,42000,'2023-02-14','Chennai'),
(9,'Indu','indu@corp.com',1,2,88000,'2020-06-18','Mumbai'),
(10,'Jay','asha@corp.com',1,2,66000,'2023-04-01','Delhi');
INSERT INTO customers VALUES (1,'Acme','Pune'),(2,'Bolt','Mumbai'),(3,'Cleo','Delhi'),(4,'Dyna','Chennai'),(5,'Echo','Pune');
INSERT INTO orders VALUES
(101,1,2500,'2024-01-05','delivered'),(102,1,1800,'2024-02-11','delivered'),(103,2,4000,'2024-02-20','cancelled'),
(104,3,1200,'2024-03-02','delivered'),(105,2,3200,'2024-03-15','delivered'),(106,1,700,'2024-04-01','pending'),
(107,3,5600,'2024-04-12','delivered'),(108,4,900,'2024-05-03','delivered');`;
const E = (topic, difficulty, text, referenceQuery, explanation, orderMatters = true) => ({ topic, difficulty, text, referenceQuery, explanation, orderMatters });
module.exports = { SCHEMA, SEED, exercises: [
  E('select-where', 'easy', 'List the name and salary of all employees who work in Pune, ordered by name.', 'SELECT name, salary FROM employees WHERE city = \'Pune\' ORDER BY name;', 'Filter rows with WHERE, then sort with ORDER BY.'),
  E('order-distinct', 'easy', 'List the distinct, non-NULL cities where employees are based, in alphabetical order.', 'SELECT DISTINCT city FROM employees WHERE city IS NOT NULL ORDER BY city;', 'DISTINCT removes duplicates. NULL must be tested with IS NOT NULL, never "<> NULL".'),
  E('aggregates', 'easy', 'Return the total payroll (sum of salaries) and the average salary rounded to 2 decimals, in one row.', 'SELECT SUM(salary), ROUND(AVG(salary), 2) FROM employees;', 'Aggregate functions collapse all rows into one when there is no GROUP BY.'),
  E('group-by', 'easy', 'For each dept_id, show the number of employees. Order by dept_id.', 'SELECT dept_id, COUNT(*) FROM employees GROUP BY dept_id ORDER BY dept_id;', 'GROUP BY forms one group per dept_id; COUNT(*) counts rows in each.'),
  E('having', 'medium', 'Show department names whose average salary is above 60000, with the average rounded to 2 decimals. Order by department name.', 'SELECT d.dept_name, ROUND(AVG(e.salary), 2) FROM employees e JOIN departments d ON e.dept_id = d.dept_id GROUP BY d.dept_name HAVING AVG(e.salary) > 60000 ORDER BY d.dept_name;', 'Join to get names, group by department, and use HAVING (not WHERE) to filter on an aggregate.'),
  E('inner-join', 'easy', 'List each employee name with their department name, ordered by employee name.', 'SELECT e.name, d.dept_name FROM employees e INNER JOIN departments d ON e.dept_id = d.dept_id ORDER BY e.name;', 'INNER JOIN keeps only rows that match on dept_id.'),
  E('left-join', 'medium', 'List every department with its number of employees, including departments with none. Order by department name.', 'SELECT d.dept_name, COUNT(e.emp_id) FROM departments d LEFT JOIN employees e ON e.dept_id = d.dept_id GROUP BY d.dept_id, d.dept_name ORDER BY d.dept_name;', 'LEFT JOIN keeps departments with no employees. COUNT(e.emp_id) ignores the NULLs, giving 0.'),
  E('self-join', 'medium', 'List each employee with their manager\'s name (NULL if none), ordered by employee name.', 'SELECT e.name, m.name FROM employees e LEFT JOIN employees m ON e.manager_id = m.emp_id ORDER BY e.name;', 'Join the table to itself using manager_id = emp_id; LEFT JOIN retains the top manager.'),
  E('subqueries', 'medium', 'Find the names of employees who earn more than the company average salary, ordered by name.', 'SELECT name FROM employees WHERE salary > (SELECT AVG(salary) FROM employees) ORDER BY name;', 'A scalar subquery computes the average once; compare each salary with it.'),
  E('correlated-subqueries', 'hard', 'Find employees who earn more than the average salary of their own department. Return name, ordered by name.', 'SELECT e.name FROM employees e WHERE e.salary > (SELECT AVG(salary) FROM employees WHERE dept_id = e.dept_id) ORDER BY e.name;', 'The inner query references the outer row (e.dept_id), so it is re-evaluated per employee.'),
  E('case-expressions', 'medium', 'Label each employee\'s salary band: "High" if salary >= 80000, "Mid" if >= 50000, otherwise "Low". Return name and band, ordered by name.', 'SELECT name, CASE WHEN salary >= 80000 THEN \'High\' WHEN salary >= 50000 THEN \'Mid\' ELSE \'Low\' END FROM employees ORDER BY name;', 'CASE evaluates conditions top to bottom and returns the first match.'),
  E('null-handling', 'easy', 'Show each employee name with their city, replacing a missing city with "Unknown". Order by name.', 'SELECT name, COALESCE(city, \'Unknown\') FROM employees ORDER BY name;', 'COALESCE returns its first non-NULL argument.'),
  E('string-date-functions', 'medium', 'List names (in UPPER case) of employees hired in 2022, ordered by name.', 'SELECT UPPER(name) FROM employees WHERE strftime(\'%Y\', hire_date) = \'2022\' ORDER BY name;', 'strftime extracts the year from an ISO date string in SQLite.'),
  E('duplicates', 'medium', 'Find email addresses that appear more than once in employees, with their counts.', 'SELECT email, COUNT(*) FROM employees GROUP BY email HAVING COUNT(*) > 1;', 'Group by the column and keep groups with more than one row.', false),
  E('second-highest-salary', 'medium', 'Find the second-highest distinct salary.', 'SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);', 'The highest salary below the overall maximum is the second highest. Using DISTINCT semantics avoids ties.'),
  E('nth-highest-salary', 'hard', 'Find the 3rd-highest distinct salary.', 'SELECT salary FROM (SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 2);', 'Take distinct salaries in descending order and skip two (OFFSET 2).'),
  E('window-ranking', 'hard', 'For each employee show name, dept_id and their salary rank within the department using RANK (highest salary = 1). Order by dept_id, rank, name.', 'SELECT name, dept_id, RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk FROM employees ORDER BY dept_id, rnk, name;', 'PARTITION BY restarts ranking in each department. RANK gives ties the same rank and skips the next numbers.'),
  E('cte', 'hard', 'Using a CTE of total salary per department, list department ids whose total is greater than the average of those totals. Order by dept_id.', 'WITH t AS (SELECT dept_id, SUM(salary) AS total FROM employees GROUP BY dept_id) SELECT dept_id FROM t WHERE total > (SELECT AVG(total) FROM t) ORDER BY dept_id;', 'The CTE names an intermediate result so it can be reused twice.'),
  E('anti-join', 'medium', 'List the names of customers who have never placed an order, ordered by name.', 'SELECT c.name FROM customers c LEFT JOIN orders o ON o.cust_id = c.cust_id WHERE o.order_id IS NULL ORDER BY c.name;', 'After a LEFT JOIN, customers without orders have NULL order columns.'),
  E('top-n', 'medium', 'Which customer has the highest total of delivered orders? Return the name and total.', 'SELECT c.name, SUM(o.amount) AS total FROM customers c JOIN orders o ON o.cust_id = c.cust_id WHERE o.status = \'delivered\' GROUP BY c.cust_id, c.name ORDER BY total DESC LIMIT 1;', 'Filter to delivered, aggregate per customer, sort descending and keep one row.'),
  E('running-total', 'hard', 'Show order_id, amount and the running total of amount ordered by order_id.', 'SELECT order_id, amount, SUM(amount) OVER (ORDER BY order_id) AS running FROM orders ORDER BY order_id;', 'SUM() OVER (ORDER BY …) accumulates from the first row to the current one.'),
  E('department-top-earner', 'hard', 'For each department that has employees, return the dept_name and the highest salary in it. Order by dept_name.', 'SELECT d.dept_name, MAX(e.salary) FROM departments d JOIN employees e ON e.dept_id = d.dept_id GROUP BY d.dept_id, d.dept_name ORDER BY d.dept_name;', 'Group employees by department and take MAX(salary).'),
] };
