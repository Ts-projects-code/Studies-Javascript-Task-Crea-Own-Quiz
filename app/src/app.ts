interface QuizQuestion {
    questionText: string;
    answerType: "text" | "radio" | "checkbox";
    answerOptions?: string[];
    correctAnswer?: string | string[];
}

interface Quiz {
    quizTitle: string;
    questions: QuizQuestion[];
    createdDate: Date;
}

interface QuizResult {
    totalQuestions: number;
    correctAnswers: number;
    questionResults: {
        question: string;
        userAnswer: string | string[];
        correctAnswer: string | string[];
        isCorrect: boolean;
    }[];
}

let userQuizzes: Quiz[] = JSON.parse(localStorage.getItem("userQuizzes") || "[]");

// Load existing quizzes on page load
window.onload = displayQuizList;


function startQuiz(): void {
    // Clear previous errors
    document.getElementById("firstNameError")!.classList.add("hidden");
    document.getElementById("lastNameError")!.classList.add("hidden");
    document.getElementById("emailError")!.classList.add("hidden");

    let valid = true;

    // Validate first name
    const firstName = (document.getElementById("firstName") as HTMLInputElement).value;
    if (!/^[A-Za-z]+$/.test(firstName)) {
        document.getElementById("firstNameError")!.classList.remove("hidden");
        valid = false;
    }

    // Validate last name
    const lastName = (document.getElementById("lastName") as HTMLInputElement).value;
    if (!/^[A-Za-z]+$/.test(lastName)) {
        document.getElementById("lastNameError")!.classList.remove("hidden");
        valid = false;
    }

    // Validate email
    const email = (document.getElementById("email") as HTMLInputElement).value;
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailPattern.test(email)) {
        document.getElementById("emailError")!.classList.remove("hidden");
        valid = false;
    }
//This is paused to test the quiz directely

// If validation fails, show an alert and return
    if (!valid) {
        alert("Please correct the highlighted errors.");
        return;
    }

    // If all validations pass, proceed with the quiz
    document.getElementById("userNameDisplay")!.innerText = `${firstName} ${lastName}`;
    document.getElementById("user-info")!.style.display = "none";
    document.getElementById("quiz-container")!.style.display = "block";

    loadQuizQuestions();
}


function addQuestion(): void {
    const container = document.getElementById("questions-container")!;
    const questionDiv = document.createElement("div");
    questionDiv.className = "question bg-gray-50 p-4 rounded-lg border border-gray-200";

    questionDiv.innerHTML = `
        <div class="space-y-4">
            <input type="text" placeholder="Question Text" class="w-full p-3 border border-gray-300 rounded-lg bg-cyan-600 text-white placeholder-gray-200">
            <select class="w-full p-3 border border-gray-300 rounded-lg">
                <option value="text">Text Answer</option>
                <option value="radio">Single Choice</option>
                <option value="checkbox">Multiple Choice</option>
            </select>
            <div class="options-container hidden space-y-2">
                <div class="options-list space-y-2"></div>
                <button onclick="addOption(this)" class="text-white hover:text-gray-800">+ Add Option</button>
            </div>
            <div class="correct-answer-container hidden">
                <label class="block text-sm font-medium text-gray-700 mb-1">Correct Answer:</label>
                <select class="correct-answer w-full p-3 border border-gray-300 rounded-lg"></select>
            </div>
            <div class="bg-red-700 ml-2" style="margin: 1rem 0 1rem 1.5rem;">
                <button onclick="removeQuestion(this)" class="text-red-600 hover:text-red-800 px-4 py-3 m-1 rounded-lg hover:bg-gray-700 transition duration-200 border border-white" style="color: white; background-color: rgba(163, 17, 17, 0.23);">Remove Question</button>
            </div>
        </div>
    `;

    const selectElement = questionDiv.querySelector('select') as HTMLSelectElement;
    selectElement.addEventListener('change', function (this: HTMLSelectElement) {
        const optionsContainer = this.parentElement?.querySelector('.options-container') as HTMLElement;
        const correctAnswerContainer = this.parentElement?.querySelector('.correct-answer-container') as HTMLElement;

        if (this.value === 'radio' || this.value === 'checkbox') {
            optionsContainer.classList.remove('hidden');
            correctAnswerContainer.classList.remove('hidden');
        } else {
            optionsContainer.classList.add('hidden');
            correctAnswerContainer.classList.add('hidden');
        }
    });

    container.appendChild(questionDiv);
}

