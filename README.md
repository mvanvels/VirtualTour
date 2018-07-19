# Overview

Global files, files are specifically designed for repeated imports/links, respective of it's targeted extension, are listed as top level files/folders. (i.e., javascript classes, bootstrap css, logos etc)

Otherwise, files that are specific to their environment will be maintained in their respective environment folders

### PHP Server Settings I have changed on my localserver:
- max_execution_time = 300
- memory_limit = 1024M
- error_reporting = E_ALL
- display_errors = On
- display_startup_errors = On
- log_errors = On
- post_max_size = 750M #this was higher for full HD videos, but then we decided on youtube videos so this is arbitrary now and should only be altered keeping in mind points of interest images
- upload_max_filesize = 750M #same as above
file_uploads = On
max_file_uploads = 10
- modules are subjective, but at minimum have mysqli
-mysqli.reconnect = Off

(See config.ini) for run-time configs

# SQL

It's recommended to disable foreign key checks when importing the SQL database via virtualtour_import.sql
