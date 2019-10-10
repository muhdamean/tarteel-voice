#!/bin/bash

# Author: Fahim Dalvi
# Last Change: October 8, 2019
# Description: Script to take frontend logs and convert them into json for easy snapshot creation

# Input argument: path to text file with frontend log
# Output: JSON style partial+final recognition list

cat $1 | grep "Speech Result" | cut -d':' -f4,5 | awk -F'[,:]' '{gsub(/^[ \t]+/, "", $1); gsub(/[ \t]+$/, "", $1); gsub(/^[ \t]+/, "", $2); gsub(/[ \t]+$/, "", $2); print "{ \"transcript\": \""$1"\", \""$2"\":"$3" },"}'