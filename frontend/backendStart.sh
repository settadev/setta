#!/bin/bash
cd ..
. ./activate.sh
# SETTA_DEV_MODE="true" setta --with-examples "$@" # pass in other command line args
SETTA_DEV_MODE="true" setta --with-examples "$@" --log-level info
