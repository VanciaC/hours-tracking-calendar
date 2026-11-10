#!/bin/bash
# Exécuté une seule fois, à la création du volume MySQL.
# Une base par micro-service, un utilisateur applicatif commun.
set -e

mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<SQL
CREATE DATABASE IF NOT EXISTS auth     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS planning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS payroll  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'app'@'%' IDENTIFIED BY '${APP_DB_PASSWORD}';
GRANT ALL PRIVILEGES ON auth.*     TO 'app'@'%';
GRANT ALL PRIVILEGES ON planning.* TO 'app'@'%';
GRANT ALL PRIVILEGES ON payroll.*  TO 'app'@'%';
FLUSH PRIVILEGES;
SQL
