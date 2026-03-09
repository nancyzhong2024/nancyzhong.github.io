/**
 * 智能问答助手2组件
 * @class ChatWidget2
 * @param {Object} options - 组件配置选项
 * @param {string} [options.apiBase='http://39.99.179.142:8006'] - API基础URL
 * @param {string} [options.userId] - 用户ID，不提供则自动生成
 * @param {string} [options.containerId] - 容器ID，组件将渲染到该容器中
 */
class ChatWidget2 {
    /**
     * 创建ChatWidget2实例
     * @param {Object} options - 配置选项
     */
    constructor(options) {
        this.apiBase = options.apiBase || 'http://39.99.179.142:8006';
        this.userId = options.userId || 'user_' + Math.random().toString(36).substr(2, 9);
        this.containerId = options.containerId;
        this.currentMode = 'basic'; // 'basic' 或 'advanced'
        this.currentTab = 'tab1'; // 当前激活的tab
        this.container = null;
        this.isInitialized = false;
        
        // 高级模式相关变量
        this.isDeepThinkEnabled = true; // 深度思考模式作为默认模式
        this.currentSessionId = null;
        this.uploadedFiles = []; // 存储已上传的文件信息
        this.toolStatus = {}; // 存储工具开启状态
        this.exampleQuestions = {}; // 存储示例问题配置
    }

    /**
     * 初始化聊天组件
     * @param {string} [containerId] - 可选的容器ID，覆盖构造函数中的设置
     * @returns {Promise<void>} - 初始化完成的Promise
     */
    async init(containerId) {
        if (containerId) {
            this.containerId = containerId;
        }

        if (!this.containerId) {
            throw new Error('Container ID is required for initialization');
        }

        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            throw new Error(`Container with ID "${this.containerId}" not found`);
        }

        // 渲染UI
        this.renderUI();
        // 绑定事件
        this.bindEvents();
        // 初始化默认模式
        this.switchMode('basic');

        // 获取工具开启状态并隐藏未开启的tab
        await this.fetchToolStatus();
        this.updateTabVisibility();

        // 选择第一个可见的tab作为默认选择项
        this.selectFirstVisibleTab();

        // 获取示例问题配置并更新显示
        await this.fetchExampleQuestions();
        this.updateExampleQuestions();

