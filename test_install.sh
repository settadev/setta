. ./init_env.sh && \
./build.sh && \
filepath=$(find dist -type f -name "*.tar.gz") && \
pip install --force-reinstall $filepath && \
./cleanup.sh