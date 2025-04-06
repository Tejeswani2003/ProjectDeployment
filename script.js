// Database simulation (in a real app, this would be replaced with a backend API)
const db = {
    users: [
        { id: 1, name: "Student User", email: "student@example.com", password: "password123", role: "student" }
    ],
    quizzes: [
        {
            id: 1,
            title: "Cloud Computing Quiz",
            description: "Test your knowledge of cloud computing fundamentals",
            createdBy: 1,
            createdAt: new Date(),
            questions: [
                {
                    id: 1,
                    text: "What is cloud computing?",
                    options: ["A type of hardware", "Internet-based computing", "A programming language", "A networking protocol"],
                    correctAnswer: 1
                },
                {
                    id: 2,
                    text: "Which of the following is a cloud service model?",
                    options: ["PaaS", "SaaS", "IaaS", "All of the above"],
                    correctAnswer: 3
                },
                {
                    id: 3,
                    text: "Which company provides AWS cloud services?",
                    options: ["Google", "Amazon", "Microsoft", "IBM"],
                    correctAnswer: 1
                },
                {
                    id: 4,
                    text: "What does SaaS stand for?",
                    options: ["Software as a Service", "System as a Service", "Storage as a Service", "None of the above"],
                    correctAnswer: 0
                },
                {
                    id: 5,
                    text: "Which of the following is a key characteristic of cloud computing?",
                    options: ["Scalability", "Limited access", "Fixed resources", "Local hosting"],
                    correctAnswer: 0
                },
                {
                    id: 6,
                    text: "What is the primary purpose of virtualization in cloud computing?",
                    options: ["Reduce hardware cost", "Improve performance", "Enhance security", "Provide cloud storage"],
                    correctAnswer: 0
                },
                {
                    id: 7,
                    text: "Which cloud deployment model is used exclusively by a single organization?",
                    options: ["Public cloud", "Private cloud", "Hybrid cloud", "Community cloud"],
                    correctAnswer: 1
                }
            ]
        }
    ],
    results: []
};

// App State
let currentUser = null;
let currentQuiz = null;
let currentResults = null;
let timerInterval = null;
let questionTimerInterval = null;
let currentQuestionIndex = 0;
let questionTimeLeft = 10;
let countdownInterval = null;
let userAnswers = {}; // Object to store user answers by question ID

// DOM Elements
const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const quizStartView = document.getElementById('quiz-start-view');
const takeQuizView = document.getElementById('take-quiz-view');
const resultsView = document.getElementById('results-view');

// Initialize the app
function init() {
    const savedUser = localStorage.getItem('quizUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    } else {
        showAuthView();
    }
}

// View Navigation Functions
function showAuthView() {
    hideAllViews();
    authView.style.display = 'block';
}

function showDashboard() {
    hideAllViews();
    dashboardView.style.display = 'block';
    document.getElementById('user-name').textContent = currentUser.name;
    loadStudentQuizzes();
    loadStudentResults();
}

function showQuizStart(quizId) {
    hideAllViews();
    quizStartView.style.display = 'block';
    
    currentQuiz = db.quizzes.find(q => q.id === quizId);
    userAnswers = {}; // Reset answers when starting new quiz
    document.getElementById('countdown-timer').textContent = '5';
    document.getElementById('countdown-text').textContent = '5';
    
    let countdown = 5;
    countdownInterval = setInterval(() => {
        countdown--;
        document.getElementById('countdown-timer').textContent = countdown;
        document.getElementById('countdown-text').textContent = countdown;
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            showTakeQuiz();
        }
    }, 1000);
}

function showTakeQuiz() {
    hideAllViews();
    takeQuizView.style.display = 'block';
    
    currentQuestionIndex = 0;
    document.getElementById('quiz-taking-title').textContent = currentQuiz.title;
    
    loadQuestion(currentQuestionIndex);
}

function showResultsConfirmation() {
    hideAllViews();
    resultsView.style.display = 'block';
    document.getElementById('results-confirmation').style.display = 'block';
    document.getElementById('results-details').style.display = 'none';
}

