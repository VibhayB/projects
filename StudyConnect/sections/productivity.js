function hideSpinner(iframe) {
    const spinner = iframe.previousElementSibling;
    spinner.style.display = 'none';
    iframe.style.display = 'block';
}

function showSpinner(iframe) {
    const spinner = iframe.previousElementSibling;
    spinner.style.display = 'block';
    iframe.style.display = 'none';
}

function populateProductivity(data, fxc = false) {
    let quizContent = { 
        id: "quiz",
        title: "Quiz",
        description: "Test your knowledge with our interactive quiz",
        icon: "https://cdn-icons-png.flaticon.com/512/10292/10292284.png",
        src: 'data:text/html;charset=utf-8,' + encodeURIComponent(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Interactive Quiz</title>
                <style>
                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    }
                    
                    body {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        padding: 20px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        color: #fff;
                    }
                    
                    .quiz-container {
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(10px);
                        border-radius: 20px;
                        padding: 30px;
                        width: 90%;
                        max-width: 800px;
                        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                    }
                    
                    h1 {
                        text-align: center;
                        font-size: 2.5rem;
                        margin-bottom: 20px;
                        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                        color: #fff;
                    }
                    
                    .question {
                        font-size: 1.4rem;
                        font-weight: 600;
                        margin: 25px 0;
                        text-align: center;
                        line-height: 1.5;
                    }
                    
                    .options {
                        display: grid;
                        gap: 15px;
                        margin: 20px 0;
                    }
                    
                    .option-btn {
                        padding: 15px 20px;
                        border: none;
                        border-radius: 12px;
                        background: rgba(255, 255, 255, 0.15);
                        color: white;
                        font-size: 1.1rem;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-align: left;
                        backdrop-filter: blur(5px);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    
                    .option-btn:hover {
                        background: rgba(255, 255, 255, 0.25);
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    }
                    
                    .option-btn.correct {
                        background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
                        box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
                    }
                    
                    .option-btn.wrong {
                        background: linear-gradient(135deg, #F44336 0%, #C62828 100%);
                        box-shadow: 0 5px 15px rgba(244, 67, 54, 0.4);
                    }
                    
                    #score {
                        font-size: 1.3rem;
                        text-align: center;
                        margin: 20px 0;
                        font-weight: 600;
                    }
                    
                    #play-btn, #replay-btn {
                        padding: 15px 30px;
                        border: none;
                        border-radius: 50px;
                        font-size: 1.2rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        margin: 20px auto;
                        display: block;
                        background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
                        color: white;
                        box-shadow: 0 10px 20px rgba(255, 107, 107, 0.3);
                    }
                    
                    #play-btn:hover, #replay-btn:hover {
                        transform: translateY(-3px);
                        box-shadow: 0 15px 25px rgba(255, 107, 107, 0.4);
                    }
                    
                    #meter {
                        position: relative;
                        height: 25px;
                        width: 100%;
                        border-radius: 12px;
                        overflow: hidden;
                        margin: 25px 0;
                        background: rgba(0, 0, 0, 0.2);
                        box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.2);
                    }
                    
                    #time-left {
                        position: absolute;
                        top: 0;
                        left: 0;
                        height: 100%;
                        width: 100%;
                        border-radius: 12px;
                        transition: width 0.1s linear, background-color 0.1s linear;
                    }
                    
                    .result-screen {
                        text-align: center;
                        padding: 30px;
                    }
                    
                    .result-screen h2 {
                        font-size: 2.2rem;
                        margin-bottom: 20px;
                        background: linear-gradient(135deg, #00b4db 0%, #0083b0 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                    }
                    
                    .final-score {
                        font-size: 3rem;
                        font-weight: bold;
                        margin: 20px 0;
                        background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                    }
                    
                    @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                        100% { transform: scale(1); }
                    }
                    
                    .pulse {
                        animation: pulse 0.5s ease-in-out;
                    }
                </style>
            </head>
            <body>
                <div class="quiz-container">
                    <h1 id="heading">Welcome to the Quiz!</h1>
                    <button id="play-btn">Start Quiz</button>
                    <div id="score" style="display: none;">Score: <span class="score-value">0</span></div>
                    <div id="meter" style="display: none;">
                        <div id="time-left"></div>
                    </div>
                    <div id="quiz-container" style="display: none;"></div>
                    <button id="replay-btn" onclick="replayQuiz()" style="display: none;">Play Again</button>
                </div>
                <script>
                    let currentQuestionIndex = 0;
                    let questions = [];
                    let score = 0;
                    let timePerQuestion = 25;
                    let timeLeft;
                    let interval;
                    let triedsxchv = ${localStorage.getItem("musexet")} || 60;
                    const currentDate = new Date().setHours(0, 0, 0, 0);

                    if (!isNaN(triedsxchv)) {
                        triedsxchv = Number(triedsxchv);
                    } else if (triedsxchv == currentDate) {
                        triedsxchv = 0;
                    } else if (triedsxchv < currentDate) {
                        triedsxchv = 60;
                        localStorage.setItem("musexet", currentDate);
                    }

                    function fetchQuestions() {
                        triedsxchv -= 10;
                        fetch('https://quizapi.io/api/v1/questions?apiKey=${fxc}&limit=10')
                            .then(response => response.json())
                            .then(data => {
                                questions = data.map(question => ({
                                    question: question.question,
                                    options: Object.values(question.answers).filter(answer => answer !== null),
                                    correctAnswerIndex: Object.values(question.correct_answers).indexOf("true")
                                })).filter(q => q.options.length >= 2);
                                
                                displayQuestion();
                            })
                            .catch(error => {
                                console.error('Error fetching questions:', error);
                                document.getElementById('heading').innerHTML = 'Error loading questions. Please try again.';
                            });
                    }

                    function displayQuestion() {
                        const quizContainer = document.getElementById('quiz-container');
                        const scoreDisplay = document.getElementById('score');
                        const meterDisplay = document.getElementById('meter');

                        scoreDisplay.querySelector('.score-value').textContent = score;

                        if (currentQuestionIndex < questions.length) {
                            const question = questions[currentQuestionIndex];
                            quizContainer.innerHTML = \`
                                <div class="question">\${question.question}</div>
                                <div class="options">
                                    \${question.options.map((option, index) => \`
                                        <button class="option-btn" onclick="checkAnswer(\${index})">\${option}</button>
                                    \`).join('')}
                                </div>
                            \`;
                            timeLeft = timePerQuestion;
                            meterDisplay.style.display = 'block';
                            scoreDisplay.style.display = 'block';
                            quizContainer.style.display = 'block';
                            startColorTransition();
                        } else {
                            endQuiz();
                        }
                    }

                    function calculateColor(percentage) {
                        percentage = Math.max(0, Math.min(100, percentage));
                        let color;

                        if (percentage >= 66) {
                            const fraction = (100 - percentage) / 34;
                            const yellowValue = Math.round(255 * fraction);
                            color = \`rgb(\${yellowValue}, 255, 0)\`;
                        } else if (percentage >= 33) {
                            const fraction = (66 - percentage) / 33;
                            const greenValue = 165 + Math.round(90 * (1 - fraction));
                            color = \`rgb(255, \${greenValue}, 0)\`;
                        } else {
                            const fraction = (33 - percentage) / 33;
                            const greenValue = Math.round(165 * (1 - fraction));
                            color = \`rgb(255, \${greenValue}, 0)\`;
                        }
                        return color;
                    }

                    function startColorTransition() {
                        let qno = currentQuestionIndex + 1;
                        document.getElementById('heading').innerHTML = 'Question ' + qno + ' of 10';
                        const timeLeftDisplay = document.getElementById('time-left');
                        timeLeft = timePerQuestion;
                        timeLeftDisplay.style.width = '100%';
                        timeLeftDisplay.style.backgroundColor = calculateColor(100);

                        clearInterval(interval);
                        const endTime = Date.now() + (timePerQuestion * 1000);
                        interval = setInterval(() => {
                            timeLeft = Math.max(0, (endTime - Date.now()) / 1000);
                            const percentage = (timeLeft / timePerQuestion) * 100;

                            timeLeftDisplay.style.width = \`\${percentage}%\`;
                            timeLeftDisplay.style.backgroundColor = calculateColor(percentage);

                            if (timeLeft <= 0) {
                                clearInterval(interval);
                                checkAnswer(-1);
                            }
                        }, 50);
                    }
                    
                    function checkAnswer(selectedIndex) {
                        clearInterval(interval);
                        const question = questions[currentQuestionIndex];
                        const buttons = document.querySelectorAll('.option-btn');

                        buttons.forEach((button, index) => {
                            if (index === question.correctAnswerIndex) {
                                button.classList.add('correct');
                            } else if (index === selectedIndex) {
                                button.classList.add('wrong');
                            }
                            button.disabled = true;
                        });

                        let timeScore = 0;
                        const percentageLeft = (timeLeft / timePerQuestion);
                        if (percentageLeft > 0.75) timeScore = 5;
                        else if (percentageLeft > 0.5) timeScore = 4;
                        else if (percentageLeft > 0.25) timeScore = 3;
                        else if (percentageLeft > 0) timeScore = 2;
                        else timeScore = 1;

                        if (selectedIndex === question.correctAnswerIndex) {
                            score += timeScore;
                            document.querySelector('.score-value').classList.add('pulse');
                            setTimeout(() => {
                                document.querySelector('.score-value').classList.remove('pulse');
                            }, 500);
                        }

                        currentQuestionIndex++;
                        setTimeout(displayQuestion, 1500);
                    }

                    function endQuiz() {
                        document.getElementById('meter').style.display = 'none';
                        clearInterval(interval);
                        const currentDate = new Date().setHours(0, 0, 0, 0);
                        
                        if(triedsxchv <= 0){
                            document.getElementById('heading').innerHTML = 'Daily Limit Reached - Come Back Tomorrow!';
                            document.getElementById('quiz-container').innerHTML = '';
                            localStorage.setItem("musexet", currentDate);
                        } else {
                            document.getElementById('quiz-container').innerHTML = \`
                                <div class="result-screen">
                                    <h2>Quiz Completed!</h2>
                                    <div class="final-score">\${score}/50</div>
                                    <p>Great job! You've completed the quiz.</p>
                                </div>
                            \`;
                            document.getElementById('replay-btn').style.display = 'block';
                            localStorage.setItem("musexet", triedsxchv);
                        }
                    }

                    function replayQuiz() {
                        if(triedsxchv <= 0) return;
                        
                        currentQuestionIndex = 0;
                        score = 0;
                        document.getElementById('replay-btn').style.display = 'none';
                        document.getElementById('quiz-container').style.display = 'none';
                        document.getElementById('score').style.display = 'none';
                        document.getElementById('meter').style.display = 'none';
                        document.getElementById('heading').style.display = 'block';
                        fetchQuestions();
                    }

                    document.getElementById('play-btn').onclick = function() {
                        this.style.display = 'none';
                        fetchQuestions();
                    };
                </script>
            </body>
            </html>
        `)
    };
    
    data.push(quizContent);
    const productivityContainer = document.getElementById('productivity');
    productivityContainer.innerHTML = '';

    const mainContainer = document.createElement('div');
    Object.assign(mainContainer.style, {
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        borderRadius: '15px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        height: '80vh', 
        minHeight: '900px', 
        maxHeight: '1200px',
        display: 'flex',
        flexDirection: 'column',
        resize: 'vertical',
        overflow: 'hidden'
    });

    const tabsContainer = document.createElement('div');
    Object.assign(tabsContainer.style, {
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        flexShrink: '0'
    });

    const contentContainer = document.createElement('div');
    Object.assign(contentContainer.style, {
        padding: '30px',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        flexGrow: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'auto',
        minHeight: '400px'
    });

    function updateContent(item, clickedButton) {
        contentContainer.innerHTML = '';

        const contentTitle = document.createElement('h2');
        contentTitle.textContent = item.title;
        Object.assign(contentTitle.style, {
            fontSize: '2.2rem',
            fontWeight: '700',
            marginBottom: '15px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center'
        });
        contentContainer.appendChild(contentTitle);

        const contentDescription = document.createElement('p');
        contentDescription.textContent = item.description;
        Object.assign(contentDescription.style, {
            fontSize: '1.1rem',
            color: '#666',
            marginBottom: '30px',
            textAlign: 'center'
        });
        contentContainer.appendChild(contentDescription);

        const spinner = document.createElement('div');
        Object.assign(spinner.style, {
            border: '4px solid rgba(102, 126, 234, 0.2)',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            animation: 'spin 1.5s linear infinite',
            margin: '30px auto',
            display: 'block'
        });
        contentContainer.appendChild(spinner);

        const iframe = document.createElement('iframe');
        Object.assign(iframe.style, {
            width: '100%',
            height: '100%',
            display: 'none',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            flexGrow: '1'
        });
        iframe.src = item.src;
        contentContainer.appendChild(iframe);

        showSpinner(iframe);
        iframe.onload = () => hideSpinner(iframe);

        const allTabButtons = tabsContainer.querySelectorAll('button');
        allTabButtons.forEach(btn => {
            btn.style.background = 'rgba(255, 255, 255, 0.2)';
            btn.style.color = '#fff';
            btn.style.boxShadow = 'none';
        });

        clickedButton.style.background = 'rgba(255, 255, 255, 0.4)';
        clickedButton.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
    }

    data.forEach(item => {
        const tabButton = document.createElement('button');
        tabButton.textContent = item.title;
        Object.assign(tabButton.style, {
            padding: '12px 25px',
            cursor: 'pointer',
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '25px',
            color: '#fff',
            fontWeight: '600',
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
        });

        tabButton.addEventListener('mouseenter', () => {
            tabButton.style.background = 'rgba(255, 255, 255, 0.3)';
            tabButton.style.transform = 'translateY(-2px)';
        });

        tabButton.addEventListener('mouseleave', () => {
            if (!tabButton.classList.contains('active')) {
                tabButton.style.background = 'rgba(255, 255, 255, 0.2)';
                tabButton.style.transform = 'translateY(0)';
            }
        });

        tabButton.addEventListener('click', () => {
            updateContent(item, tabButton);
            tabButton.classList.add('active');
        });

        tabsContainer.appendChild(tabButton);
    });

    mainContainer.appendChild(tabsContainer);
    mainContainer.appendChild(contentContainer);
    productivityContainer.appendChild(mainContainer);

    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        #productivity > div {
            resize: vertical;
            overflow: auto;
        }
        
        #productivity > div::-webkit-resizer {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            width: 20px;
            height: 20px;
        }
    `;
    document.head.appendChild(style);

    updateContent(data[0], tabsContainer.querySelector('button'));
    tabsContainer.querySelector('button').classList.add('active');
}