        this.isInitialized = true;
    }

    /**
     * 渲染聊天组件UI
     */
    renderUI() {
        this.container.innerHTML = `
            <div class="chat-widget-2">
                <!-- 模式切换 -->
                <div class="mode-switch-container">
                    <div class="mode-switch">
                        <button class="mode-btn active" data-mode="basic">基础模式</button>
                        <button class="mode-btn" data-mode="advanced">高级模式</button>
                    </div>
                </div>
                
                <!-- 基础模式 -->
                <div class="basic-mode-container active">
                    <!-- Tab切换 -->
                    <div class="tab-container">
                        <button class="tab-btn" data-tab="tab5" title="通过语义向量匹配常见知识问答对，快速获取常见问题的解答">常见问答(FAQ)</button>
                        <button class="tab-btn active" data-tab="tab2" title="基于文本语义向量相似度匹配的RAG检索生成">信息咨询(RAG)</button>
                        <button class="tab-btn" data-tab="tab1" title="将自然语言转为SQL语句，从结构化数据库表中精准查询">数据查询(SQL)</button>
                        <button class="tab-btn" data-tab="tab3" title="将自然语言转为Cypher语句，从图谱数据库中精准查询">图谱查询(Cypher)</button>
                        <button class="tab-btn" data-tab="tab4" title="通过意图识别确定检索策略(FAQ/RAG/SQL/Cypher)，然后由大模型推理生成答案">智能解答(Intent)</button>
                    </div>
                    
                    <!-- Tab内容 -->
                    <div class="tab-content active" id="tab2">
                        <div class="quick-questions">
                            <button class="quick-question-btn">我可以查什么</button>
                            <button class="quick-question-btn">火电行业大气污染物年排放量计算方法</button>
                            <button class="quick-question-btn">钢铁行业执行的排放标准有哪些</button>
                        </div>
                        <div class="question-input-container">
                            <textarea class="question-input" placeholder="请输入您的问题..." rows="2"></textarea>
                            <button class="submit-btn" title="提交">↑</button>
                        </div>
                        <div class="answer-container">
                            <div class="answer-title">答案：</div>
                            <div class="answer-content"></div>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="tab1">
                        <div class="quick-questions">
                            <button class="quick-question-btn">我可以查询哪些数据？</button>
                            <button class="quick-question-btn">列出所有执行标准的基本信息</button>
                            <button class="quick-question-btn">哪些污染物排放权可以进行交易？</button>
                        </div>
                        <div class="question-input-container">
                            <textarea class="question-input" placeholder="请输入您的问题..." rows="2"></textarea>
                            <button class="submit-btn" title="提交">↑</button>
                        </div>
                        <div class="answer-container">
                            <div class="answer-title">答案：</div>
                            <div class="answer-content"></div>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="tab3">
                        <div class="quick-questions">
                        <button class="quick-question-btn">我可以查哪些信息</button>    
                        <button class="quick-question-btn">查询污染物、污染物类型、以及它们的关系</button>
                            <button class="quick-question-btn">请给出3个土壤修复案例</button>
                        </div>
                        <div class="question-input-container">
                            <textarea class="question-input" placeholder="请输入您的问题..." rows="2"></textarea>
                            <button class="submit-btn" title="提交">↑</button>
                        </div>
                        <div class="answer-container">
                            <div class="answer-title">答案：</div>
                            <div class="answer-content"></div>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="tab4">
                        <div class="quick-questions">
                            <button class="quick-question-btn">我可以咨询什么问题？</button>
                            <button class="quick-question-btn">如何申请排污许可证？</button>
                            <button class="quick-question-btn">环保验收需要哪些材料？</button>
                        </div>
                        <div class="question-input-container">
                            <textarea class="question-input" placeholder="请输入您的问题..." rows="2"></textarea>
                            <button class="submit-btn" title="提交">↑</button>
                        </div>
                        <div class="answer-container">
                            <div class="answer-title">答案：</div>
                            <div class="answer-content"></div>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="tab5">
                        <div class="quick-questions">
                            <button class="quick-question-btn">我可以问哪些问题？</button>
                            <button class="quick-question-btn">什么是排污许可制度？</button>
                            <button class="quick-question-btn">排污许可证包含哪些主要内容？</button>
                        </div>
                        <div class="question-input-container">
                            <textarea class="question-input" placeholder="请输入您的问题..." rows="2"></textarea>
                            <button class="submit-btn" title="提交">↑</button>
                        </div>
                        <div class="answer-container">
                            <div class="answer-title">答案：</div>
                            <div class="answer-content"></div>
                        </div>
                    </div>
                </div>
                
                <!-- 高级模式 -->
                <div class="advanced-mode-container">
                    <div class="app-container">
                        <div class="sidebar">
                            <button class="new-chat-btn" id="${this.containerId}-new-chat-btn">+ 新建对话</button>
                            <div class="session-list" id="${this.containerId}-session-list">
                                <!-- Sessions will be loaded here -->
                            </div>
                            <div style="margin-top: auto; font-size: 0.8rem; color: #aaa; text-align: center;">
                                v1.2.0
                            </div>
                        </div>
                        <div class="main-content">
                            <div class="chat-header">
                                <h3 id="${this.containerId}-current-session-title">当前对话</h3>
                                <div class="user-info">User ID: <span id="${this.containerId}-user-id-display">${this.userId}</span></div>
                            </div>
                            <div id="${this.containerId}-chat-container" class="chat-container">
                                <div style="text-align: center; color: #aaa; margin-top: 50px;">请选择或创建一个会话开始</div>
                            </div>
                            <div class="input-area">
                                <div class="input-container">
                                    <textarea id="${this.containerId}-query-input" class="query-input" placeholder="请输入您的问题..." rows="2"></textarea>
                                </div>
                                <div class="right-buttons">
                                    <div class="file-upload-btn" id="${this.containerId}-file-upload-btn" title="上传文本文件(.txt)">
                                        <span class="file-upload-icon">📄</span>
                                    </div>
                                    <input type="file" id="${this.containerId}-file-input" accept=".txt" style="display: none;" />
                                    <div class="deep-think-toggle active" id="${this.containerId}-deep-think-btn" title="深度思考">
                                        <span class="deep-think-icon">🧠</span>
                                    </div>
                                    <button id="${this.containerId}-send-btn" class="send-btn" title="发送">↑</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 模式切换事件
        const modeBtns = this.container.querySelectorAll('.mode-btn');
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.switchMode(mode);
            });
        });
        
        // Tab切换事件
        const tabBtns = this.container.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // 快速问题点击事件
        const quickQuestionBtns = this.container.querySelectorAll('.quick-question-btn');
        quickQuestionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // 获取当前tab的输入框
                const currentTabContent = this.container.querySelector(`.tab-content.active`);
                const input = currentTabContent.querySelector('.question-input');
                input.value = btn.textContent;
            });
        });
        
        // 提交按钮点击事件
        const submitBtns = this.container.querySelectorAll('.submit-btn');
        submitBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabContent = e.target.closest('.tab-content');
                this.handleBasicQuestion(tabContent);
            });
        });
        
        // 高级模式相关事件
        this.bindAdvancedModeEvents();
    }
    
    /**
     * 绑定高级模式相关事件
     */
    bindAdvancedModeEvents() {
        // 深度思考切换按钮
        const deepThinkBtn = document.getElementById(`${this.containerId}-deep-think-btn`);
        if (deepThinkBtn) {
            deepThinkBtn.addEventListener('click', () => this.toggleDeepThink(deepThinkBtn));
        }
        
        // 新建对话按钮
        const newChatBtn = document.getElementById(`${this.containerId}-new-chat-btn`);
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => this.createNewSession());
        }
        
        // 发送按钮
        const sendBtn = document.getElementById(`${this.containerId}-send-btn`);
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        // 输入框回车发送（Enter发送，Shift+Enter换行）
        const queryInput = document.getElementById(`${this.containerId}-query-input`);
        if (queryInput) {
            queryInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    this.sendMessage();
                }
            });
        }
        
        // 文件上传按钮
        const fileUploadBtn = document.getElementById(`${this.containerId}-file-upload-btn`);
        const fileInput = document.getElementById(`${this.containerId}-file-input`);
        if (fileUploadBtn && fileInput) {
            fileUploadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (event) => this.handleFileUpload(event, fileInput));
            
            // 初始化文件上传按钮的显示状态：仅在非深度思考模式下显示
            if (this.isDeepThinkEnabled) {
                fileUploadBtn.style.display = 'none';
                fileInput.style.display = 'none';
            } else {
                fileUploadBtn.style.display = 'block';
                fileInput.style.display = 'none'; // 始终隐藏实际的文件输入框
            }
        }
    }

    /**
     * 获取工具开启状态
     * @returns {Promise<void>} - 获取完成的Promise
     */
    async fetchToolStatus() {
        try {
            const response = await fetch(`${this.apiBase}/tool_status`);
            if (response.ok) {
                this.toolStatus = await response.json();
            } else {
                console.error('获取工具状态失败:', response.status);
                // 默认所有工具都开启
                this.toolStatus = {
                    queryFAQVDB: true,
                    queryVectorDB: true,
                    queryMySQL: true,
                    queryNeo4j: true
                };
            }
        } catch (error) {
            console.error('获取工具状态出错:', error);
            // 默认所有工具都开启
            this.toolStatus = {
                queryFAQVDB: true,
                queryVectorDB: true,
                queryMySQL: true,
                queryNeo4j: true
            };
        }
    }

    /**
     * 根据工具开启状态更新tab可见性
     */
    updateTabVisibility() {
        // queryFAQVDB 对应 "常见问答(FAQ)" - tab5
        const faqTab = this.container.querySelector('[data-tab="tab5"]');
        if (faqTab) {
            faqTab.style.display = this.toolStatus.queryFAQVDB ? 'block' : 'none';
        }

        // queryVectorDB 对应 "信息咨询(RAG)" - tab2
        const ragTab = this.container.querySelector('[data-tab="tab2"]');
        if (ragTab) {
            ragTab.style.display = this.toolStatus.queryVectorDB ? 'block' : 'none';
        }

        // queryMySQL 对应 "数据查询(SQL)" - tab1
        const sqlTab = this.container.querySelector('[data-tab="tab1"]');
        if (sqlTab) {
            sqlTab.style.display = this.toolStatus.queryMySQL ? 'block' : 'none';
        }

        // queryNeo4j 对应 "图谱查询(Cypher)" - tab3
        const cypherTab = this.container.querySelector('[data-tab="tab3"]');
        if (cypherTab) {
            cypherTab.style.display = this.toolStatus.queryNeo4j ? 'block' : 'none';
        }

        // 如果当前激活的tab被隐藏，切换到第一个可见的tab
        const activeTab = this.container.querySelector('.tab-btn.active');
        if (activeTab && activeTab.style.display === 'none') {
            const visibleTabs = this.container.querySelectorAll('.tab-btn:not([style="display: none;"])');
            if (visibleTabs.length > 0) {
                this.switchTab(visibleTabs[0].dataset.tab);
            }
        }
    }

    /**
     * 获取示例问题配置
     * @returns {Promise<void>} - 获取完成的Promise
     */
    async fetchExampleQuestions() {
        try {
            const response = await fetch(`${this.apiBase}/example_questions`);
            if (response.ok) {
                this.exampleQuestions = await response.json();
            } else {
                console.error('获取示例问题配置失败:', response.status);
                // 默认示例问题
                this.exampleQuestions = {
                    "5": ["我可以问哪些问题？", "什么是排污许可制度？", "排污许可证包含哪些主要内容？"],
                    "2": ["我可以查什么", "火电行业大气污染物年排放量计算方法", "钢铁行业执行的排放标准有哪些"],
                    "1": ["我可以查询哪些数据？", "列出所有执行标准的基本信息", "哪些污染物排放权可以进行交易？"],
                    "3": ["我可以查哪些信息", "查询污染物、污染物类型、以及它们的关系", "请给出3个土壤修复案例"],
                    "4": ["我可以咨询什么问题？", "如何申请排污许可证？", "环保验收需要哪些材料？"]
                };
            }
        } catch (error) {
            console.error('获取示例问题配置出错:', error);
            // 默认示例问题
            this.exampleQuestions = {
                "5": ["我可以问哪些问题？", "什么是排污许可制度？", "排污许可证包含哪些主要内容？"],
                "2": ["我可以查什么", "火电行业大气污染物年排放量计算方法", "钢铁行业执行的排放标准有哪些"],
                "1": ["我可以查询哪些数据？", "列出所有执行标准的基本信息", "哪些污染物排放权可以进行交易？"],
                "3": ["我可以查哪些信息", "查询污染物、污染物类型、以及它们的关系", "请给出3个土壤修复案例"],
                "4": ["我可以咨询什么问题？", "如何申请排污许可证？", "环保验收需要哪些材料？"]
            };
        }
    }

    /**
     * 更新示例问题显示
     */
    updateExampleQuestions() {
        // 遍历所有tab内容，更新示例问题
        const tabContents = this.container.querySelectorAll('.tab-content');
        tabContents.forEach(tabContent => {
            const tabId = tabContent.id;
            const quickQuestionsContainer = tabContent.querySelector('.quick-questions');
            
            if (quickQuestionsContainer) {
                // 清空现有示例问题
                quickQuestionsContainer.innerHTML = '';
                
                // 获取当前tab的示例问题
                const tabNumber = tabId.replace('tab', '');
                const questions = this.exampleQuestions[tabNumber] || [];
                
                // 添加示例问题按钮
                questions.forEach(question => {
                    const button = document.createElement('button');
                    button.className = 'quick-question-btn';
                    button.textContent = question;
                    button.addEventListener('click', () => {
                        const input = tabContent.querySelector('.question-input');
                        input.value = question;
                    });
                    quickQuestionsContainer.appendChild(button);
                });
            }
        });
    }

    /**
     * 切换模式（基础/高级）
     * @param {string} mode - 模式名称，'basic' 或 'advanced'
     */
    switchMode(mode) {
        if (this.currentMode === mode) return;
        
        this.currentMode = mode;
        
        // 更新模式按钮状态
        const modeBtns = this.container.querySelectorAll('.mode-btn');
        modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // 显示对应的模式容器
        const basicContainer = this.container.querySelector('.basic-mode-container');
        const advancedContainer = this.container.querySelector('.advanced-mode-container');
        
        if (mode === 'basic') {
            basicContainer.classList.add('active');
            advancedContainer.classList.remove('active');
        } else {
            basicContainer.classList.remove('active');
            advancedContainer.classList.add('active');
            
            // 切换到高级模式时加载会话列表
            this.loadSessions();
        }
    }

    /**
     * 选择第一个可见的tab作为默认选择项
     */
    selectFirstVisibleTab() {
        const visibleTabs = this.container.querySelectorAll('.tab-btn:not([style*="display: none"])');
        if (visibleTabs.length > 0) {
            this.switchTab(visibleTabs[0].dataset.tab);
        }
    }

    /**
     * 切换tab
     * @param {string} tabId - tab的ID
     */
    switchTab(tabId) {
        if (this.currentTab === tabId) return;
        
        this.currentTab = tabId;
        
        // 更新tab按钮状态
        const tabBtns = this.container.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        // 显示对应的tab内容
        const tabContents = this.container.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });
    }

    /**
     * 处理基础模式的问题提交
     * @param {HTMLElement} tabContent - 当前tab的内容元素
     */
    async handleBasicQuestion(tabContent) {
        const input = tabContent.querySelector('.question-input');
        const answerContent = tabContent.querySelector('.answer-content');
        const question = input.value.trim();
        
        if (!question) return;
        
        // 检查当前是哪个tab
        const tabId = tabContent.id;
        
        if (tabId === 'tab1') { // 数据查询(SQL) tab
            // 显示加载状态
            answerContent.innerHTML = '<div style="text-align: center; color: #aaa;">正在查询...<div>';
            
            try {
                // 调用MySQL查询API
                const response = await fetch(`${this.apiBase}/mysql_query`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: question })
                });
                
                if (!response.ok) throw new Error('API请求失败');
                
                const data = await response.json();
                
                // 显示答案，将\n替换为<br>以正确显示换行
                const additionalInfoHTML = `
                    <div style="margin-top: 15px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #f0f0f0; padding: 8px 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'; this.querySelector('.toggle-icon').textContent = this.nextElementSibling.style.display === 'none' ? '▶' : '▼';">
                            <span style="font-weight: 500; color: #666;">详细信息</span>
                            <span class="toggle-icon" style="font-size: 12px; color: #999;">▼</span>
                        </div>
                        <div style="padding: 12px; background-color: #fafafa; display: block;">
                            ${data.sql_query ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">SQL查询语句：</strong>
                                    <pre style="background-color: #f5f5f5; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 13px; overflow-x: auto; margin: 5px 0 0 0;">${data.sql_query}</pre>
                                </div>
                            ` : ''}
                            ${data.record_count !== undefined ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">查到记录个数：</strong>
                                    <span style="color: #666;">${data.record_count}</span>
                                </div>
                            ` : ''}
                            ${data.execution_time !== undefined ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">执行耗时：</strong>
                                    <span style="color: #666;">${data.execution_time.toFixed(2)} 秒</span>
                                </div>
                            ` : ''}
                            ${data.model_name ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">使用模型：</strong>
                                    <span style="color: #666;">${data.model_name}</span>
                                </div>
                            ` : ''}
                            ${data.reasoning_log ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">推理过程日志：</strong>
                                    <pre style="background-color: #f5f5f5; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 13px; overflow-x: auto; margin: 5px 0 0 0; white-space: pre-wrap; word-break: break-word;">${data.reasoning_log}</pre>
                                </div>
                            ` : ''}
                            ${data.mysql_results ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">MySQL执行结果：</strong>
                                    <pre style="background-color: #f5f5f5; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 13px; overflow-x: auto; margin: 5px 0 0 0; white-space: pre-wrap; word-break: break-word;">${JSON.stringify(data.mysql_results, null, 2)}</pre>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
                
                // 根据format_answer决定如何渲染结果
                let responseHTML = '';
                
                // 如果SQL查询语句不为空，显示大模型生成的msg
                let msgHTML = '';
                if (data.sql_query && data.msg) {
                    msgHTML = `<div style="padding: 0px; background-color: #ffffffff; border-radius: 8px; margin-top: 10px; border-left: 0px solid #ffffffff;">${data.msg.replace(/\n/g, '<br>')}</div>`;
                }
                
                if (data.format_answer === false) {
                    try {
                        // 尝试解析response为JSON格式
                        const rawData = JSON.parse(data.response);
                        if (rawData.success && rawData.data && rawData.data.columnList && rawData.data.dataList) {
                            // 生成表格HTML
                            let tableHTML = '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">';
                            
                            // 添加表头
                            tableHTML += '<thead><tr>';
                            rawData.data.columnList.forEach(column => {
                                tableHTML += `<th style="background-color: #4a90e2; color: white; padding: 8px; text-align: left; border: 1px solid #ccc;">${column}</th>`;
                            });
                            tableHTML += '</tr></thead>';
                            
                            // 添加数据行
                            tableHTML += '<tbody>';
                            rawData.data.dataList.forEach(row => {
                                tableHTML += '<tr>';
                                row.forEach(cell => {
                                    tableHTML += `<td style="padding: 8px; border: 1px solid #ccc;">${cell}</td>`;
                                });
                                tableHTML += '</tr>';
                            });
                            tableHTML += '</tbody></table>';
                            
                            // 显示表格，将msg放在表格上方
                            responseHTML = msgHTML + `<div style="margin-top: 10px;">${tableHTML}</div>`;
                        } else {
                            // 无法解析为表格格式，显示原始文本
                            responseHTML = msgHTML + `<div style="padding: 10px; background-color: #f5f5f5; border-radius: 8px; margin-top: 10px;">${data.response.replace(/\n/g, '<br>')}</div>`;
                        }
                    } catch (e) {
                        // JSON解析失败，显示原始文本
                        responseHTML = msgHTML + `<div style="padding: 10px; background-color: #f5f5f5; border-radius: 8px; margin-top: 10px;">${data.response.replace(/\n/g, '<br>')}</div>`;
                    }
                } else {
                    // 正常显示自然语言回答
                    responseHTML = msgHTML + `<div style="padding: 10px; background-color: #f5f5f5; border-radius: 8px; margin-top: 10px;">${data.response.replace(/\n/g, '<br>')}</div>`;
                }
                
                answerContent.innerHTML = responseHTML + additionalInfoHTML;
                
            } catch (error) {
                console.error('MySQL查询失败:', error);
                answerContent.innerHTML = '<div style="color: #ff6b6b; text-align: center; padding: 10px;">查询失败，请稍后重试</div>';
            }
        } else if (tabId === 'tab3') { // 图谱查询(Cypher) tab
            // 显示加载状态
            answerContent.innerHTML = '<div style="text-align: center; color: #aaa;">正在查询...<div>';
            
            try {
                // 调用图谱查询API
                const response = await fetch(`${this.apiBase}/graph-query`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: question })
                });
                
                if (!response.ok) throw new Error('API请求失败');
                
                const data = await response.json();
                
                // 显示答案，将\n替换为<br>以正确显示换行
                const additionalInfoHTML = `
                    <div style="margin-top: 15px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #f0f0f0; padding: 8px 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'; this.querySelector('.toggle-icon').textContent = this.nextElementSibling.style.display === 'none' ? '▶' : '▼';">
                            <span style="font-weight: 500; color: #666;">详细信息</span>
                            <span class="toggle-icon" style="font-size: 12px; color: #999;">▼</span>
                        </div>
                        <div style="padding: 12px; background-color: #fafafa; display: block;">
                            ${data.cypher_query ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">Cypher查询语句：</strong>
                                    <pre style="background-color: #f5f5f5; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 13px; overflow-x: auto; margin: 5px 0 0 0;">${data.cypher_query}</pre>
                                </div>
                            ` : ''}
                            ${data.record_count !== undefined ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">查到记录个数：</strong>
                                    <span style="color: #666;">${data.record_count}</span>
                                </div>
                            ` : ''}
                            ${data.execution_time !== undefined ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">执行耗时：</strong>
                                    <span style="color: #666;">${data.execution_time.toFixed(2)} 秒</span>
                                </div>
                            ` : ''}
                            ${data.model_name ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">使用模型：</strong>
                                    <span style="color: #666;">${data.model_name}</span>
                                </div>
                            ` : ''}
                            ${data.reasoning_log ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">推理过程日志：</strong>
                                    <pre style="background-color: #f5f5f5; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 13px; overflow-x: auto; margin: 5px 0 0 0; white-space: pre-wrap; word-break: break-word;">${data.reasoning_log}</pre>
                                </div>
                            ` : ''}
                            ${data.neo4j_results ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">Neo4j执行结果：</strong>
                                    <pre style="background-color: #f5f5f5; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 13px; overflow-x: auto; margin: 5px 0 0 0; white-space: pre-wrap; word-break: break-word;">${JSON.stringify(data.neo4j_results, null, 2)}</pre>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
                
                // 如果有图谱HTML内容，添加到响应中
                let graphHTML = '';
                if (data.graph_html) {
                    // 编码HTML内容以防止XSS并确保正确显示
                    const encodedGraphHtml = data.graph_html
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#039;");
                    
                    graphHTML = `
                        <div style="margin-top: 15px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                            <div style="background-color: #f0f0f0; padding: 8px 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'; this.querySelector('.toggle-icon').textContent = this.nextElementSibling.style.display === 'none' ? '▶' : '▼';">
                                <span style="font-weight: 500; color: #666;">知识图谱(可互动)</span>
                                <span class="toggle-icon" style="font-size: 12px; color: #999;">▼</span>
                            </div>
                            <div style="padding: 12px; background-color: #fafafa; display: block;">
                                <iframe srcdoc="${encodedGraphHtml}" width="100%" height="600px" frameborder="0"></iframe>
                            </div>
                        </div>
                    `;
                }
                
                // 根据API返回的hasFormattedJson标记决定是否使用<pre>标签
                let responseHTML;
                if (data.hasFormattedJson) {
                    // 如果API标记为包含格式化的JSON数据，使用<pre>标签保留格式
                    responseHTML = `
                        <div style="padding: 10px; background-color: #f5f5f5; border-radius: 8px; margin-top: 10px;">
                            <pre style="white-space: pre-wrap; word-break: break-word; margin: 0; font-family: monospace; font-size: 13px;">${data.response}</pre>
                        </div>
                    `;
                } else {
                    // 其他情况使用<br>替换换行
                    responseHTML = `
                        <div style="padding: 10px; background-color: #f5f5f5; border-radius: 8px; margin-top: 10px;">${data.response.replace(/\n/g, '<br>')}</div>
                    `;
                }
                
                // 如果cypher_query为空且有msg，在答案和知识图谱之间显示msg
                let msgHTML = '';
                if (data.cypher_query) {
                   msgHTML = `<div style="padding: 0px; background-color: #ffffffff; border-radius: 8px; margin-top: 10px; border-left: 0px solid #ffffffff;">${data.msg.replace(/\n/g, '<br>')}</div>`;
                }
                
                answerContent.innerHTML = msgHTML+graphHTML + responseHTML + additionalInfoHTML;
                
            } catch (error) {
                console.error('图谱查询失败:', error);
                answerContent.innerHTML = '<div style="color: #ff6b6b; text-align: center; padding: 10px;">查询失败，请稍后重试</div>';
            }
        } else if (tabId === 'tab2') { // 信息咨询(RAG) tab
            // 显示加载状态
            answerContent.innerHTML = '<div style="text-align: center; color: #aaa;">正在检索相关信息...<div>';
            
            try {
                // 调用向量数据库查询API
                const response = await fetch(`${this.apiBase}/vdb_query`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: question })
                });
                
                if (!response.ok) throw new Error('API请求失败');
                
                const data = await response.json();
                
                // 构建详细信息HTML
                const additionalInfoHTML = `
                    <div style="margin-top: 15px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #f0f0f0; padding: 8px 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'; this.querySelector('.toggle-icon').textContent = this.nextElementSibling.style.display === 'none' ? '▶' : '▼';">
                            <span style="font-weight: 500; color: #666;">详细信息</span>
                            <span class="toggle-icon" style="font-size: 12px; color: #999;">▼</span>
                        </div>
                        <div style="padding: 12px; background-color: #fafafa; display: block;">
                            ${data.record_count !== undefined ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">检索到文本块数量：</strong>
                                    <span style="color: #666;">${data.record_count}</span>
                                </div>
                            ` : ''}
                            ${data.execution_time !== undefined ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">执行耗时：</strong>
                                    <span style="color: #666;">${data.execution_time.toFixed(2)} 秒</span>
                                </div>
                            ` : ''}
                            ${data.model_name ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">使用模型：</strong>
                                    <span style="color: #666;">${data.model_name}</span>
                                </div>
                            ` : ''}
                            ${data.reasoning_log ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">推理过程日志：</strong>
                                    <pre style="background-color: #f5f5f5; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 13px; overflow-x: auto; margin: 5px 0 0 0; white-space: pre-wrap; word-break: break-word;">${data.reasoning_log}</pre>
                                </div>
                            ` : ''}
                            ${data.context_chunks && Array.isArray(data.context_chunks) && data.context_chunks.length > 0 ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">检索到的文本块详情：</strong>
                                    <div style="margin-top: 8px;">
                                        ${data.context_chunks.map((chunk, index) => `
                                            <div style="border: 1px solid #ddd; border-radius: 4px; padding: 8px; margin-bottom: 8px; background-color: #fff;">
                                                <div style="font-weight: bold; margin-bottom: 4px; color: #444;">文本块 ${index + 1} (相关度: ${chunk.relevance_score ? chunk.relevance_score.toFixed(3) : 'N/A'})</div>
                                                <div style="font-size: 0.9em; color: #666; margin-bottom: 4px;">来源: ${chunk.source_file || '未知'}, 页码: ${chunk.page_number || '未知'}</div>
                                                <div style="font-size: 0.95em; line-height: 1.4;">${chunk.content || '无内容'}</div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
                
                // 显示答案，将\n替换为<br>以正确显示换行
                let responseHTML = '';
                if (typeof data.response === 'string') {
                    // 如果response是字符串，直接显示
                    responseHTML = `<div style="padding: 10px; background-color: #f5f5f5; border-radius: 8px; margin-top: 10px;">${data.response.replace(/\n/g, '<br>')}</div>`;
                } else if (data.response && typeof data.response === 'object') {
                    // 如果response是对象，转换为格式化的JSON显示
                    responseHTML = `<div style="padding: 10px; background-color: #f5f5f5; border-radius: 8px; margin-top: 10px;"><pre style="white-space: pre-wrap; word-break: break-word; margin: 0; font-family: monospace; font-size: 13px;">${JSON.stringify(data.response, null, 2)}</pre></div>`;
                } else {
                    // 默认情况
                    responseHTML = `<div style="padding: 10px; background-color: #f5f5f5; border-radius: 8px; margin-top: 10px;">${JSON.stringify(data.response)}</div>`;
                }
                
                answerContent.innerHTML = responseHTML + additionalInfoHTML;
                
            } catch (error) {
                console.error('向量数据库查询失败:', error);
                answerContent.innerHTML = '<div style="color: #ff6b6b; text-align: center; padding: 10px;">查询失败，请稍后重试</div>';
            }
        } else if (tabId === 'tab5') { // 常见问答(FAQ) tab
            // 显示加载状态
            answerContent.innerHTML = '<div style="text-align: center; color: #aaa;">正在查找相关问答...<div>';
            
            try {
                // 调用FAQ查询API
                const response = await fetch(`${this.apiBase}/faq_query`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: question })
                });
                
                if (!response.ok) throw new Error('API请求失败');
                
                const data = await response.json();
                
                // 构建详细信息HTML
                const additionalInfoHTML = `
                    <div style="margin-top: 15px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #f0f0f0; padding: 8px 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'; this.querySelector('.toggle-icon').textContent = this.nextElementSibling.style.display === 'none' ? '▶' : '▼';">
                            <span style="font-weight: 500; color: #666;">详细信息</span>
                            <span class="toggle-icon" style="font-size: 12px; color: #999;">▼</span>
                        </div>
                        <div style="padding: 12px; background-color: #fafafa; display: block;">
                            ${data.record_count !== undefined ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">匹配到的问答数量：</strong>
                                    <span style="color: #666;">${data.record_count}</span>
                                </div>
                            ` : ''}
                            ${data.execution_time !== undefined ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">执行耗时：</strong>
                                    <span style="color: #666;">${data.execution_time.toFixed(2)} 秒</span>
                                </div>
                            ` : ''}
                            ${data.model_name ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">使用模型：</strong>
                                    <span style="color: #666;">${data.model_name}</span>
                                </div>
                            ` : ''}
                            ${data.reasoning_log ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">推理过程日志：</strong>
                                    <pre style="background-color: #f5f5f5; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 13px; overflow-x: auto; margin: 5px 0 0 0; white-space: pre-wrap; word-break: break-word;">${data.reasoning_log}</pre>
                                </div>
                            ` : ''}
                            ${data.context_chunks && Array.isArray(data.context_chunks) && data.context_chunks.length > 0 ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">检索到的问答对详情：</strong>
                                    <div style="margin-top: 8px;">
                                        ${data.context_chunks.map((chunk, index) => `
                                            <div style="border: 1px solid #ddd; border-radius: 4px; padding: 8px; margin-bottom: 8px; background-color: #fff;">
                                                <div style="font-weight: bold; margin-bottom: 4px; color: #444;">问答对 ${index + 1} (相关度: ${chunk.relevance_score ? chunk.relevance_score.toFixed(3) : 'N/A'})</div>
                                                <div style="font-size: 0.95em; line-height: 1.4; margin-bottom: 8px;">
                                                    <strong>问:</strong> ${chunk.question || '无问题内容'}
                                                </div>
                                                <div style="font-size: 0.95em; line-height: 1.4;">
                                                    <strong>答:</strong> ${chunk.answer || '无答案内容'}
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
                
                // 显示答案，将\n替换为<br>以正确显示换行
                let responseHTML = '';
                if (typeof data.response === 'string') {
                    // 如果response是字符串，直接显示
                    responseHTML = `<div style="padding: 10px; background-color: #f5f5f5; border-radius: 8px; margin-top: 10px;">${data.response.replace(/\n/g, '<br>')}</div>`;
                } else if (data.response && typeof data.response === 'object') {
                    // 如果response是对象，转换为格式化的JSON显示
                    responseHTML = `<div style="padding: 10px; background-color: #f5f5f5; border-radius: 8px; margin-top: 10px;"><pre style="white-space: pre-wrap; word-break: break-word; margin: 0; font-family: monospace; font-size: 13px;">${JSON.stringify(data.response, null, 2)}</pre></div>`;
                } else {
                    // 默认情况
                    responseHTML = `<div style="padding: 10px; background-color: #f5f5f5; border-radius: 8px; margin-top: 10px;">${JSON.stringify(data.response)}</div>`;
                }
                
                answerContent.innerHTML = responseHTML + additionalInfoHTML;
                
            } catch (error) {
                console.error('FAQ查询失败:', error);
                answerContent.innerHTML = '<div style="color: #ff6b6b; text-align: center; padding: 10px;">查询失败，请稍后重试</div>';
            }
        } else if (tabId === 'tab4') { // 智能解答(Intent) tab
            // 显示加载状态
            answerContent.innerHTML = '<div style="text-align: center; color: #aaa;">正在分析意图并确定检索策略...<div>';
            
            try {
                // 调用智能解答API
                const response = await fetch(`${this.apiBase}/intent_query`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: question })
                });
                
                if (!response.ok) throw new Error('API请求失败');
                
                const data = await response.json();
                
                // 构建详细信息HTML
                const additionalInfoHTML = `
                    <div style="margin-top: 15px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #f0f0f0; padding: 8px 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'; this.querySelector('.toggle-icon').textContent = this.nextElementSibling.style.display === 'none' ? '▶' : '▼';">
                            <span style="font-weight: 500; color: #666;">详细信息</span>
                            <span class="toggle-icon" style="font-size: 12px; color: #999;">▼</span>
                        </div>
                        <div style="padding: 12px; background-color: #fafafa; display: block;">
                            ${data.execution_time !== undefined ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">执行耗时：</strong>
                                    <span style="color: #666;">${data.execution_time.toFixed(2)} 秒</span>
                                </div>
                            ` : ''}
                            ${data.model_name ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">使用模型：</strong>
                                    <span style="color: #666;">${data.model_name}</span>
                                </div>
                            ` : ''}
                            ${data.reasoning_log ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">推理过程日志：</strong>
                                    <pre style="background-color: #f5f5f5; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 13px; overflow-x: auto; margin: 5px 0 0 0; white-space: pre-wrap; word-break: break-word;">${data.reasoning_log}</pre>
                                </div>
                            ` : ''}
                            ${data.tool_results ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #333;">工具原始结果：</strong>
                                    <pre style="background-color: #f5f5f5; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 13px; overflow-x: auto; margin: 5px 0 0 0; white-space: pre-wrap; word-break: break-word;">${typeof data.tool_results === 'string' ? data.tool_results : JSON.stringify(data.tool_results, null, 2)}</pre>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
                
                // 显示答案，将\n替换为<br>以正确显示换行
                let responseHTML = '';
                if (typeof data.response === 'string') {
                    // 如果response是字符串，直接显示
                    responseHTML = `<div style="padding: 10px; background-color: #f5f5f5; border-radius: 8px; margin-top: 10px;">${data.response.replace(/\n/g, '<br>')}</div>`;
                } else if (data.response && typeof data.response === 'object') {
                    // 如果response是对象，转换为格式化的JSON显示
                    responseHTML = `<div style="padding: 10px; background-color: #f5f5f5; border-radius: 8px; margin-top: 10px;"><pre style="white-space: pre-wrap; word-break: break-word; margin: 0; font-family: monospace; font-size: 13px;">${JSON.stringify(data.response, null, 2)}</pre></div>`;
                } else {
                    // 默认情况
                    responseHTML = `<div style="padding: 10px; background-color: #f5f5f5; border-radius: 8px; margin-top: 10px;">${JSON.stringify(data.response)}</div>`;
                }
                
                answerContent.innerHTML = responseHTML + additionalInfoHTML;
                
            } catch (error) {
                console.error('智能解答查询失败:', error);
                answerContent.innerHTML = '<div style="color: #ff6b6b; text-align: center; padding: 10px;">查询失败，请稍后重试</div>';
            }
        } else {
            // 其他tab保持原有的模拟回答行为
            answerContent.textContent = `你的问题是：${question}`;
        }
        
        // 保留用户输入的问题，不清除输入框
    }

    /**
     * 切换深度思考模式
     * @param {HTMLElement} btn - 切换按钮元素
     */
    toggleDeepThink(btn) {
        this.isDeepThinkEnabled = !this.isDeepThinkEnabled;
        btn.classList.toggle('active', this.isDeepThinkEnabled);
        
        // 控制上传按钮的显示/隐藏：仅在非深度思考模式下显示
        const fileUploadBtn = document.getElementById(`${this.containerId}-file-upload-btn`);
        const fileInput = document.getElementById(`${this.containerId}-file-input`);
        // 控制提问区高度：在非深度思考模式下增加一行高度
        const queryInput = document.getElementById(`${this.containerId}-query-input`);
        
        if (fileUploadBtn && fileInput) {
            if (this.isDeepThinkEnabled) {
                fileUploadBtn.style.display = 'none';
                fileInput.style.display = 'none';
                // 深度思考模式下，提问区使用默认高度（2行）
                if (queryInput) {
                    queryInput.rows = 2;
                }
            } else {
                fileUploadBtn.style.display = 'block';
                fileInput.style.display = 'none'; // 始终隐藏实际的文件输入框
                // 非深度思考模式下，提问区增加一行高度（3行）
                if (queryInput) {
                    queryInput.rows = 3;
                }
            }
        }
    }
    
    /**
     * 处理文件上传
     * @param {Event} event - 文件上传事件
     * @param {HTMLInputElement} fileInput - 文件输入元素
     */
    handleFileUpload(event, fileInput) {
        const file = event.target.files[0];
        if (!file) return;
        
        // 检查文件类型
        if (!file.name.toLowerCase().endsWith('.txt')) {
            alert('请上传.txt格式的文本文件');
            fileInput.value = '';
            return;
        }
        
        // 读取文件内容
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const fileInfo = {
                name: file.name,
                content: content,
                size: file.size,
                uploadedAt: new Date().toISOString()
            };
            
            // 添加到已上传文件列表
            this.uploadedFiles.push(fileInfo);
            
            // 显示上传成功提示
            this.appendMessage(`已上传文件：${file.name}`, 'agent');
            
            // 重置文件输入
            fileInput.value = '';
        };
        
        reader.onerror = () => {
            alert('文件读取失败，请重试');
            fileInput.value = '';
        };
        
        // 读取文件
        reader.readAsText(file, 'utf-8');
    }

    /**
     * 创建新会话（高级模式）
     * @returns {Promise<void>} - 创建完成的Promise
     */
    async createNewSession() {
        try {
            const response = await fetch(`${this.apiBase}/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: this.userId, title: '新对话' })
            });
            if (!response.ok) throw new Error('Failed to create session');
            const session = await response.json();
            await this.loadSessions(); // 刷新列表
            this.selectSession(session.session_id, session.title);
        } catch (error) {
            console.error('Error creating session:', error);
            alert('创建会话失败');
        }
    }

    /**
     * 发送消息（高级模式）
     * @returns {Promise<void>} - 发送完成的Promise
     */
    async sendMessage() {
        if (!this.currentSessionId) {
            alert('请先创建会话');
            return;
        }

        const input = document.getElementById(`${this.containerId}-query-input`);
        const btn = document.getElementById(`${this.containerId}-send-btn`);
        const deepThinkBtn = document.getElementById(`${this.containerId}-deep-think-btn`);
        const text = input.value.trim();

        if (!text) return;

        // 显示用户消息
        this.appendMessage(text, 'user');
        input.value = '';
        input.disabled = true;
        btn.disabled = true;
        
        // 禁用深度思考按钮防止请求期间切换
        deepThinkBtn.style.pointerEvents = 'none';
        deepThinkBtn.style.opacity = '0.7';

        try {
            // 准备请求数据
            const requestData = {
                query: text,
                session_id: this.currentSessionId,
                user_id: this.userId,
                enable_deep_thinking: this.isDeepThinkEnabled
            };
            
            // 如果有已上传的文件，添加到请求中
            if (this.uploadedFiles.length > 0) {
                requestData.context = {
                    files: this.uploadedFiles.map(file => ({
                        name: file.name,
                        content: file.content
                    }))
                };
                
                // 清空已上传文件列表，避免重复发送
                this.uploadedFiles = [];
            }
            
            const response = await fetch(`${this.apiBase}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // 处理推理日志，仅在当前启用深度思考模式时显示
            if (data.reasoning_log && this.isDeepThinkEnabled) {
                this.appendReasoning(data.reasoning_log, data.execution_time);
            }
            
            this.appendMessage(data.response, 'agent');
            
            // 如果标题更新了，刷新侧边栏
            if (data.title) {
                document.getElementById(`${this.containerId}-current-session-title`).textContent = data.title;
                // 刷新会话列表以更新标题
                await this.loadSessions();
            }
        } catch (error) {
            console.error('Error:', error);
            this.appendMessage('发生错误: ' + error.message, 'agent');
        } finally {
            input.disabled = false;
            btn.disabled = false;
            input.focus();
            deepThinkBtn.style.pointerEvents = 'auto';
            deepThinkBtn.style.opacity = '1';
        }
    }

    /**
     * 添加消息到聊天容器（高级模式）
     * @param {string} text - 消息内容
     * @param {string} sender - 发送者，'user'或'agent'
     * @param {boolean} [autoScroll=true] - 是否自动滚动到底部
     */
    appendMessage(text, sender, autoScroll = true) {
        const container = document.getElementById(`${this.containerId}-chat-container`);
        // 如果是空状态提示，清除
        const firstChild = container.firstChild;
        if (firstChild && container.children.length === 1 && 
            firstChild.style.textAlign === 'center' && 
            (firstChild.textContent.includes('请选择或创建一个会话开始') || 
             firstChild.textContent.includes('开始对话吧！') ||
             firstChild.textContent.includes('加载历史记录失败'))) {
            container.innerHTML = '';
        }
        
        const div = document.createElement('div');
        div.className = `message ${sender}-message`;
        div.innerText = text;
        container.appendChild(div);
        
        if (autoScroll) {
            container.scrollTop = container.scrollHeight;
        }
    }
    
    /**
     * 添加推理日志到聊天容器（高级模式）
     * @param {string} log - 推理日志内容
     * @param {number} time - 执行时间（秒）
     */
    appendReasoning(log, time) {
        const container = document.getElementById(`${this.containerId}-chat-container`);
        const div = document.createElement('div');
        div.className = 'reasoning-box';
        
        const timeStr = time ? `用时 ${time.toFixed(1)} 秒` : '';
        
        // 创建推理摘要元素
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'reasoning-summary';
        // 添加箭头图标指示折叠状态
        summaryDiv.innerHTML = `<span>💭 深度思考已完成</span><span class="reasoning-time">${timeStr}</span><span class="reasoning-toggle-icon">▼</span>`;
        
        // 创建推理内容元素
        const contentDiv = document.createElement('div');
        contentDiv.className = 'reasoning-content';
        contentDiv.style.display = 'none';
        contentDiv.innerHTML = this.escapeHtml(log);
        
        // 添加点击事件监听器，同时切换箭头图标方向
        summaryDiv.addEventListener('click', function() {
            const toggleIcon = this.querySelector('.reasoning-toggle-icon');
            if (contentDiv.style.display === 'none') {
                contentDiv.style.display = 'block';
                if (toggleIcon) {
                    toggleIcon.textContent = '▲'; // 展开时显示向上箭头
                }
            } else {
                contentDiv.style.display = 'none';
                if (toggleIcon) {
                    toggleIcon.textContent = '▼'; // 收起时显示向下箭头
                }
            }
        });
        
        // 将元素添加到推理框中
        div.appendChild(summaryDiv);
        div.appendChild(contentDiv);
        
        // 将推理框添加到聊天容器中
        container.appendChild(div);
    }
    
    /**
     * HTML转义函数
     * @param {string} text - 需要转义的文本
     * @returns {string} - 转义后的文本
     */
    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * 加载用户会话列表（高级模式）
     * @returns {Promise<void>} - 加载完成的Promise
     */
    async loadSessions() {
        try {
            const response = await fetch(`${this.apiBase}/sessions/${this.userId}`);
            if (!response.ok) throw new Error('Failed to load sessions');
            const data = await response.json();
            this.renderSessionList(data.sessions);
            
            // 如果有会话且当前未选中，默认选中最新的一个
            if (data.sessions.length > 0 && !this.currentSessionId) {
                this.selectSession(data.sessions[0].session_id, data.sessions[0].title);
            } else if (data.sessions.length === 0) {
                // 如果没有会话，自动创建一个
                this.createNewSession();
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    }

    /**
     * 渲染会话列表（高级模式）
     * @param {Array} sessions - 会话列表数据
     */
    renderSessionList(sessions) {
        const list = document.getElementById(`${this.containerId}-session-list`);
        list.innerHTML = '';
        sessions.forEach(session => {
            const item = document.createElement('div');
            item.className = `session-item ${session.session_id === this.currentSessionId ? 'active' : ''}`;
            item.textContent = session.title;
            item.onclick = () => this.selectSession(session.session_id, session.title);
            
            // 先将元素添加到DOM中，以便计算其宽度
            list.appendChild(item);
            
            // 检测文本是否溢出
            if (item.scrollWidth > item.clientWidth) {
                item.title = session.title; // 文本溢出，添加title属性显示完整内容
            } else {
                item.removeAttribute('title'); // 文本未溢出，移除title属性
            }
        });
    }

    /**
     * 选择会话（高级模式）
     * @param {string} sessionId - 会话ID
     * @param {string} title - 会话标题
     * @returns {Promise<void>} - 选择完成的Promise
     */
    async selectSession(sessionId, title) {
        this.currentSessionId = sessionId;
        document.getElementById(`${this.containerId}-current-session-title`).textContent = title;
        
        // 更新选中状态
        await this.loadSessions();
        
        // 加载历史记录
        await this.loadHistory(sessionId);
    }

    /**
     * 加载会话历史记录（高级模式）
     * @param {string} sessionId - 会话ID
     * @returns {Promise<void>} - 加载完成的Promise
     */
    async loadHistory(sessionId) {
        const container = document.getElementById(`${this.containerId}-chat-container`);
        container.innerHTML = '<div class="loading" style="display:block">加载历史记录中...</div>';
        
        try {
            const response = await fetch(`${this.apiBase}/sessions/${sessionId}/history`);
            if (!response.ok) throw new Error('Failed to load history');
            
            const data = await response.json();
            container.innerHTML = ''; // 清空 loading
            
            if (data.messages && data.messages.length > 0) {
                data.messages.forEach(msg => {
                    if (msg.role === 'user') {
                        this.appendMessage(msg.content, msg.role, false);
                    } else if (msg.role === 'agent') {
                        // 仅在当前启用深度思考模式时显示推理日志
                        if (msg.reasoning_log && this.isDeepThinkEnabled) {
                            this.appendReasoning(msg.reasoning_log, msg.execution_time);
                        }
                        this.appendMessage(msg.content, msg.role, false);
                    }
                });
                container.scrollTop = container.scrollHeight;
            } else {
                container.innerHTML = '<div style="text-align: center; color: #aaa; margin-top: 50px;">暂无历史记录，开始对话吧！</div>';
            }
        } catch (error) {
            console.error('Error loading history:', error);
            container.innerHTML = '<div style="text-align: center; color: red; margin-top: 50px;">加载历史记录失败</div>';
        }
    }

    /**
     * 销毁聊天组件
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        // 可以在这里添加其他清理逻辑
    }
}

// 导出ChatWidget2类，支持CommonJS和ES模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatWidget2;
} else if (typeof define === 'function' && define.amd) {
    define([], () => ChatWidget2);
} else {
    window.ChatWidget2 = ChatWidget2;
}
