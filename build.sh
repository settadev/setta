./cleanup.sh && \
cd frontend && pnpm build && cd .. && \
mkdir backend/setta/static && \
cp -r frontend/dist backend/setta/static/frontend && \
cp -r seed backend/setta/static/seed && \
cp -r constants backend/setta/static/constants && \
python -m build