#!/bin/bash
find /home/ubuntu/pluto-t6-server -type d -exec chmod 755 {} \;
find /home/ubuntu/pluto-t6-server -type f -exec chmod 644 {} \;
find /home/ubuntu/pluto-t6-server -type f -name "*.sh" -exec chmod 755 {} \;
find /home/ubuntu/pluto-t6-server -type f -name "*.bat" -exec chmod 755 {} \;
