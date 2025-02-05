. ./init_env.sh && \
./build.sh && \
python -m twine upload dist/*
./cleanup.sh