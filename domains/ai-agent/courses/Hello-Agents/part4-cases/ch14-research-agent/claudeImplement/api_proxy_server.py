#!/usr/bin/env python3
"""
HuggingFace API 代理服务器
解决CORS跨域问题
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import sys

app = Flask(__name__)
CORS(app)  # 启用CORS

# HuggingFace API配置
HUGGINGFACE_API_BASE = "https://api-inference.huggingface.co/models"

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({"status": "ok", "service": "HuggingFace API Proxy"})

@app.route('/api/chat/<path:model_id>', methods=['POST'])
def proxy_chat(model_id):
    """
    代理聊天请求到HuggingFace API

    Args:
        model_id: 模型ID，如 Qwen/Qwen2.5-7B-Instruct
    """
    try:
        # 获取请求数据
        data = request.get_json()

        # 获取API Token（从请求头或请求体）
        api_token = request.headers.get('Authorization', '')
        if api_token.startswith('Bearer '):
            api_token = api_token[7:]

        # 如果请求体中有token，使用请求体中的
        if not api_token and 'api_token' in data:
            api_token = data.pop('api_token')

        if not api_token:
            return jsonify({"error": "Missing API token"}), 401

        # 构建HuggingFace API URL
        api_url = f"{HUGGINGFACE_API_BASE}/{model_id}/v1/chat/completions"

        # 准备请求头
        headers = {
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json'
        }

        print(f"🔄 转发请求到: {api_url}", file=sys.stderr)
        print(f"📦 请求体: {data}", file=sys.stderr)

        # 转发请求到HuggingFace API
        response = requests.post(
            api_url,
            json=data,
            headers=headers,
            timeout=60,
            proxies={
                'http': 'http://192.168.2.1:7890',
                'https': 'http://192.168.2.1:7890'
            }
        )

        print(f"✅ 响应状态: {response.status_code}", file=sys.stderr)

        # 返回响应
        return jsonify(response.json()), response.status_code

    except requests.exceptions.Timeout:
        print("❌ 请求超时", file=sys.stderr)
        return jsonify({"error": "Request timeout"}), 504
    except requests.exceptions.RequestException as e:
        print(f"❌ 请求错误: {str(e)}", file=sys.stderr)
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"❌ 服务器错误: {str(e)}", file=sys.stderr)
        return jsonify({"error": str(e)}), 500

@app.route('/api/models/<path:model_id>', methods=['GET'])
def proxy_models(model_id):
    """代理模型信息请求"""
    try:
        api_token = request.headers.get('Authorization', '')
        if api_token.startswith('Bearer '):
            api_token = api_token[7:]

        if not api_token:
            return jsonify({"error": "Missing API token"}), 401

        api_url = f"{HUGGINGFACE_API_BASE}/{model_id}"

        headers = {
            'Authorization': f'Bearer {api_token}',
        }

        response = requests.get(
            api_url,
            headers=headers,
            timeout=30,
            proxies={
                'http': 'http://192.168.2.1:7890',
                'https': 'http://192.168.2.1:7890'
            }
        )

        return jsonify(response.json()), response.status_code

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    import io
    import os
    # 设置UTF-8编码
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    os.environ['PYTHONIOENCODING'] = 'utf-8'

    print("Starting HuggingFace API Proxy Server...")
    print("Address: http://localhost:5000")
    print("Proxy: http://192.168.2.1:7890")
    print("")
    app.run(host='0.0.0.0', port=5000, debug=True)
