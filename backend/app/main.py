from fastapi import FastAPI

app = FastAPI(title="Niyati Python Fullstack Template")


@app.get('/health')
def health():
    return {'ok': True, 'service': 'api', 'stack': 'python'}


@app.get('/api/version')
def version():
    return {'version': 'starter-v1', 'runtime': 'python', 'deploy_target': 'render'}


@app.get('/api/ping')
def ping():
    return {'ok': True, 'message': 'pong'}
