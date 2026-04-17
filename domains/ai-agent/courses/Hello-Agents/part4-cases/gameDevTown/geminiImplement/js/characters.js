class Characters {
    constructor() {
        this.characterElements = {
            alex: document.getElementById('character-alex'),
            cody: document.getElementById('character-cody'),
            diana: document.getElementById('character-diana'),
            arty: document.getElementById('character-arty')
        };
        this.statusBubbles = {
            alex: document.getElementById('status-alex'),
            cody: document.getElementById('status-cody'),
            diana: document.getElementById('status-diana'),
            arty: document.getElementById('status-arty')
        };

        this.allCharacters = Object.keys(this.characterElements);
        
        this.characterData = {
            alex: { name: 'Alex', role: 'Producer', avatar: '🎬', description: '作为制作人，Alex负责项目管理、资源协调和确保开发进度。他总能看到大局，并在关键时刻做出决策。' },
            cody: { name: 'Cody', role: 'Developer', avatar: '💻', description: 'Cody是团队的技术核心，擅长解决复杂的编程问题。他对代码质量有严格要求，并总是探索新的技术方案。' },
            diana: { name: 'Diana', role: 'Designer', avatar: '📝', description: 'Diana是游戏的创意大脑，负责玩法设计和用户体验。她充满了奇思妙想，致力于创造有趣和难忘的游戏时刻。' },
            arty: { name: 'Arty', role: 'Artist', avatar: '🎨', description: 'Arty用他的画笔为游戏世界注入生命。他负责所有视觉元素，从角色设计到场景和UI，追求独特的艺术风格。' }
        };

        this.modal = document.getElementById('character-modal');
        this.modalAvatar = document.getElementById('modal-avatar');
        this.modalName = document.getElementById('modal-name');
        this.modalRole = document.getElementById('modal-role');
        this.modalDescription = document.getElementById('modal-description');
        this.modalCloseBtn = this.modal.querySelector('.modal-close-btn');

        this.initModal();
        this.updateHint();
    }
    
    updateHint() {
        const hintElement = document.querySelector('.office-scene .hint');
        if(hintElement) {
            hintElement.textContent = '💬 点击角色查看详情';
        }
    }

    initModal() {
        this.allCharacters.forEach(id => {
            this.characterElements[id].addEventListener('click', () => {
                this.showModal(this.characterData[id]);
            });
            // Make characters clickable
            this.characterElements[id].style.cursor = 'pointer';
        });

        this.modalCloseBtn.addEventListener('click', () => this.hideModal());
        this.modal.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.hideModal();
            }
        });
    }

    showModal(data) {
        this.modalAvatar.textContent = data.avatar;
        this.modalName.textContent = data.name;
        this.modalRole.textContent = data.role;
        this.modalDescription.textContent = data.description;
        this.modal.style.display = 'flex';
    }

    hideModal() {
        this.modal.style.display = 'none';
    }

    // speakerId should be 'alex', 'cody', etc.
    setSpeaking(speakerId) {
        this.allCharacters.forEach(id => {
            if (id === speakerId) {
                this.characterElements[id].classList.add('speaking');
            } else {
                this.characterElements[id].classList.remove('speaking');
            }
        });
    }

    // thinkerIds should be an array ['alex', 'cody']
    setThinking(thinkerIds) {
        this.allCharacters.forEach(id => {
            const element = this.characterElements[id];
            const bubble = this.statusBubbles[id];
            
            if (thinkerIds.includes(id)) {
                element.classList.add('thinking');
                bubble.textContent = '💭';
            } else {
                element.classList.remove('thinking');
            }
        });
    }
}