function addOption(button: HTMLButtonElement): void {
    const optionsList = button.parentElement?.querySelector('.options-list') as HTMLElement;
    const optionDiv = document.createElement('div');
    optionDiv.className = 'flex gap-2';

    optionDiv.innerHTML = `
        <input type="text" placeholder="Option" class="flex-1 p-2 border border-gray-300 rounded-lg">
        <button onclick="removeOption(this)" class="text-red-600 hover:text-red-800">Remove</button>
    `;

    optionsList.appendChild(optionDiv);
    updateCorrectAnswerDropdown(button.closest('.question') as HTMLElement);
}

function removeOption(button: HTMLButtonElement): void {
    const optionDiv = button.parentElement;
    const question = optionDiv?.closest('.question') as HTMLElement;
    optionDiv?.remove();
    updateCorrectAnswerDropdown(question);
}

function updateCorrectAnswerDropdown(questionDiv: HTMLElement): void {
    const options = Array.from(questionDiv.querySelectorAll('.options-list input[type="text"]'))
        .map(input => (input as HTMLInputElement).value)
        .filter(value => value.trim() !== '');

    const correctAnswerSelect = questionDiv.querySelector('.correct-answer') as HTMLSelectElement;
    correctAnswerSelect.innerHTML = options
        .map((option, index) => `<option value="${index}">${option}</option>`)
        .join('');
}

function removeQuestion(button: HTMLButtonElement): void {
    button.closest('.question')?.remove();
}

function saveQuiz(): void {
    const quizTitle = (document.getElementById("quizTitle") as HTMLInputElement).value;
    if (!quizTitle.trim()) {
        alert("Please enter a quiz title");
        return;
    }

    const questions: QuizQuestion[] = Array.from(document.querySelectorAll(".question")).map(el => {
        const questionText = (el.querySelector("input[type='text']") as HTMLInputElement).value;
        const answerType = (el.querySelector("select") as HTMLSelectElement).value as "text" | "radio" | "checkbox";
        const options = Array.from(el.querySelectorAll(".options-list input[type='text']"))
            .map(input => (input as HTMLInputElement).value)
            .filter(value => value.trim() !== '');
        const correctAnswer = (el.querySelector(".correct-answer") as HTMLSelectElement)?.value;

        return {
            questionText,
            answerType,
            answerOptions: options.length > 0 ? options : undefined,
            correctAnswer: correctAnswer ? correctAnswer : undefined
        };
    });

    if (questions.length === 0) {
        alert("Please add at least one question");
        return;
    }

    const newQuiz: Quiz = {
        quizTitle,
        questions,
        createdDate: new Date(),
    };

    userQuizzes.push(newQuiz);
    localStorage.setItem("userQuizzes", JSON.stringify(userQuizzes));
    displayQuizList();

    // Reset form
    (document.getElementById("quizTitle") as HTMLInputElement).value = "";
    document.getElementById("questions-container")!.innerHTML = "";
}

