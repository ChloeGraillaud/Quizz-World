/* Pour fonctionner le site avait besoin d'un serveur http local ;
- cmd dans windows pour ouvrir la console
- cd \chemin\du\dossier\en\question
- http server
- copier l'id, coller dans le navigateur */


let currentQuestionIndex = 0;
let quizData = {};
let score = 0;

document.addEventListener('DOMContentLoaded', function() {
    const radioButtons = document.querySelectorAll('.form-check-input[type="radio"]');
    const initialContent = document.body.innerHTML;

    radioButtons.forEach(radio => {
        radio.addEventListener('change', function(event) {
            const card = event.target.closest('.card');
            const section = card.querySelector('.card-header').textContent.trim();
            const sectionId = card.querySelector('.card-header').id;
            const level = event.target.nextElementSibling.textContent.toLowerCase().trim();
            const imageUrl = card.querySelector('img').src;
            const name = prompt('Veuillez saisir votre prénom :');

            if (name) {
                const state = { page: 'recap', section, sectionId, level, name, imageUrl };
                history.pushState(state, 'Récapitulatif', '#recap');
                localStorage.setItem('quizState', JSON.stringify(state));

                const recapPage = `
                    <div class="container text-center mt-5">
                        <h1>Quizz World</h1>
                        <h2>${section} - ${level.charAt(0).toUpperCase() + level.slice(1)}</h2>
                        <h2><span class="name-color">${name}</span>, vous allez pouvoir démarrer ce Quizz !!!</h2>
                        <img src="${imageUrl}" class="img-fluid mb-3 bordurerecap imgrecap" alt="Image de la rubrique sélectionnée">
                        <div class="d-flex flex-column align-items-center">
                            <button class="btn btn-primary mb-2" id="startQuizButton">Démarrer le Quizz</button>
                            <button class="btn btn-secondary" onclick="goBack()">Modifier votre choix</button>
                        </div>
                    </div>
                `;

                document.body.innerHTML = recapPage;
                document.getElementById('startQuizButton').addEventListener('click', startQuiz);
            }
        });
    });

    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.page === 'recap') {
            renderRecapPage(event.state);
        } else {
            document.body.innerHTML = initialContent;
            document.dispatchEvent(new Event('DOMContentLoaded'));
        }
    });
});

function startQuiz() {
    const sectionId = history.state.sectionId.trim();
    const level = history.state.level.toLowerCase().trim();
    console.log(`Starting quiz for section: ${sectionId}, level: ${level}`);

    fetch(`json/${sectionId}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('Quiz data loaded successfully:', data);
            quizData[level] = data.quizz[level];
            currentQuestionIndex = 0;
            score = 0;
            displayQuestion(sectionId, level);
        })
        .catch(error => console.error('Error loading quiz data:', error));
}

function goBack() {
    history.back();
}

function displayQuestion(sectionId, level) {
    const questionData = quizData[level][currentQuestionIndex];
    console.log('Displaying question:', questionData);

    const quizPage = `
        <div class="container text-center mt-5">
            <h1>Quizz World</h1>
            <h2>${sectionId} - ${level.charAt(0).toUpperCase() + level.slice(1)}</h2>
            <h3>Question ${currentQuestionIndex + 1} : ${questionData.question}</h3>
            <div id="options" class="d-flex flex-row justify-content-center align-items-center">
                ${questionData.propositions.map(option => `<div class="draggable btn boutonoption mx-2" data-answer="${option}">${option}</div>`).join('')}
            </div>
            <div id="dropzone" class="dropzone mt-3 p-5 bg-light">Déposez votre réponse ici</div>
            <div id="anecdote" class="mt-3 p-3 text-center"></div>
            <button id="nextButton" class="btn btn-suivant mt-3" onclick="nextQuestion('${sectionId}', '${level}')" disabled>Suivant</button>
        </div>
    `;
    document.body.innerHTML = quizPage;

    $(".draggable").draggable({ revert: "invalid" });
    $("#dropzone").droppable({
        accept: ".draggable",
        drop: function(event, ui) {
            const droppedAnswer = ui.draggable.data("answer");
            console.log('Dropped answer:', droppedAnswer);
            validateAnswer(droppedAnswer, questionData.réponse, questionData.anecdote);
        }
    });
}

function validateAnswer(selected, correct, anecdote) {
    console.log('Validating answer:', selected, correct);
    if (selected === correct) {
        $("#dropzone").addClass("bg-success text-white").text("Bonne réponse !");
        $(`.draggable[data-answer="${selected}"]`).addClass("bg-success text-white");
        if (anecdote) {
            $("#anecdote").text(anecdote).addClass("bg-info text-white");
        }
        score++;
    } else {
        $("#dropzone").addClass("bg-danger text-white").text("Mauvaise réponse. Essayez encore.");
        $(`.draggable[data-answer="${correct}"]`).addClass("bg-success text-white");
    }

    
    $(".draggable").draggable("disable");

    
    $("#nextButton").prop("disabled", false);
}

function nextQuestion(sectionId, level) {
    console.log('Next question called');
    currentQuestionIndex++;
    if (currentQuestionIndex < quizData[level].length) {
        displayQuestion(sectionId, level);
    } else {
        displayFinalScore(sectionId, level);
    }
}

function displayFinalScore(sectionId, level) {
    const totalQuestions = quizData[level].length;
    const { name, section } = history.state;
    const scorePage = `
        <div class="container text-center mt-5">
            <h1>Quizz World</h1>
            <h2>${section} - ${level.charAt(0).toUpperCase() + level.slice(1)}</h2>
            <h2>Quizz Terminé !!</h2>
            <h2><span class="name-color">${name}</span>, vous avez obtenu le score de ${score} / ${totalQuestions}</h2>
            <p>Merci d'avoir participé au quiz.</p>
            <button class="btn btn-primary mt-3" onclick="goToHomePage()">Retourner à l'accueil</button>
        </div>
    `;
    document.body.innerHTML = scorePage;
}

function goToHomePage() {
    location.reload();
}

function loadStateFromLocalStorage() {
    const state = JSON.parse(localStorage.getItem('quizState'));
    if (state && state.page === 'recap') {
        renderRecapPage(state);
        history.replaceState(state, 'Récapitulatif', '#recap');
    }
}

function renderRecapPage(state) {
    const { section, sectionId, level, name, imageUrl } = state;
    const recapPage = `
        <div class="container text-center mt-5">
            <h1>Quizz World</h1>
            <h2>${section} - ${level.charAt(0).toUpperCase() + level.slice(1)}</h2>
            <h2><span class="name-color">${name}</span>, vous allez pouvoir démarrer ce Quizz !!!</h2>
            <img src="${imageUrl}" class="img-fluid mb-3 bordurerecap imgrecap" alt="Image de la rubrique sélectionnée">
            <div class="d-flex flex-column align-items-center">
                <button class="btn btn-primary mb-2" id="startQuizButton">Démarrer le Quizz</button>
                <button class="btn btn-secondary" onclick="goBack()">Modifier votre choix</button>
            </div>
        </div>
    `;
    document.body.innerHTML = recapPage;
    document.getElementById('startQuizButton').addEventListener('click', startQuiz);
}






















