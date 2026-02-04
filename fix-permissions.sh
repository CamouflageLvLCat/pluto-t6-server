#!/bin/bash
find /home/ubuntu/t6server-public -type d -exec chmod 755 {} \;
find /home/ubuntu/t6server-public -type f -exec chmod 644 {} \;
find /home/ubuntu/t6server-public -type f -name "*.sh" -exec chmod 755 {} \;
find /home/ubuntu/t6server-public -type f -name "*.bat" -exec chmod 755 {} \;