//                        <input type="${q.answerType}" name="q${index}" value="${optIndex}"
function loadQuizQuestions(quiz?: Quiz): void {
    const quizCards = document.getElementById("quiz-cards")!;
    quizCards.innerHTML = "";

    const questions = quiz?.questions || [
        {questionText: "What is 2+2?", answerType: "radio", answerOptions: ["3", "4", "5"], correctAnswer: "4"},
        {
            questionText: "Select prime numbers",
            answerType: "checkbox",
            answerOptions: ["2", "3", "4"],
            correctAnswer: ["2", "3"]
        },
        {questionText: "Explain the concept of gravity as if I was 3 years old", answerType: "text"},
        {questionText: "What is 5+2?", answerType: "radio", answerOptions: ["7", "3", "5"], correctAnswer: "7"},
        {
            questionText: "Select prime numbers",
            answerType: "checkbox",
            answerOptions: ["5", "7", "11"],
            correctAnswer: ["5", "11"]
        },
    ];

    questions.forEach((q, index) => {
        const card = document.createElement("div");
        card.className = "quiz-card bg-gray-50 p-6 rounded-lg border border-gray-200 mb-4";
        card.setAttribute('data-question-type', q.answerType);
        if (q.correctAnswer) {
            card.setAttribute('data-correct-answer', Array.isArray(q.correctAnswer) ?
                JSON.stringify(q.correctAnswer) : q.correctAnswer);
        }


        let questionHtml = `<p class="font-medium mb-2" style="margin: 1rem;">${index + 1}. ${q.questionText}</p>`;

        if (q.answerType === "radio" || q.answerType === "checkbox") {
            questionHtml += `<div class="space-y-2">`;
            q.answerOptions?.forEach((option, optIndex) => {
                questionHtml += `
                    <label class="flex items-center space-x-2" style="margin-bottom: 1.5rem;">
                        <input type="${q.answerType}" name="q${index}" value="${option}"
                               class="form-${q.answerType} h-4 w-4 text-blue-600 mt-auto mb-auto" style="margin-top: auto; margin-bottom: auto; margin-left: 1rem;">
                        <span class="ml-2" style="margin-left: 1rem;">${option}</span>
                    </label>`;
            });
            questionHtml += `</div>`;
        } else {
            questionHtml += `
                <textarea id="textvalidate" name="q${index}"
                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2" style="margin: 1rem;"
                    rows="3"></textarea>`;
        }

        // Add a hidden results div for each question
        questionHtml += `
            <div class="result-feedback hidden mt-4 p-4 rounded-lg">
            </div>
        `;
        card.innerHTML = questionHtml;
        quizCards.appendChild(card);
    });
}

function calculateQuizResults(): QuizResult {
    const quizCards = document.querySelectorAll(".quiz-card");
    let correctAnswers = 0;
    const questionResults: QuizResult['questionResults'] = [];

    quizCards.forEach((card, index) => {
        const questionType = card.getAttribute('data-question-type');
        const correctAnswer = card.getAttribute('data-correct-answer');
        const questionText = card.querySelector('p')?.textContent?.slice(3) || '';
        let userAnswer: string | string[] = '';
        let isCorrect = false;

        if (questionType === 'radio') {
            const selectedInput = card.querySelector('input:checked') as HTMLInputElement;
            if (selectedInput) {
                userAnswer = selectedInput.value;
                isCorrect = userAnswer === correctAnswer;
            }
        } else if (questionType === 'checkbox') {
            const selectedInputs = card.querySelectorAll('input:checked') as NodeListOf<HTMLInputElement>;
            userAnswer = Array.from(selectedInputs).map(input => input.value);
            const correctAnswerArray = JSON.parse(correctAnswer || '[]');
            isCorrect = userAnswer.length === correctAnswerArray.length &&
                userAnswer.every(value => correctAnswerArray.includes(value));
        } else if (questionType === 'text') {
            const textArea = card.querySelector('textarea') as HTMLTextAreaElement;
            userAnswer = textArea.value;
            //When validating or reviewing text answers, one can do a simple check if the answer contains key phrases, this depends on what every developer or designer wished to add.
            isCorrect = userAnswer.toLowerCase().includes((correctAnswer || '').toLowerCase());
        }

        if (isCorrect) {
            correctAnswers++;
        }

        questionResults.push({
            question: questionText,
            userAnswer,
            correctAnswer: questionType === 'checkbox' ? JSON.parse(correctAnswer || '[]') : (correctAnswer || ''),
            isCorrect
        });
    });

    return {
        totalQuestions: quizCards.length,
        correctAnswers,
        questionResults
    };
}


