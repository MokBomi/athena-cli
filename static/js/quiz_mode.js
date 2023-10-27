// Constants and Variables
let questions;
let allQuestions;
let favoriteQuestions = [];
let currentQuestionIndex = 0;
let currentDropdownView = 'All Questions';
let allQuestsIndexCache = 0;
let favsIndexCache = 0;
let selectedOption = null;
let userChoices = {};
let isOptionSelected = false;
let score = 0;
let totalQuestions = 0;
let incorrectQuestions = [];
let allQuestionsVisited = false;
let favoritesVisited = false;
let lastAllQuestionsIndex = 0;
let lastFavoritesIndex = 0;
let lastValidDropdownValue = 'All Questions';

// Helper Function
function findQuestionIndex(id) {
    return questions.findIndex(question => question.id.toString() === id.toString());
}

// Event Listeners
document.addEventListener('DOMContentLoaded', (event) => {
  const flipCard = document.getElementById('flip-card');
  let searchInput = document.getElementById('search-input');
  let textarea = document.getElementById('multiple-urls');
  searchInput.style.fontFamily = "Fira Code";
  searchInput.style.fontWeight = "400";
  textarea.style.fontFamily = "Fira Code";
  textarea.style.fontWeight = "400";

  flipCard.addEventListener('click', function() {
      if(!this.classList.contains('is-flipping')) {
          this.classList.add('is-flipping');
          this.classList.add('flip-card-back-hover');
          this.classList.remove('flip-card-front-hover');
      } else {
          this.classList.remove('is-flipping');
          this.classList.add('flip-card-front-hover');
          this.classList.remove('flip-card-back-hover');
      }
  });

  flipCard.addEventListener('mouseenter', function() {
    this.classList.add(this.classList.contains('is-flipping') ? 'flip-card-back-hover' : 'flip-card-front-hover');
  });

  flipCard.addEventListener('mouseleave', function() {
    this.classList.remove('flip-card-front-hover', 'flip-card-back-hover');
  });

  document.getElementById("multiple-urls").addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        event.stopPropagation();
    }
  });

  document.getElementById('start-scraping').addEventListener('click', startScraping);
  document.getElementById('go-to-question').addEventListener('click', goToQuestionGo);
  document.getElementById('prev-img-button').addEventListener('click', prevQuestion);
  document.getElementById('next-img-button').addEventListener('click', nextQuestion);
  document.getElementById('confirm-yes').addEventListener('click', handleYesButtonClick);
  document.getElementById('confirm-no').addEventListener('click', closeConfirmationModal);
  document.querySelector('#unanswered-questions-modal .close').addEventListener('click', closeUnansweredQuestionsModal);
  document.querySelector('#results-summary-modal .close').addEventListener('click', closeResultsSummaryModal);

  fetch('http://localhost:5000/getUrls')
    .then(response => response.json())
    .then(data => {
      const urlsArea = document.getElementById("multiple-urls");
      data.forEach(item => {
        urlsArea.value += `${item.base_url}, ${item.start_url}, ${item.end_url}\n`;
      });
    });
});

document.addEventListener('keydown', function(event) {
    const goButton = document.getElementById('go-to-question');
    const prevButton = document.getElementById('prev-img-button');
    const nextButton = document.getElementById('next-img-button');
    const flipCardButton = document.getElementById('flip-card');
    const urlsArea = document.getElementById("multiple-urls"); 
    
    var searchInput = document.getElementById("search-input"); 

    if (document.activeElement !== urlsArea && document.activeElement !== searchInput) { 
        switch (event.code) {
            case 'ArrowRight':
                nextButton.click();
                break;
            case 'ArrowLeft':
                prevButton.click();
                break;
            case 'Enter':
                goButton.click();
                break;
            case 'Space':
                if(flipCardButton.classList.contains('is-flipping')) {
                    flipCardButton.classList.remove('is-flipping');
                    flipCardButton.classList.add('flip-card-front-hover');
                    flipCardButton.classList.remove('flip-card-back-hover');
                    toggleAdditionalInfo();
                } else {
                    flipCardButton.classList.add('is-flipping');
                    flipCardButton.classList.add('flip-card-back-hover');
                    flipCardButton.classList.remove('flip-card-front-hover');
                    toggleAdditionalInfo();
                }
                event.preventDefault();
                break;
            default:
                return; 
        }
    }
});

