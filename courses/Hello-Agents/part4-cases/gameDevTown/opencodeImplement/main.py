"""
游戏小镇 (Game Dev Town) - 主入口
"""

import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

from backend.llm.minimax import LLMClient
from backend.meeting.orchestrator import MeetingOrchestrator, MeetingType


load_dotenv()


app = Flask(__name__, static_folder='frontend', static_url_path='/static')
CORS(app)


llm_client = None
orchestrator = None

# 模块级别初始化
api_key = os.getenv("MINIMAX_API_KEY", "")
base_url = os.getenv("MINIMAX_BASE_URL", "https://api.minimaxi.com/v1")

if api_key:
    llm_client = LLMClient(
        api_key=api_key,
        base_url=base_url,
        model="MiniMax-M2.5"
    )
    print(f"[App] LLM initialized: {llm_client.is_available()}")
else:
    print("[App] Warning: No API key found, using fallback mode")
    llm_client = LLMClient()

from backend.meeting.orchestrator import MeetingOrchestrator, MeetingType
orchestrator = MeetingOrchestrator(llm_client)
print("[App] Meeting orchestrator initialized")


def init_app():
    """初始化应用"""
    global llm_client, orchestrator
    
    api_key = os.getenv("MINIMAX_API_KEY", "")
    base_url = os.getenv("MINIMAX_BASE_URL", "https://api.minimaxi.com/v1")
    
    if api_key:
        llm_client = LLMClient(
            api_key=api_key,
            base_url=base_url,
            model="MiniMax-M2.5"
        )
        print(f"[App] LLM initialized: {llm_client.is_available()}")
    else:
        print("[App] Warning: No API key found, using fallback mode")
        llm_client = LLMClient()
    
    orchestrator = MeetingOrchestrator(llm_client)
    print("[App] Meeting orchestrator initialized")


@app.route('/')
def index():
    """主页"""
    return send_from_directory('frontend', 'index.html')


@app.route('/favicon.ico')
def favicon():
    """Favicon"""
    from flask import send_from_directory
    import os
    favicon_path = os.path.join('frontend', 'favicon.ico')
    if os.path.exists(favicon_path):
        return send_from_directory('frontend', 'favicon.ico')
    return '', 204


@app.route('/api/status', methods=['GET'])
def get_status():
    """获取系统状态"""
    return jsonify({
        "llm_available": llm_client.is_available() if llm_client else False,
        "meeting_active": orchestrator.current_meeting is not None if orchestrator else False
    })


@app.route('/api/meeting/start', methods=['POST'])
def start_meeting():
    """开始会议"""
    data = request.json
    meeting_type = data.get('meeting_type', 'daily_standup')
    topic = data.get('topic', '讨论议题')
    auto_rounds = data.get('auto_rounds', 3)
    
    try:
        meeting_type_enum = MeetingType(meeting_type)
        meeting_id = orchestrator.start_meeting(meeting_type_enum, topic)
        
        all_responses = []
        
        for round_num in range(auto_rounds):
            result = orchestrator.process_round()
            if result and result.get('responses'):
                for r in result['responses']:
                    all_responses.append({
                        "speaker": r['speaker'],
                        "speaker_role": r['role'],
                        "content": r['content'],
                        "emotion": r.get('emotion', 'neutral')
                    })
            
            if result and result.get('meeting_status') == 'completed':
                break
        
        return jsonify({
            "success": True,
            "meeting_id": meeting_id,
            "meeting": {
                "meeting_type": meeting_type,
                "topic": topic,
                "round": orchestrator.current_meeting.round if orchestrator.current_meeting else auto_rounds
            },
            "responses": all_responses,
            "meeting_status": orchestrator.current_meeting.status if orchestrator.current_meeting else "completed"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })


@app.route('/api/meeting/next', methods=['POST'])
def next_round():
    """进行下一轮对话"""
    try:
        result = orchestrator.process_round()
        
        if result is None:
            return jsonify({
                "success": False,
                "error": "No active meeting"
            })
        
        responses = result.get('responses', [])
        
        return jsonify({
            "success": True,
            "round": result.get('round', 0),
            "responses": [
                {
                    "speaker": r['speaker'],
                    "speaker_role": r['role'],
                    "content": r['content'],
                    "emotion": r.get('emotion', 'neutral')
                }
                for r in responses
            ],
            "meeting_status": result.get('meeting_status', 'in_progress'),
            "meeting": orchestrator.get_meeting_status()
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })


@app.route('/api/meeting/end', methods=['POST'])
def end_meeting():
    """结束会议"""
    try:
        result = orchestrator.end_meeting()
        return jsonify({
            "success": True,
            "summary": result
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })


@app.route('/api/messages', methods=['GET'])
def get_messages():
    """获取消息"""
    limit = request.args.get('limit', 20, type=int)
    messages = orchestrator.get_recent_messages(limit)
    
    return jsonify([
        {
            "id": m['id'],
            "speaker": m['speaker'],
            "speaker_role": m['speaker_role'],
            "content": m['content'],
            "emotion": m.get('emotion'),
            "timestamp": m['timestamp']
        }
        for m in messages
    ])


@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """获取任务"""
    tasks = orchestrator.get_tasks()
    return jsonify(tasks)


@app.route('/api/agents', methods=['GET'])
def get_agents():
    """获取 Agent 信息"""
    agents = orchestrator.get_all_agents_info()
    return jsonify(agents)


if __name__ == '__main__':
    init_app()
    
    port = int(os.getenv('PORT', 5052))
    debug = os.getenv('DEBUG', 'false').lower() == 'true'
    
    print("")
    print("="*50)
    print(" GAME DEV TOWN - Game Dev Team Simulator")
    print("="*50)
    print(f" Address: http://localhost:{port}")
    print(f" Frontend: http://localhost:{port}/")
    print("="*50)
    print("")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
