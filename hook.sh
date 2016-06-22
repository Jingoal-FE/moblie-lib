#!/bin/sh

# rm .git/hooks/pre-commit.sample
cp -f ./tool/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
