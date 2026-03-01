class Game {
    constructor() {
        this.state = {
            phase: '设计', // 设计, 开发, 测试, 上线
            week: 1,
            budget: 100000,
            morale: 80, // 团队士气
            progress: 0, // 项目总进度
            features: [
                { id: 'combat', name: '战斗系统', progress: 10, quality: 5, status: '进行中' },
                { id: 'art', name: '美术风格', progress: 20, quality: 8, status: '进行中' },
            ],
            availableMeetings: ['designReview', 'brainstorm'],
            completedMeetings: [],
        };

        this.meetings = {
            designReview: {
                title: '设计评审',
                topic: '战斗系统设计',
                type: 'dialogue',
                dialogue: [
                    { speaker: 'Alex', avatar: '🎬', text: '好的，我们开始今天的设计评审。Diana，请介绍一下你的战斗系统设计方案。', thinking: ['Diana'] },
                    { speaker: 'Diana', avatar: '📝', text: '谢谢Alex！我设计了一个新的元素共鸣系统——当玩家连续使用不同元素时，会触发组合效果。比如冰+火会产生蒸汽爆炸 🔥+❄️=💨', thinking: ['Cody', 'Arty'] },
                    { speaker: 'Cody', avatar: '💻', text: '从技术角度来看，这个系统的实现需要大约两周。不过元素组合技的物理计算可能会影响性能，我建议先做一个简化版原型。', thinking: ['Alex', 'Diana'] },
                    { speaker: 'Arty', avatar: '🎨', text: '视觉表现上，元素组合特效可以做得非常酷炫！蒸汽爆炸可以用粒子系统实现，我已经有个想法了...', thinking: ['Diana'] },
                    { speaker: 'Diana', avatar: '📝', text: 'Cody提到的性能问题很重要。我们可以先用动画驱动来模拟，而不是完全的物理计算，这样可以保证流畅度。', thinking: ['Cody'] },
                    { speaker: 'Alex', avatar: '🎬', text: '很好的讨论。Cody，简化版原型的方案听起来是当前最稳妥的。我们就这么决定：第一版原型采用动画驱动，目标两周内完成。大家有意见吗？', thinking: [] },
                    { speaker: 'Cody', avatar: '💻', text: '没问题，我来负责技术实现。', thinking: [] },
                    { speaker: 'Diana', avatar: '📝', text: '同意，我来细化设计文档和数值。', thinking: [] },
                    { speaker: 'Arty', avatar: '🎨', text: '我开始准备特效的概念图！', thinking: [] },
                    { speaker: 'Alex', avatar: '🎬', text: '很好，团队达成共识！今天的会议非常高效，大家辛苦了。', thinking: [] },
                ],
                onComplete: (gameState) => {
                    const combatFeature = gameState.features.find(f => f.id === 'combat');
                    if (combatFeature) {
                        combatFeature.progress += 15;
                        combatFeature.quality += 5;
                    }
                    gameState.progress += 5;
                    gameState.week += 1;
                    return '战斗系统原型方案已确定，项目进度推进！';
                }
            },
            brainstorm: {
                title: '创意头脑风暴',
                topic: '新玩法拓展',
                type: 'decision',
                prompt: 'Alex: 为了让游戏更有趣，我们来想想还能加点什么新玩法？',
                choices: [
                    { 
                        text: '加入一个宠物系统', 
                        onChoose: (gameState) => { 
                            gameState.features.push({ id: 'pet', name: '宠物系统', progress: 0, quality: 0, status: '待办' });
                            gameState.morale += 5;
                            return "团队讨论是否应该开发一个新的宠物系统来吸引玩家。";
                        }
                    },
                    { 
                        text: '开发一个家园建造模式', 
                        onChoose: (gameState) => {
                            gameState.features.push({ id: 'housing', name: '家园系统', progress: 0, quality: 0, status: '待办' });
                            gameState.morale += 5;
                            return "团队讨论开发一个家园建造模式，让玩家可以打造自己的专属空间，这能极大地增加游戏时长。";
                        }
                    },
                    { 
                        text: '我们应该先专注核心玩法', 
                        onChoose: (gameState) => {
                            gameState.morale -= 5;
                            const combatFeature = gameState.features.find(f => f.id === 'combat');
                            if (combatFeature) combatFeature.quality += 5;
                            return "团队讨论是否应该先专注核心玩法，确保核心体验完美无瑕。";
                        }
                    },
                ],
                onComplete: (gameState) => {
                    gameState.week += 1;
                    return '头脑风暴结束，团队有了新的想法。';
                }
            }
        };
    }

    getMeeting(id) {
        return this.meetings[id];
    }

    getState() {
        return this.state;
    }
}

class App {
    constructor(game, chat, characters, dashboard) {
        this.game = game;
        this.chat = chat;
        this.characters = characters;
        this.dashboard = dashboard;

        this.chatControls = document.querySelector('.chat-controls');
        this.dialogueContainer = document.querySelector('.dialogue-section');
    }

    init() {
        this.updateDashboard();
        this.presentChoices();
    }