window.addEventListener('beforeunload', function (e) {
  e.preventDefault();
  e.returnValue = 'Are you sure you want to reload? The questions will be reset.';
});

// Question Navigation
function goToQuestionGo(event) {
   event.preventDefault();
   let questionNumber = Number(document.getElementById('question-nav').value);
   if (questionNumber < 1 || questionNumber > questions.length) {
       alert('Invalid question number.');
   } else {
       allQuestsIndexCache = questionNumber - 1;
       favsIndexCache = findQuestionIndex(questions[questionNumber - 1].id);
       currentQuestionIndex = (currentDropdownView === 'All Questions') ? allQuestsIndexCache : favsIndexCache;
       displayQuestion(currentQuestionIndex);       
   }
}

function prevQuestion(event) {
    event.preventDefault();
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
    } else {
        return;
    }
    if (currentDropdownView === 'All Questions') {
        allQuestsIndexCache = currentQuestionIndex;
    } else {
        favsIndexCache = currentQuestionIndex;
    }
    displayQuestion(currentQuestionIndex);
}

function nextQuestion(event) {
    event.preventDefault();
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
    } else {
        return; 
    }
    if (currentDropdownView === 'All Questions') {
        allQuestsIndexCache = currentQuestionIndex;
    } else {
        favsIndexCache = currentQuestionIndex;
    }
    displayQuestion(currentQuestionIndex);
}

function toggleAdditionalInfo() {
    const container = document.getElementById('additional-info-container');

    if (container.style.display === "" || container.style.display === "none") {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
  document.querySelector("#additional-info-container").style.display = "none";
});

function displayQuestion(questionIndex, isFreshLoad = false) { 
    setTimeout(function () {
        if (!questions || questions.length === 0 || !questions[questionIndex]) {
            return;
        }

        let question = questions[questionIndex];
        let questionTextElement = document.getElementById("question-text");

        document.getElementById('url-link').textContent = `${question.url}`;
        document.getElementById('url-link').style.fontFamily = "Fira Code";
        document.getElementById('url-link').style.fontWeight = "400";
        document.getElementById('url-link').href = question.url;
        document.getElementById('explanation-title-text').textContent = 'Explanation:';
        document.getElementById('explanation-text').textContent = question.explanation;
        document.getElementById('discussion-link').href = question.discussion_link;

        let questionText = question.question.replace('\n', '<br/>');

        let withinPattern = /\(image\)q(\d+)_within_(\d+)\(image\)/gi;
        questionText = questionText.replace(withinPattern, (match, p1, p2) => {
            let imageName = `q${p1}_within_${p2}.png`;
            return `<img src="/static/assets/images/background/Within/${imageName}" alt="${imageName}" style="display: inline-block; width: auto; height: auto;">`;
        });

        let afterPattern = /\(image\)q(\d+)_after_(\d+)\(image\)/gi;
        questionText = questionText.replace(afterPattern, (match, p1, p2) => {
            let imageName = `q${p1}_after_${p2}.png`;
            return `<br><img src="/static/assets/images/background/After/${imageName}" alt="${imageName}" style="display: block; margin-left: auto; margin-right: auto; width: auto; height: auto;">`;
        });

        questionTextElement.innerHTML = questionText;
        document.getElementById("question-nav").value = questionIndex + 1;

        let explanationImagePattern = /\(image\)q(\d+)_explanation_(\d+)\(image\)/gi;
        let explanation = question.explanation.replace(explanationImagePattern, (match, p1, p2) => {  
            let imageName = `q${p1}_explanation_${p2}.png`;
            return `<img src="/static/assets/images/background/Explanation/${imageName}" alt="${imageName}" style="display: inline-block; width: auto; height: auto;">`;
        });
        document.getElementById('explanation-text').innerHTML = explanation;

        for (let i = 1; i <= 4; i++) {
            let optionText = question.options[i-1] || '';
            optionText = optionText.replace(/<div class="flex-wrap">|<\/div>/g, '');

            // New code to replace multiple image placeholders
            let optionImgPattern = new RegExp('<img src="\\/static\\/assets\\/images\\/background\\/Option\\/q' + (questionIndex + 1) + '_option' + String.fromCharCode(64 + i) + '_(\\d+).png" alt="q' + (questionIndex + 1) + '_option' + String.fromCharCode(64 + i) + '_\\d+.png" style="display: inline-block; width: auto; height: auto;">', 'gi');
            optionText = optionText.replace(optionImgPattern, (match, p1) => {
                let imageName = 'q' + (questionIndex + 1) + '_option' + String.fromCharCode(64 + i) + '_' + p1 + '.png';
                return `<img src="/static/assets/images/background/Option/${imageName}" alt="${imageName}" style="display: inline-block; width: auto; height: auto;">`;
            });

            let optionTxt = optionText.replace(/^[A-D]\./, '');
            document.getElementById(`option${String.fromCharCode(64 + i)}`)
                .querySelector('.option-text')
                .innerHTML = optionTxt;
        }

        document.getElementById("correct-answer-card").textContent = question.answer;

        document.getElementById('flip-card').classList.remove('is-flipping');

        document.querySelector("#additional-info-container").style.display = "none";

        let starButton = document.getElementById("star-button");
        if (favoriteQuestions.findIndex(question => question.id.toString() === questions[questionIndex].id.toString()) >= 0) {  
            starButton.src = "/static/assets/images/icons/star_yellow.png";
        } else {
            starButton.src = "/static/assets/images/icons/star_black.png";
        }

        const currentQuestionID = questions[currentQuestionIndex].id;
        let userChoice = userChoices[currentQuestionID];
        if (userChoice) {
            document.getElementById(`option${userChoice}`).classList.add('selected');
            if (selectedOption && selectedOption !== userChoice) {
                document.getElementById(`option${selectedOption}`).classList.remove('selected');
            }
            selectedOption = userChoice;
        } else {
            if (selectedOption) {
                document.getElementById(`option${selectedOption}`).classList.remove('selected');
                selectedOption = null;
            }
        }

        if (currentDropdownView === 'All Questions') {
            lastAllQuestionsIndex = questionIndex; 
        } else if (currentDropdownView === 'Favorites') {
            lastFavoritesIndex = questionIndex; 
        }
    });
}

