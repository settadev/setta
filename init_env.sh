conda list --name setta_env
exit_code=$?

if [ $exit_code -eq 1 ]; then
    conda create -y -n setta_env python=3.11
fi

. ./activate.sh

pip install -e ".[dev]"