    updateDashboard() {
        const state = this.game.getState();
        const liveIndicator = document.querySelector('.live-indicator');
        liveIndicator.innerHTML = `<span class="live-dot"></span> W${state.week} ● ${state.phase} Phase`;
        
        const meetingTitle = document.getElementById('meeting-title');
        meetingTitle.textContent = "待机";
         this.dashboard.updateTasks(
            state.features.filter(f => f.status === '待办').length,
            state.features.filter(f => f.status === '进行中').length,
            state.features.filter(f => f.status === '已完成').length
        );
    }

    presentChoices() {
        this.chat.clear();
        this.chat.showSystemMessage('新的一周开始了！请选择要进行的活动：');
        this.chatControls.innerHTML = ''; 

        const state = this.game.getState();
        state.availableMeetings.forEach(meetingId => {
            const meeting = this.game.getMeeting(meetingId);
            const button = document.createElement('button');
            button.textContent = `开会: ${meeting.title}`;
            button.onclick = () => this.startMeeting(meetingId);
            this.chatControls.appendChild(button);
        });

        const workButton = document.createElement('button');
        workButton.textContent = '本周开发';
        workButton.onclick = () => this.doDevelopment();
        this.chatControls.appendChild(workButton);
    }
    
    startMeeting(meetingId) {
        const meeting = this.game.getMeeting(meetingId);
        if (!meeting) return;

        this.chat.clear();
        this.chatControls.innerHTML = '';
        this.dashboard.updateMeetingInfo(meeting.title, meeting.topic);

        if (meeting.type === 'dialogue') {
            this.runDialogueMeeting(meeting);
        } else if (meeting.type === 'decision') {
            this.runDecisionMeeting(meeting);
        }
    }

    async runDialogue(dialogue, onComplete) {
        for (let i = 0; i < dialogue.length; i++) {
            const turn = dialogue[i];
            this.characters.setSpeaking(turn.speaker.toLowerCase());
            
            const thinking = turn.thinking || [];
            this.characters.setThinking(thinking.map(name => name.toLowerCase()));

            await this.chat.streamMessage(turn.speaker, turn.avatar, turn.text);
            
            if (onComplete) {
                const progress = ((i + 1) / dialogue.length) * 100;
                this.dashboard.updateMeetingProgress(progress);
            }
            await this.delay(1000);
        }
        
        this.characters.setSpeaking(null);
        this.characters.setThinking([]);
    }

    async runDialogueMeeting(meeting) {
        this.chat.showSystemMessage(`${meeting.title} 开始...`);
        await this.runDialogue(meeting.dialogue, true);
        this.completeMeeting(meeting);
    }

    runDecisionMeeting(meeting) {
        this.chat.showSystemMessage(meeting.prompt);
        
        meeting.choices.forEach(choice => {
            const button = document.createElement('button');
            button.textContent = choice.text;
            button.onclick = async () => {
                this.chatControls.innerHTML = ''; 
                const state = this.game.getState();
                const promptForAI = choice.onChoose(state);
                
                this.chat.showSystemMessage("团队正在激烈讨论中...");
                const followUpDialogue = await getMiniMaxDialogue(promptForAI);
                
                await this.runDialogue(followUpDialogue);
                this.completeMeeting(meeting);
            };
            this.chatControls.appendChild(button);
        });
    }

    completeMeeting(meeting) {
        const state = this.game.getState();
        const outcomeMessage = meeting.onComplete(state);
        this.chat.showSystemMessage(outcomeMessage);

        const meetingId = state.availableMeetings.shift();
        if(meetingId) {
            state.completedMeetings.push(meetingId);
        }

        this.dashboard.updateMeetingProgress(0);
        this.endTurn();
    }
    
    async doDevelopment() {
        this.chat.clear();
        this.chatControls.innerHTML = '';
        this.chat.showSystemMessage('团队正在努力开发中...');
        await this.delay(1000);

        const state = this.game.getState();
        state.week += 1;
        state.progress += Math.floor(Math.random() * 5) + 3;
        state.budget -= 5000;
        state.features.forEach(f => {
            if (f.status === '进行中') {
                f.progress = Math.min(100, f.progress + (Math.floor(Math.random() * 10) + 5));
                if(f.progress === 100) {
                    f.status = '已完成';
                }
            }
        });
        
        const inProgressFeatures = state.features.filter(f => f.status === '进行中').map(f => f.name).join(', ');
        const prompt = `生成一段关于本周开发进展的团队对话。当前正在开发的功能是: ${inProgressFeatures || '修复bug和代码优化'}。团队当前士气值为: ${state.morale}。`;
        const devDialogue = await getMiniMaxDialogue(prompt);

        await this.runDialogue(devDialogue);
        
        this.endTurn();
    }
    
    endTurn() {
        this.updateDashboard();
        setTimeout(() => {
            if (this.game.getState().availableMeetings.length > 0) {
                 this.presentChoices();
            } else {
                this.chat.clear();
                this.chat.showSystemMessage("所有会议已完成！现在只能进行开发。");
                this.chatControls.innerHTML = '';
                const workButton = document.createElement('button');
                workButton.textContent = '继续开发';
                workButton.onclick = () => this.doDevelopment();
                this.chatControls.appendChild(workButton);
            }
        }, 3000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main application entry point
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    const chat = new Chat();
    const characters = new Characters();
    const dashboard = new Dashboard();

    const app = new App(game, chat, characters, dashboard);
    app.init();
});
