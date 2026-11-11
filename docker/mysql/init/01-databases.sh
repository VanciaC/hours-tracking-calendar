#!/bin/bash
# Runs once, when the MySQL volume is created.
# One database per microservice, one test database per microservice,
# and one shared application user.
set -e

mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<SQL
-- Application databases
CREATE DATABASE IF NOT EXISTS auth     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS planning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS payroll  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Test databases (used by PHPUnit, wiped by RefreshDatabase)
CREATE DATABASE IF NOT EXISTS auth_testing     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS planning_testing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS payroll_testing  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Application user: access to its own databases only
CREATE USER IF NOT EXISTS 'app'@'%' IDENTIFIED BY '${APP_DB_PASSWORD}';
GRANT ALL PRIVILEGES ON auth.*             TO 'app'@'%';
GRANT ALL PRIVILEGES ON planning.*         TO 'app'@'%';
GRANT ALL PRIVILEGES ON payroll.*          TO 'app'@'%';
GRANT ALL PRIVILEGES ON auth_testing.*     TO 'app'@'%';
GRANT ALL PRIVILEGES ON planning_testing.* TO 'app'@'%';
GRANT ALL PRIVILEGES ON payroll_testing.*  TO 'app'@'%';
FLUSH PRIVILEGES;
SQL