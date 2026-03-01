import os

class Config:
    OLLAMA_BASE_URL = os.environ.get('OLLAMA_BASE_URL', 'http://localhost:11434')
    OLLAMA_MODEL = os.environ.get('OLLAMA_MODEL', 'llama2')
    SEARCH_MAX_RESULTS = int(os.environ.get('SEARCH_MAX_RESULTS', '50'))
    FLASK_HOST = os.environ.get('FLASK_HOST', '0.0.0.0')
    FLASK_PORT = int(os.environ.get('FLASK_PORT', '5000'))
    DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'