function showResultsDetails() {
    document.getElementById('results-confirmation').style.display = 'none';
    const detailsContainer = document.getElementById('results-details');
    detailsContainer.style.display = 'block';
    
    document.getElementById('results-quiz-title').textContent = currentQuiz.title;
    
    // Calculate score
    let correctCount = 0;
    currentQuiz.questions.forEach(question => {
        if (userAnswers[question.id] !== undefined && 
            userAnswers[question.id] === question.correctAnswer) {
            correctCount++;
        }
    });
    
    const score = Math.round((correctCount / currentQuiz.questions.length) * 100);
    document.getElementById('results-score').textContent = `${score}%`;
    
    let feedback = '';
    if (score >= 80) {
        feedback = 'Excellent performance!';
    } else if (score >= 50) {
        feedback = 'Good job! Keep improving.';
    } else {
        feedback = 'Need more practice. Better luck next time.';
    }
    document.getElementById('results-feedback').textContent = feedback;
    
    const questionsContainer = document.getElementById('results-questions-container');
    questionsContainer.innerHTML = '';
    
    currentQuiz.questions.forEach((question, qIndex) => {
        const userAnswer = userAnswers[question.id];
        const isCorrect = userAnswer === question.correctAnswer;
        
        const questionEl = document.createElement('div');
        questionEl.className = `result-item ${isCorrect ? 'correct' : 'incorrect'}`;
        questionEl.innerHTML = `
            <h3>Question ${qIndex + 1}: ${question.text}</h3>
            <p>Your answer: ${userAnswer !== undefined ? question.options[userAnswer] : 'No answer'}</p>
            <p>Correct answer: ${question.options[question.correctAnswer]}</p>
            ${isCorrect ? 
                '<p class="correct-feedback">✓ Correct</p>' : 
                '<p class="incorrect-feedback">✗ Incorrect</p>'}
        `;
        
        questionsContainer.appendChild(questionEl);
    });
    
    // Save results to database
    const answersArray = currentQuiz.questions.map(question => ({
        questionId: question.id,
        optionIndex: userAnswers[question.id] !== undefined ? userAnswers[question.id] : -1
    }));
    
    const newResult = {
        id: db.results.length + 1,
        quizId: currentQuiz.id,
        userId: currentUser.id,
        date: new Date(),
        score,
        answers: answersArray
    };
    
    db.results.push(newResult);
    currentResults = newResult;
}

function hideAllViews() {
    authView.style.display = 'none';
    dashboardView.style.display = 'none';
    quizStartView.style.display = 'none';
    takeQuizView.style.display = 'none';
    resultsView.style.display = 'none';
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (questionTimerInterval) {
        clearInterval(questionTimerInterval);
        questionTimerInterval = null;
    }
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

// Auth Functions
function switchAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'none';
    
    if (tab === 'login') {
        document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
        document.getElementById('login-form').style.display = 'flex';
    } else {
        document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
        document.getElementById('signup-form').style.display = 'flex';
    }
}

function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const user = db.users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('quizUser', JSON.stringify(user));
        showDashboard();
    } else {
        alert('Invalid email or password');
    }
}

function signup() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    if (db.users.some(u => u.email === email)) {
        alert('Email already in use');
        return;
    }
    
    const newUser = {
        id: db.users.length + 1,
        name,
        email,
        password,
        role: 'student'
    };
    
    db.users.push(newUser);
    currentUser = newUser;
    localStorage.setItem('quizUser', JSON.stringify(newUser));
    showDashboard();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('quizUser');
    showAuthView();
}

// Quiz Functions
function loadStudentQuizzes() {
    const container = document.getElementById('student-quizzes');
    container.innerHTML = '';
    
    if (db.quizzes.length === 0) {
        container.innerHTML = '<p>No quizzes available at the moment.</p>';
        return;
    }
    
    db.quizzes.forEach(quiz => {
        const taken = db.results.some(r => r.quizId === quiz.id && r.userId === currentUser.id);
        
        const quizEl = document.createElement('div');
        quizEl.className = 'quiz-card';
        quizEl.innerHTML = `
            <h3>${quiz.title}</h3>
            <p>${quiz.description}</p>
            <p>Questions: ${quiz.questions.length}</p>
            ${taken ? 
                '<button disabled>Already Taken</button>' : 
                `<button onclick="showQuizStart(${quiz.id})">Take Quiz</button>`}
        `;
        container.appendChild(quizEl);
    });
}

