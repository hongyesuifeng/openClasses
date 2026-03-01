from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from backend.agents.search_engine import SearchEngine

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__, static_folder=os.path.join(BASE_DIR, 'frontend'))
CORS(app)

search_engine = SearchEngine()

@app.route('/')
def index():
    return send_from_directory(os.path.join(BASE_DIR, 'frontend'), 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(os.path.join(BASE_DIR, 'frontend'), path)

@app.route('/api/search', methods=['POST'])
def search():
    data = request.json
    topic = data.get('topic', '')
    
    if not topic:
        return jsonify({'error': '请提供研究主题'}), 400
    
    try:
        from backend.agents.query_generator import QueryGenerator
        query_gen = QueryGenerator()
        query = query_gen.generate(topic)
        
        results = search_engine.search(query, max_results=20)
        
        return jsonify({
            'results': [
                {
                    'title': r.title,
                    'url': r.url,
                    'snippet': r.snippet,
                    'source': r.source,
                    'published_date': r.published_date,
                    'score': r.score
                }
                for r in results
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({'available': True})

@app.route('/api/llm/generate', methods=['POST'])
def llm_generate():
    data = request.json
    prompt = data.get('prompt', '')
    system = data.get('system', '你是一个专业的研究助手。请用详细的中文回答问题。')
    model = data.get('model', 'qwen2.5:0.5b')
    
    if not prompt:
        return jsonify({'error': '请提供prompt'}), 400
    
    try:
        from backend.tools.llm_tool import LLMTool
        llm = LLMTool(model=model)
        result = llm.generate(prompt, system)
        return jsonify({'response': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/llm/chat', methods=['POST'])
def llm_chat():
    data = request.json
    messages = data.get('messages', [])
    model = data.get('model', 'qwen2.5:0.5b')
    
    try:
        from backend.tools.llm_tool import LLMTool
        llm = LLMTool(model=model)
        result = llm.chat(messages)
        return jsonify({'response': result, 'message': {'role': 'assistant', 'content': result}})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/llm/status', methods=['GET'])
def llm_status():
    try:
        from backend.tools.llm_tool import LLMTool
        llm = LLMTool()
        available = llm.is_available()
        return jsonify({'available': available, 'model': llm.model})
    except Exception as e:
        return jsonify({'available': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