function displayQuizResults(results: QuizResult): void {
    // Create results container
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'bg-white p-6 rounded-lg shadow-lg mt-8';

    // Add score summary
    resultsContainer.innerHTML = `
        <h2 class="text-2xl font-bold mb-4">Quiz Results</h2>
        <div class="text-lg mb-6">
            Score: ${results.correctAnswers} out of ${results.totalQuestions}
            (${Math.round((results.correctAnswers / results.totalQuestions) * 100)}%)
        </div>
        <div class="space-y-4">
            ${results.questionResults.map((result, index) => `
                <div class="p-4 rounded-lg ${result.isCorrect ? 'bg-green-100' : 'bg-red-100'}">
                    <p class="font-medium">${index + 1}. ${result.question}</p>
                    <p class="mt-2">Your answer: ${Array.isArray(result.userAnswer) ?
        result.userAnswer.join(', ') : result.userAnswer}</p>
                    <p class="mt-1">Correct answer: ${Array.isArray(result.correctAnswer) ?
        result.correctAnswer.join(', ') : result.correctAnswer}</p>
                </div>
            `).join('')}
        </div>
    `;

    // Add a button to retry the quiz
    const retryButton = document.createElement('button');
    retryButton.className = 'mt-6 w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition duration-200';
    retryButton.textContent = 'Try Another Quiz';
    retryButton.onclick = () => {
        document.getElementById("quiz-container")!.style.display = "none";
        document.getElementById("user-info")!.style.display = "block";
        resultsContainer.remove();
    };
    resultsContainer.appendChild(retryButton);

    // Add the results to the page
    document.getElementById("quiz-container")!.appendChild(resultsContainer);
}


function displayQuizList(): void {
    const quizListContainer = document.getElementById("quizListContainer")!;
    quizListContainer.innerHTML = "";

    userQuizzes.forEach((quiz, index) => {
        const quizDiv = document.createElement("div");
        quizDiv.className = "quiz bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center";

        quizDiv.innerHTML = `
            <div>
                <h3 class="font-medium">${quiz.quizTitle}</h3>
                <p class="text-sm text-gray-500">Created: ${new Date(quiz.createdDate).toLocaleDateString()}</p>
            </div>
            <div class="space-x-2">
                <button onclick="loadQuiz(${index})"
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Start</button>
                <button onclick="deleteQuiz(${index})"
                    class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
        `;

        quizListContainer.appendChild(quizDiv);
    });
}

function loadQuiz(index: number): void {
    const quiz = userQuizzes[index];
    document.getElementById("user-info")!.style.display = "none";
    document.getElementById("quiz-container")!.style.display = "block";
    loadQuizQuestions(quiz);
}

function deleteQuiz(index: number): void {
    if (confirm("Are you sure you want to delete this quiz?")) {
        userQuizzes.splice(index, 1);
        localStorage.setItem("userQuizzes", JSON.stringify(userQuizzes));
        displayQuizList();
    }
}

function submitQuiz(): void {
    const questions = Array.from(document.querySelectorAll(".quiz-card"));
    let answeredQuestions = 0;

    /*    questions.forEach((card, index) => {
            const answerType = card.querySelector("input[type='radio']") ? "radio" : "checkbox";
            const answerTypeText = (document.getElementById("textvalidate") as HTMLInputElement).value;

            if (answerType === "radio") {
                const isChecked = Array.from(card.querySelectorAll("input[type='radio']"))
                    .some((input) => (input as HTMLInputElement).checked);
                if (isChecked) {
                    answeredQuestions++;
                }
            } else if (answerType === "checkbox") {
                const isChecked = Array.from(card.querySelectorAll("input[type='checkbox']"))
                    .some((input) => (input as HTMLInputElement).checked);
                if (isChecked) {
                    answeredQuestions++;
                }
            }
            if (answerTypeText){
                answeredQuestions++;
            }
        });*/

    questions.forEach((card) => {
        const questionType = card.getAttribute('data-question-type');

        if (questionType === 'radio' || questionType === 'checkbox') {
            const isAnswered = card.querySelector('input:checked') !== null;
            if (isAnswered) answeredQuestions++;
        } else if (questionType === 'text') {
            const textArea = card.querySelector('textarea') as HTMLTextAreaElement;
            if (textArea.value.trim()) answeredQuestions++;
        }
    });

    if (answeredQuestions < 2) {
        alert("Please answer at least two questions before submitting the quiz.");
        return;
    }

    const results = calculateQuizResults();
    displayQuizResults(results);

//    alert("Quiz submitted successfully!");
//    document.getElementById("quiz-container")!.style.display = "none";
//    document.getElementById("user-info")!.style.display = "block";

    document.querySelector("#quiz-cards")!.classList.add("hidden");
    document.querySelector("button[onclick='submitQuiz()']")!.classList.add("hidden");
}

