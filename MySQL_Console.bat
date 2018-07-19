@ECHO OFF
REM Author          David Freer [soulshined@me.com]
REM Build Date      6/19/2018
REM Version         1.0

SET MYSQL_BIN_PATH="c:\Server\bin\mysql\bin"
SET MYSQL_DB=virtualtour
SET MYSQL_USERNAME=dev

cd /D "%MYSQL_BIN_PATH%"
echo Connecting to database: %MYSQL_DB%
echo Logging in as user: %MYSQL_USERNAME%
cmd.exe /k mysql -u %MYSQL_USERNAME% -p %MYSQL_DB%