function loadStudentResults() {
    const container = document.getElementById('student-results');
    container.innerHTML = '';
    
    const studentResults = db.results.filter(r => r.userId === currentUser.id);
    
    if (studentResults.length === 0) {
        container.innerHTML = '<p>You haven\'t taken any quizzes yet.</p>';
        return;
    }
    
    studentResults.forEach(result => {
        const quiz = db.quizzes.find(q => q.id === result.quizId);
        
        const resultEl = document.createElement('div');
        resultEl.className = 'result-card';
        resultEl.innerHTML = `
            <h3>${quiz.title}</h3>
            <p>Score: ${result.score}%</p>
            <p>Date: ${new Date(result.date).toLocaleDateString()}</p>
            <button onclick="viewQuizResults(${quiz.id}, ${result.id})">View Details</button>
        `;
        container.appendChild(resultEl);
    });
}

function viewQuizResults(quizId, resultId) {
    currentQuiz = db.quizzes.find(q => q.id === quizId);
    currentResults = db.results.find(r => r.id === resultId);
    
    // Convert answers array to object format
    userAnswers = {};
    currentResults.answers.forEach(answer => {
        userAnswers[answer.questionId] = answer.optionIndex;
    });
    
    showResultsDetails();
}

function loadQuestion(index) {
    if (questionTimerInterval) {
        clearInterval(questionTimerInterval);
    }
    
    const container = document.getElementById('quiz-questions-container');
    container.innerHTML = '';
    
    if (index >= currentQuiz.questions.length) {
        // Show submit button for final submission
        const submitBtn = document.querySelector('#take-quiz-view button.primary');
        submitBtn.style.display = 'block';
        submitBtn.textContent = 'Submit Quiz';
        return;
    }
    
    const question = currentQuiz.questions[index];
    questionTimeLeft = 10;
    updateTimerDisplay(questionTimeLeft);
    
    questionTimerInterval = setInterval(() => {
        questionTimeLeft--;
        updateTimerDisplay(questionTimeLeft);
        
        if (questionTimeLeft <= 0) {
            clearInterval(questionTimerInterval);
            currentQuestionIndex++;
            loadQuestion(currentQuestionIndex);
        }
    }, 1000);
    
    const questionEl = document.createElement('div');
    questionEl.className = 'quiz-question';
    questionEl.innerHTML = `
        <h3>${index + 1}. ${question.text}</h3>
        <div class="options-container" id="options-${question.id}"></div>
    `;
    
    const optionsContainer = questionEl.querySelector(`#options-${question.id}`);
    
    question.options.forEach((option, oIndex) => {
        const optionEl = document.createElement('div');
        optionEl.className = 'quiz-option';
        optionEl.textContent = option;
        optionEl.dataset.questionId = question.id;
        optionEl.dataset.optionIndex = oIndex;
        
        // Check if this option was previously selected
        if (userAnswers[question.id] === oIndex) {
            optionEl.classList.add('selected');
        }
        
        optionEl.onclick = function() {
            selectOption(this);
        };
        optionsContainer.appendChild(optionEl);
    });
    
    container.appendChild(questionEl);
}

function selectOption(optionEl) {
    const questionId = parseInt(optionEl.dataset.questionId);
    const optionIndex = parseInt(optionEl.dataset.optionIndex);
    
    // Update selected state
    const options = document.querySelectorAll(`.quiz-option[data-question-id="${questionId}"]`);
    options.forEach(opt => {
        opt.classList.remove('selected');
    });
    optionEl.classList.add('selected');
    
    // Record answer
    userAnswers[questionId] = optionIndex;
    
    // Move to next question after a brief delay
    setTimeout(() => {
        currentQuestionIndex++;
        loadQuestion(currentQuestionIndex);
    }, 500);
}

function submitQuiz() {
    if (questionTimerInterval) {
        clearInterval(questionTimerInterval);
        questionTimerInterval = null;
    }
    
    showResultsConfirmation();
}

function updateTimerDisplay(seconds) {
    document.getElementById('quiz-timer').textContent = `Time left: ${seconds}s`;
}

window.onload = init;