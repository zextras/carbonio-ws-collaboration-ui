# These are the commands used to add licenses to all files
# WARNING: it seems that the addheader command is not fully capable of replacing existing license headers
#  so be careful when running these commands.

reuse addheader --copyright="Zextras <https://www.zextras.com>" --license="AGPL-3.0-only" -s 'css' ../src/*.jsx

reuse addheader --copyright="Zextras <https://www.zextras.com>" --license="AGPL-3.0-only" ../*.js

reuse addheader --copyright="Zextras <https://www.zextras.com>" --license="AGPL-3.0-only" -s 'css' ../src/*.js

reuse addheader --copyright="Zextras <https://www.zextras.com>" --license="AGPL-3.0-only" -s 'css' ../src/**/*.js

reuse addheader --copyright="Zextras <https://www.zextras.com>" --license="AGPL-3.0-only" -s 'css' ../src/**/**/*.js

reuse addheader --copyright="Zextras <https://www.zextras.com>" --license="AGPL-3.0-only" -s 'css' ../src/**/**/**/*.js

reuse addheader --copyright="Zextras <https://www.zextras.com>" --license="AGPL-3.0-only" -s 'css' ../src/**/**/**/**/*.js

reuse addheader --copyright="Zextras <https://www.zextras.com>" --license="AGPL-3.0-only" -s 'css' ../src/**/**/**/**/**/*.js

reuse addheader --copyright="Zextras <https://www.zextras.com>" --license="AGPL-3.0-only" ../src/**/**/*.html

#reuse addheader --copyright="Zextras <https://www.zextras.com>" --license="AGPL-3.0-only" ../.eslintrc.js

reuse addheader --copyright="Zextras <https://www.zextras.com>" --license="AGPL-3.0-only" ../CHANGELOG.md

reuse addheader --copyright="Zextras <https://www.zextras.com>" --license="CC0-1.0" ../.gitignore ../.gitmodules

reuse addheader --copyright="Zextras <https://www.zextras.com>" --license="AGPL-3.0-only" ../Jenkinsfile