// Data Handling
async function getQuestions() {
    let response = await fetch('http://localhost:5000/getQuestions');
    let data = await response.json();
    allQuestions = data;
    let savedFavorites = localStorage.getItem('favoriteQuestions');
    if (savedFavorites) {
        favoriteQuestions = JSON.parse(savedFavorites);
    }
    questions = [...allQuestions]; 
    document.getElementById("question-nav").max = questions.length;
    document.getElementById("total-questions").innerText = `/ ${questions.length}`;
    displayQuestion(allQuestsIndexCache, true);
    document.getElementById('favorites-dropdown').value = currentDropdownView;
    loadShuffledQuestionState();  
    return data;
}

async function getFavorites() {
    const response = await fetch('http://localhost:5000/getFavorites');
    const favoriteIds = await response.json();
    questions = questions.filter((question, index) => favoriteIds.includes(question.id.toString()));

    displayQuestion(favsIndexCache);  
    document.getElementById("question-nav").max = questions.length;
    document.getElementById("total-questions").innerText = `/ ${questions.length}`;
}

// Scraping
function startScraping(event) {
    event.preventDefault();
    localStorage.removeItem('shuffledQuestions');

    const raw_urls = document.getElementById('multiple-urls').value;
    const urls_array = raw_urls.split('\n'); 

    let urls = [];
    urls_array.forEach(url_line => {
        if(url_line.trim() !== '') {  
            const [base_url, start_url, end_url] = url_line.split(',').map(s => s.trim());
            urls.push({
                base_url,
                start_url,
                end_url
            });
        }
    });

    questions = [];
    favoriteQuestions = [];

    localStorage.setItem('favoriteQuestions', JSON.stringify(favoriteQuestions));

    const progress = document.getElementById("processing-section");
    progress.textContent = "Starting scraping...";

    fetch('http://localhost:5000/startScraping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls })
    })
    .then(response => response.text())
    .then(message => {
        progress.textContent = message;
        getQuestions(); 

        currentDropdownView = 'All Questions'; 
    })
    .catch(error => {
        progress.textContent = 'An error occurred during scraping.';
        console.error('Error:', error);
    });
}

// UI Functions
function toggleFavorites() {
    let starButton = document.getElementById("star-button");

    let currentQuestionIdString = questions[currentQuestionIndex].id.toString();
    let isFavorite = favoriteQuestions.find(question => question.id.toString() === currentQuestionIdString);

    if (isFavorite) {
        starButton.src = "/static/assets/images/icons/star_black.png";
        favoriteQuestions = favoriteQuestions.filter(question => question.id.toString() !== currentQuestionIdString);
    } else {
        starButton.src = "/static/assets/images/icons/star_yellow.png";
        favoriteQuestions.push(questions[currentQuestionIndex]);
    }

    localStorage.setItem('favoriteQuestions', JSON.stringify(favoriteQuestions));

    fetch('http://localhost:5000/toggleFavorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'question_id': currentQuestionIdString, 'favorite_status': !isFavorite })
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function shuffleQuestions() {
    let optionSelected = Object.values(userChoices).some(choice => choice !== null);
    
    if (optionSelected) {
        document.getElementById('confirmation-modal').style.display = "block";
    } else {
        score = 0;
        document.getElementById('score').innerText = 0;
        shuffleQuestionsWithoutConfirmation();
    }
}

function shuffleQuestionsWithoutConfirmation() {
    for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    userChoices = {}; 
    currentQuestionIndex = 0; 
    displayQuestion(currentQuestionIndex);
    saveShuffledQuestionState(); 
}

function handleYesButtonClick() {
    document.getElementById('confirmation-modal').style.display = "none";
    
    for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    userChoices = {};  
    currentQuestionIndex = 0;  
    isOptionSelected = false;  
    displayQuestion(currentQuestionIndex);  
}

function closeConfirmationModal() {
    document.getElementById('confirmation-modal').style.display = "none";
}

function changeView() {
    let dropdown = document.getElementById('favorites-dropdown');
    currentDropdownView = dropdown.value;

    if (currentDropdownView === 'All Questions') {
        questions = allQuestions;
        if (!allQuestionsVisited) {
            currentQuestionIndex = 0; 
            allQuestionsVisited = true; 
        } else {
            currentQuestionIndex = lastAllQuestionsIndex; 
        }
        displayQuestion(currentQuestionIndex);
    } else if (currentDropdownView === 'Favorites') {
        if (favoriteQuestions.length === 0) {
            alert("No favorited questions to display.");
            dropdown.value = lastValidDropdownValue;
            return;
        }
        questions = favoriteQuestions;
        if (!favoritesVisited) {
            currentQuestionIndex = 0; 
            favoritesVisited = true; 
        } else {
            currentQuestionIndex = lastFavoritesIndex; 
        }
        displayQuestion(currentQuestionIndex);
    } else if (currentDropdownView === 'Incorrect Questions') {
        if (incorrectQuestions.length === 0) {
            alert("No incorrect questions to display.");
            dropdown.value = lastValidDropdownValue;
            return;
        }
        questions = incorrectQuestions;
        currentQuestionIndex = 0;
        displayQuestion(currentQuestionIndex);
    } else if (currentDropdownView === 'Answered Questions') {
        questions = allQuestions.filter(question => userChoices.hasOwnProperty(question.id));
        currentQuestionIndex = 0; 
        if (questions.length === 0) {
            alert("No answered questions to display.");
            dropdown.value = lastValidDropdownValue;
            return;
        }
        displayQuestion(currentQuestionIndex);
    } else if (currentDropdownView === 'Unanswered Questions') {
        questions = allQuestions.filter(question => !userChoices.hasOwnProperty(question.id));
        currentQuestionIndex = 0; 
        if (questions.length === 0) {
            alert("No unanswered questions to display.");
            dropdown.value = lastValidDropdownValue;
            return;
        }
        displayQuestion(currentQuestionIndex);
    }

    lastValidDropdownValue = currentDropdownView;

    document.getElementById("question-nav").max = questions.length;
    document.getElementById("total-questions").innerText = `/ ${questions.length}`;
}

function displayFavorites() {
    questions = favoriteQuestions;
    displayQuestion(0);
}

document.getElementById('favorites-dropdown').addEventListener('change', changeView);

function openSearch() {
    document.getElementById('search-modal').style.display = "block";
    document.getElementById('search-input').placeholder = "Search for questions";
    
    let newDiv = document.createElement('div');
    newDiv.innerHTML = '<img src="/static/assets/images/icons/search_icon.png" alt="search icon">';
    document.getElementById('search-modal-content').insertBefore(newDiv, document.getElementById('search-input'));
}

function closeSearch() {
    document.getElementById('search-modal').style.display = "none";
}

function searchQuestions() {
    let input = document.getElementById('search-input');
    let filter = input.value.toUpperCase();
    let results = document.getElementById('search-results');
    results.innerHTML = "";

    if (!filter.trim()) {
        results.innerHTML = "";
        return; 
    }

    for (let i = 0; i < questions.length; i++) {
        let questionWithoutHtml = document.createElement('p');

        questionWithoutHtml.innerHTML = questions[i].question;
        let questionText = questionWithoutHtml.innerText || questionWithoutHtml.textContent;

        if (questionText.toUpperCase().indexOf(filter) > -1) {
            let div = document.createElement('div');
            let divNum = document.createElement('div');
            divNum.textContent = 'Question ' + (i + 1) + ': ';
            divNum.classList.add('question-number');
            div.appendChild(divNum);

            let pattern = new RegExp(`(${filter})`, 'gi');

            let divText = document.createElement('div');
            divText.innerHTML = questionText.replace(pattern, '<strong>$1</strong>')
            divText.classList.add('question-results');
            div.appendChild(divText);

            let img = document.createElement('img');
            img.src = favoriteQuestions.includes(questions[i].id.toString()) ? "/static/assets/images/icons/star_yellow.png" : "/static/assets/images/icons/star_black.png";
            img.classList.add('star-icon');
            div.appendChild(img);

            div.addEventListener('click', function () {
                allQuestsIndexCache = i;
                favsIndexCache = findQuestionIndex(questions[i].id);
                currentQuestionIndex = (currentDropdownView === 'All Questions') ? allQuestsIndexCache : favsIndexCache;
                displayQuestion(currentQuestionIndex);
                closeSearch();
            });
            results.appendChild(div);
        }
    }
}

function submitAnswers() {
    if (currentDropdownView === 'Answered Questions') {
        const unansweredQuestions = allQuestions.filter(question => !userChoices.hasOwnProperty(question.id));
        if (unansweredQuestions.length) {
            document.getElementById('unanswered-questions-modal').style.display = 'block';
            return;
        }
    }
    if (!checkUnansweredQuestions()) {
        return;
    }
    
    incorrectQuestions = []; 

    allQuestions.forEach(question => {
        if (userChoices[question.id] && question.answer !== `Option ${userChoices[question.id]}`) {
            incorrectQuestions.push(question); 
        }
    });
    
    if (incorrectQuestions.length) {
        document.getElementById('results-summary-modal').style.display = "block";
        document.getElementById('results-summary-text').innerHTML = `You scored ${score} out of ${allQuestions.length}. 
        <p><span class="underline-on-hover" onclick="goToIncorrectQuestions()">Click here</span> to go over your incorrect answers.</p>`;
    } else {
        document.getElementById('results-summary-modal').style.display = "block";
        document.getElementById('results-summary-text').innerText = `You scored ${score} out of ${allQuestions.length}.`;
    }
}

function goToUnansweredQuestions() {
  document.getElementById('favorites-dropdown').value = "Unanswered Questions";
  changeView();
  document.getElementById('unanswered-questions-modal').style.display = "none";
}

function closeUnansweredQuestionsModal() {
    document.getElementById('unanswered-questions-modal').style.display = "none";
}

function closeResultsSummaryModal() {
    document.getElementById('results-summary-modal').style.display = "none";
}

function goToIncorrectQuestions() {
    document.getElementById('favorites-dropdown').value = "Incorrect Questions";
    changeView();
    document.getElementById('results-summary-modal').style.display = "none";
    
    incorrectQuestions.forEach(question => {
        if (userChoices[question.id]) {
            delete userChoices[question.id];
        }
        if (selectedOption) {
            document.getElementById(`option${selectedOption}`).classList.remove('selected');
            selectedOption = null;
        }
    });
}

function checkUnansweredQuestions() {
    const unansweredQuestions = [];
    for (let i = 0; i < questions.length; i++) {
        if (!userChoices[questions[i].id]) {
            unansweredQuestions.push(i + 1);
        }
    }

    if (unansweredQuestions.length) {
        displayUnansweredQuestionsModal(unansweredQuestions);
        return false;
    }

    return true;
}

function displayUnansweredQuestionsModal(unansweredQuestions) {
    let unansweredQuestionsList = document.getElementById('incorrect-questions-list');
    unansweredQuestionsList.innerHTML = 'You have left at least one question unanswered: ';

    let questionsContainer = document.createElement('div'); 
    unansweredQuestions.forEach((qNum, index) => {
        let span = document.createElement('span');
        span.className = 'underline-on-hover'; 
        span.innerText = 'Q' + qNum;
        span.style.cursor = 'pointer';
        span.onclick = () => {
            currentDropdownView = 'All Questions'; 
            changeView();

            allQuestsIndexCache = qNum - 1; 
            currentQuestionIndex = qNum - 1;
            displayQuestion(currentQuestionIndex); 

            closeIncorrectUnansweredQuestionsModal(); 
        };
        questionsContainer.appendChild(span); 

        if (index !== unansweredQuestions.length - 1) {
            let commaSpan = document.createElement('span');
            commaSpan.innerText = ', ';
            questionsContainer.appendChild(commaSpan); 
        }
    });

    unansweredQuestionsList.appendChild(questionsContainer); 
    document.getElementById('incorrect-questions-modal').style.display = 'block';
}

function closeIncorrectUnansweredQuestionsModal() {
    document.getElementById('incorrect-questions-modal').style.display = "none";
}

// Reset Functions
function resetButtonClick() {
  if (questions && questions.length) {
    openResetQuestionsModal();  
  }
}

function openResetQuestionsModal() {
    document.getElementById('reset-questions-modal').style.display = "block";
}

function closeResetQuestionsModal() {
    document.getElementById('reset-questions-modal').style.display = "none";
}

function resetQuestions() {
    score = 0;
    document.getElementById('score').innerText = 0; 
    userChoices = {};
    if (selectedOption) {
        document.getElementById(`option${selectedOption}`).classList.remove('selected');
        selectedOption = null;
    }

    document.getElementById('favorites-dropdown').value = 'All Questions';
    changeView();
    currentQuestionIndex = 0; 
    displayQuestion(currentQuestionIndex);

    closeResetQuestionsModal();
}

// Save State Functions
function selectOption(option) {
    const currentQuestionID = questions[currentQuestionIndex].id;
    const correctAnswer = questions[currentQuestionIndex].answer;
    
    if (selectedOption === option) {
        document.getElementById(`option${option}`).classList.remove('selected');
        selectedOption = null;
        delete userChoices[currentQuestionID];
        
        if (`Option ${option}` === correctAnswer) {
            score--;
        }
    } else {
        if (selectedOption) {
            document.getElementById(`option${selectedOption}`).classList.remove('selected');
            
            if (correctAnswer === `Option ${selectedOption}`) {
                score--;
            }
        }
        document.getElementById(`option${option}`).classList.add('selected');
        selectedOption = option;
        userChoices[currentQuestionID] = selectedOption;
        
        if (`Option ${option}` === correctAnswer) {
            score++;
        }
    }
    
    if (`Option ${option}` === correctAnswer) {
        totalQuestions = allQuestions.length; 
    }
    
    let optionsSelected = Object.values(userChoices).some(choice => choice !== null);
    isOptionSelected = optionsSelected ? true : false;

    isOptionChanged = true;
    if (!isOptionSelected) {
        document.getElementById('confirmation-modal').style.display = "none";
    }
    document.getElementById('score').innerText = score; 
}

function loadShuffledQuestionState() {
    const shuffledQuestions = localStorage.getItem('shuffledQuestions');
    if (shuffledQuestions) {
        questions = JSON.parse(shuffledQuestions);
    }
}

function saveShuffledQuestionState() {
    localStorage.setItem('shuffledQuestions', JSON.stringify(questions));
}
