let questions;
var answerStatus = [];
let allQuestions;
let timeline;
let examtime;
let examFullName;
let currentExamName;
let properties;
let currentQuestionIndex = 0;
let reviewIndexes = [];
let reviewIncorrectMode = false;
let reviewMarkedMode = false;
let correctAnswers = 0;
let incorrectAnswers = 0;
let incorrectIndexes = [];
let correctIndexes = [];
let dropdownSelections = [];
let checkboxRadioSelections = [];
let dragAndDropSelections = [];
let correctOrderList = [];
let userAnswers;
let chart; // Declare chart variable outside the click event handler
let examTimer;
let timeLimit; // Set the initial time limit
let initialTimeLimit ; // Store the initial time limit for later use
let sectionNames = ['exampleSection1', 'exampleSection2'];

// start exam
document.addEventListener('DOMContentLoaded', function() {
  // Call the function to load exam data when the page finishes loading
  loadExamData();
});

window.addEventListener('beforeunload', function (e) {
    // Call your function to save the current state
    console.log("saving data as page is being closed");
    checkAnswer();
    saveExam();
});

// Attach an event handler to the inputs, checkboxes, and dropdowns
$(document).on('change', 'input, checkbox, select, radio', function() {
    console.log("saving data as user modified selection");
    checkAnswer();
    saveExam();
});

// Attach an event handler to the droppable items
$(document).on('drop', '.droppable', function() {
    console.log("saving data as user modified selection");
    checkAnswer();
    saveExam();
});

$(document).on('sortupdate', '#sortable, #sortable-all, #sortable-selected', function() {
    console.log("saving data as drag drop zone has been modified");
    checkAnswer();
    saveExam();
});

function checkAnswer() {
    let timelineIndex = timeline[currentQuestionIndex] - 1; // Subtract 1 to convert from 1-based to 0-based indexing
    let question = allQuestions[timelineIndex];  
    let isCorrect = false;

    if (question.Type === 'DropdownInText') {
        dropdownSelections[currentQuestionIndex] = [];
        question.Dropdowns.forEach((dropdown, index) => {
            let userAnswer = $(`#dropdown-${index}`).val();
            dropdownSelections[currentQuestionIndex][index] = userAnswer;
            if (userAnswer === dropdown.Correct) {
                isCorrect = true;
            }
        });
    } else if (question.Type === 'Dropdown') {
        question.Options.forEach(option => {
            let userAnswer = $(`#option-${option.Alphabet}`).val();
            dropdownSelections[currentQuestionIndex][option.Alphabet] = userAnswer;
            if (userAnswer === option.Correct) {
                isCorrect = true;
            }
        });
    } else if (question.Type === 'DragAndDrop') {
        let userOrder = Array.from(document.querySelectorAll('#sortable-selected li')).map(li => li.textContent);
        dragAndDropSelections[currentQuestionIndex] = userOrder;
        if (arraysEqual(userOrder, question.CorrectOrder)) {
            isCorrect = true;
        }
    }else if (question.Type === 'SortList') {
        let userOrder1 = Array.from(document.querySelectorAll('#sortable li')).map(li => li.textContent);
        if (arraysEqual(userOrder1, question.CorrectOrder)) {
            isCorrect = true;
        }
    } else {
        checkboxRadioSelections[currentQuestionIndex] = [];
        let userAnswers = [];
        $('input[name="option"]:checked').each(function() {
            checkboxRadioSelections[currentQuestionIndex].push($(this).val());
            userAnswers.push($(this).val());
        });
        if (question.IsMultipleAnswer) {
            if (arraysEqual(userAnswers.sort(), question.Answers.sort())) {
                isCorrect = true;
            }
        } else {
            if (userAnswers.length === 1 && userAnswers[0] === question.Answer) {
                isCorrect = true;
            }
        }
    }

    // Update the answer status and the correct/incorrect counters
    if (isCorrect) {
        if (answerStatus[currentQuestionIndex] === 'incorrect') {
            incorrectAnswers--;
        }
        answerStatus[currentQuestionIndex] = 'correct';
        if (!correctIndexes.includes(currentQuestionIndex + 1)) {
            correctIndexes.push(currentQuestionIndex + 1);
        }
        const index = incorrectIndexes.indexOf(currentQuestionIndex + 1);
        if (index > -1) {
            incorrectIndexes.splice(index, 1);
        }
        correctAnswers = correctIndexes.length;
    } else {
        if (answerStatus[currentQuestionIndex] === 'correct') {
            correctAnswers--;
        }
        answerStatus[currentQuestionIndex] = 'incorrect';
        if (!incorrectIndexes.includes(currentQuestionIndex + 1)) {
            incorrectIndexes.push(currentQuestionIndex + 1);
        }
        const index = correctIndexes.indexOf(currentQuestionIndex + 1);
        if (index > -1) {
            correctIndexes.splice(index, 1);
        }
        incorrectAnswers = incorrectIndexes.length;
    }


}

function startExam(examName, QuestionList, timeline, resetState = true) {
    if (resetState) {
        $.getJSON(examName, function(data) {
        questions = QuestionList;
        // Reset all variables and arrays
        console.log("resetting answers to zero");
        correctAnswers = 0;
        incorrectAnswers = 0;
        currentQuestionIndex = 0;
        incorrectIndexes = [];
        correctIndexes = [];
        markedIndexes = [];
        dropdownSelections = new Array(questions.length).fill().map(() => []);
        checkboxRadioSelections = new Array(questions.length).fill().map(() => []);
        dragAndDropSelections = Array(questions.length).fill(null);
        correctOrderList = Array(questions.length).fill(null);
        answerStatus = new Array(questions.length).fill(0);
        timeLimit = timeLimit * 60; // convert to seconds
        });
    }
    else {
        console.log("Loading saved answers...");
        examName = examName + ".json";
    }
    $.getJSON(examName, function(data) {
        $('#start-exam').show();
        $('#pick-exam').css('display', 'none');
        $('#quiz-title').text(data.Properties.Title);
        questions = QuestionList;
        examproperties = data.Properties;
        currentExamName = "JSON/" + data.Properties.Code;
        examtime = data.Properties.TimeLimit;
        console.log("Examtime is: " + examtime);
        initialTimeLimit = timeLimit; // Store the initial time limit for later use
        console.log("Timelimit in seconds is: " + timeLimit);

        examTimer = setInterval(function() {
            let minutes = Math.floor(timeLimit / 60);
            let seconds = timeLimit % 60;
            $('#timer').text(minutes + ":" + (seconds < 10 ? '0' : '') + seconds);
            timeLimit--;
            if (timeLimit < 0) {
                clearInterval(timer);
                // End the quiz when time is up
                $('#end-exam').click();
            }
        }, 1000);
        $('#start-exam').show();
        $('#pick-exam').css('display', 'none');
        $('#quiz-title').text(currentExamName);   
        
        createTimeline(timeline); // Pass the timeline to the createTimeline function
        displayQuestion();
        
    });
}

function saveExam() {
console.log("current exam name: " + currentExamName);
localStorage.setItem('examState', JSON.stringify({
    allQuestions: allQuestions,
    currentQuestionIndex: currentQuestionIndex,
    dropdownSelections: dropdownSelections,
    checkboxRadioSelections: checkboxRadioSelections,
    dragAndDropSelections: dragAndDropSelections,
    correctOrderList: correctOrderList,
    correctAnswers: correctAnswers,
    incorrectAnswers: incorrectAnswers,
    incorrectIndexes: incorrectIndexes,
    reviewIndexes: reviewIndexes,
    timeLimit: timeLimit,
    currentExamName: currentExamName,
    timeline: timeline,
    answerStatus: answerStatus,
    correctIndexes: correctIndexes
}));   
}

// When the user clicks the start exam button...
$(document).on('click', '#exam-list button', function(e) {
    e.preventDefault(); // Prevent the form from submitting normally

    // Get the exam name from the data attribute of the clicked button
    examFullName = $(this).data('exam-json');

    // Fetch the JSON data for the selected exam
    $.getJSON(examFullName, function(data) {
        // Store the questions and properties in variables
        questions = data.Sections[0].Questions;
        examproperties = data.Properties;
        currentExamName = "JSON/" + data.Properties.Code;
        examtime = data.Properties.TimeLimit;

        Swal.fire({
            title: 'Exam Configuration',
            html:
                '<label for="swal-input1">Time Limit:</label><br>' +
                '<input id="swal-input1" class="swal2-input" min="7" max="150" type="number" value="' + examtime + '"><br>' +
                '<br><label for="swal-input2">Maximum Questions:</label><br>' +
                '<input id="swal-input2" class="swal2-input" min="1" type="number" value="' + questions.length + '"><br>',
            focusConfirm: false,
            preConfirm: () => {
                let timeLimit = document.getElementById('swal-input1').value;
                let maxQuestions = document.getElementById('swal-input2').value;

                if (!timeLimit || !maxQuestions) {
                    Swal.showValidationMessage(`Please enter both time limit and maximum questions!`)
                } else {
                    return [timeLimit, maxQuestions];
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Use the values
                timeLimit = result.value[0];
                let maxQuestions = result.value[1];

                // If a maximum number of questions was specified, randomly select that many questions
                if (maxQuestions) {
                    allQuestions = _.sampleSize(questions, maxQuestions); // Using lodash's sampleSize function
                }

                // Create a timeline array with numbers in order
                timeline = allQuestions.map((_, index) => index + 1);

                // Now, you can use `allQuestions`, `timeline`, and `timeLimit` to start the exam
                console.log("Form submitted, starting exam");
                console.log("timeline...");
                console.log(timeline);
                startExam(examFullName, allQuestions, timeline, true);
            }
        });
    });
});

function uploadExamFile() {
    const fileInput = document.getElementById('jsonFile');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a JSON file to upload.');
        return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {
        const jsonString = event.target.result;
        const examJSON = JSON.parse(jsonString);

        // Do something with the examJSON data, e.g., update the form fields
        // or use it to generate the exam.

        // For example:
        document.getElementById('title').value = examJSON.Properties.Title;
        document.getElementById('certLevel').value = examJSON.Properties.CertLevel;
        // ... (update other form fields as needed)
    };

    reader.readAsText(file);
}

function loadExamData() {
  let savedState = JSON.parse(localStorage.getItem('examState'));
  if (savedState) {
    Swal.fire({
      title: 'Load saved exam?',
      text: "You have a saved exam. Do you want to continue where you left off?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, load it!',
      cancelButtonText: 'No, start a new one'
    }).then((result) => {
      if (result.isConfirmed) {
        console.log("User confirmed they want to load saved exam state");
        currentQuestionIndex = savedState.currentQuestionIndex;
        dropdownSelections = savedState.dropdownSelections;
        checkboxRadioSelections = savedState.checkboxRadioSelections;
        dragAndDropSelections = savedState.dragAndDropSelections;
        correctOrderList = savedState.correctOrderList;
        correctAnswers = savedState.correctAnswers;
        incorrectAnswers = savedState.incorrectAnswers;
        incorrectIndexes = savedState.incorrectIndexes;
        reviewIndexes = savedState.reviewIndexes;
        timeLimit = savedState.timeLimit;
        allQuestions = savedState.allQuestions;
        timeline = savedState.timeline;
        answerStatus = savedState.answerStatus;
        correctIndexes = savedState.correctIndexes;
        // Load the questions and display the current question
        console.log("timeline is...");
        console.log("Current exam name:" + savedState.currentExamName);
        startExam(savedState.currentExamName, allQuestions, timeline, false);
      } else {
        // User chose to start a new exam, so clear the saved state
          console.log("User does not want to load saved exam state");
        localStorage.removeItem('examState');
      }
    });
  }
}

//end exam 
$('#end-exam').click(function() {
    let totalQuestions = questions.length;
    let percentageScore = Math.round((correctAnswers / totalQuestions) * 100);
    let markedTally = reviewIndexes.length;
    let requiredPercentage = examproperties.Passmark;
    let unansweredTally = totalQuestions - (correctAnswers + incorrectAnswers);
    // Stop the timer
    clearInterval(examTimer);
    // Calculate the time taken
    console.log("Initial time limit: " + initialTimeLimit + "|" + "Time On Counter Now: " + timeLimit);
    let timeTaken = initialTimeLimit - timeLimit;
    // Convert the time taken to minutes and seconds
    let minutesTaken = Math.floor(timeTaken / 60);
    let secondsTaken = timeTaken % 60;
    // Update the #time-taken element
    $('#time-taken').text("Time taken: " + minutesTaken + ":" + (secondsTaken < 10 ? '0' : '') + secondsTaken);
    $('#percentage-score').text(`Percentage score: ${percentageScore}%`);
    $('#required-percentage').text(`Required percentage: ${requiredPercentage}%`);
    $('#incorrect-tally').text(`Incorrect answers: ${incorrectAnswers}`);
    $('#correct-tally').text(`Correct answers: ${correctAnswers}`);
    $('#marked-tally').text(`Marked for review: ${markedTally}`);
    $('#unanswered-tally').text(`Unanswered questions: ${unansweredTally}`);
    // Show or hide the "Review Incorrect" button
    if (incorrectIndexes.length > 0) {
        $('#review-mistakes').show();
    } else {
        $('#review-mistakes').hide();
    }
    // Show or hide the "Review Marked" button
    if (reviewIndexes.length > 0) {
        $('#review-marked').show();
    } else {
        $('#review-marked').hide();
    }
    // Show or hide the #score-chart-container
    if (correctAnswers > 0 || incorrectAnswers > 0) {
        $('#score-chart-container').show();
    } else {
        $('#score-chart-container').hide();
    }
    //$('body').addClass('blur-background');
    $('#score-modal').css('display', 'block');

    if (chart) { // If a chart already exists
        chart.destroy(); // Destroy the existing chart
    }

    let ctx = document.getElementById('scoreChart').getContext('2d');
    chart = new Chart(ctx, { 
        type: 'pie',
        data: {
            labels: ['Correct', 'Incorrect', 'Unanswered', 'Marked for Review'],
            datasets: [{
                data: [correctAnswers, incorrectAnswers, unansweredTally, markedTally],
                backgroundColor: ['#0b7e0b', '#ed2e44', 'grey', '#f48c33']
            }]
        }
    });
    
});

$(document).ready(function() {
    
    $.ajax({
        url: './PHP/list-exams.php', // Update with the path to your PHP script
        dataType: 'json',
        success: function(fileNames) {
            fileNames.forEach(function(fileName) {
                var filePath = "JSON/" + fileName;
                var examCard = $('<div>', { class: 'exam-card', 'data-exam-json': filePath });
                var button = $('<button>', { 'data-exam-json': filePath, text: 'Start Exam' });
                examCard.append(button);
                $('#exam-list').append(examCard);
            });
            generateExamCards();
        },
        error: function() {
            alert('An error occurred while fetching the exams');
        }
    });
    
});

function generateExamCards() {
    
     $('.exam-card').each(function() {
        var card = $(this);
        var examJson = card.data('exam-json');

        $.getJSON(examJson, function(data) {
            var certLevel = data.Properties.CertLevel;
            var certLevelImage;
            switch (certLevel) {
                case 1: // MS Fundementals
                    certLevelImage = 'https://learn.microsoft.com/en-us/media/learn/certification/badges/microsoft-certified-fundamentals-badge.svg';
                    break;
                case 2: // MS Associate
                    certLevelImage = 'https://learn.microsoft.com/en-us/media/learn/certification/badges/microsoft-certified-associate-badge.svg';
                    break;
                case 3: //MS Expert
                    certLevelImage = 'https://learn.microsoft.com/en-us/media/learn/certification/badges/microsoft-certified-expert-badge.svg';
                    break;
                case 4: //ITIL
                    certLevelImage = 'https://valueinsights.ch/wp-content/uploads/2019/06/ITIL%C2%AE-4-Foundation-CPD-200x200.png';
                    break;
                case 5: //CISCO
                    certLevelImage = 'https://www.citypng.com/public/uploads/preview/cisco-square-blue-logo-icon-png-11663428158zl4zyn0h7j.png';
                    break;
                case 6: //Comptia
                    certLevelImage = 'https://w1.pngwing.com/pngs/455/271/png-transparent-plus-sign-comptia-logo-organization-test-certification-professional-certification-technology-thumbnail.png';
                    break;                   
                case 7: //3CX
                    certLevelImage = 'https://www.cloudtalk.io/wp-content/uploads/2022/11/3cx_standalone.png';
                    break;
            }
            var header = $('<div class="exam-header"><img src="' + certLevelImage + '" alt="Certification Level" class="cert-level-image"><span class="exam-code">' + data.Properties.Code + '</span></div>');
            var subheader = $('<div class="exam-subheader"><span class="exam-title">' + data.Properties.Title + '</span></div>');
            var details = $('<div class="exam-details"></div>');
            details.append('<p>Pass mark: ' + data.Properties.Passmark + '% </p>');
            details.append('<p>Time limit: ' + data.Properties.TimeLimit + ' minutes</p>');
            details.append('<p>Number of questions: ' + data.NumberOfQuestions + '</p>');
            details.append('<p>Number of sections: ' + data.Sections.length + '</p>');

            card.prepend(details);
            card.prepend(subheader);
            card.prepend(header);
        });
    });   
    
}

$(document).on('click', '#end-quiz', function() {
    if (chart) { // If a chart already exists
        chart.destroy(); // Destroy the existing chart
    }
    $('#start-exam').hide();
    $('#pick-exam').show();
    $('#score-modal').hide();
    $('body').removeClass('blur-background');
    
    // Reset all variables and arrays
    correctAnswers = 0;
    incorrectAnswers = 0;
    currentQuestionIndex = 0;
    incorrectIndexes = [];
    markedIndexes = [];
    dropdownSelections = [];
    checkboxRadioSelections = [];
    dragAndDropSelections = [];
    correctOrderList = [];
    //remove saved exam progress
    localStorage.removeItem('examState');
    
});

//swipe between questions
$(document).swipe({
    swipeLeft:function() {
        $('#next').click();
    },
    swipeRight:function() {
        $('#previous').click();
    },
    swipeDown:function(event, direction, distance, duration, fingerCount) {
        console.log("Swipe down detected");
        $('#toggle-timeline').click();
    },
    doubleTap:function(event, target) {
        $('#reveal').click();
    },
    //Default is 75px, set to 0 for demo so any distance triggers swipe
    threshold:75,
    allowPageScroll:"vertical",
    excludedElements: "label, button, input, select, textarea, .noSwipe"
});

// question timeline
function createTimeline(timeline) {
    let timelineHTML = '';
    for (let i = 0; i < timeline.length; i++) {
        timelineHTML += `<div class="timeline-element">${timeline[i]}</div>`; // Display the question number from the timeline
    }
    $('#timeline').html(timelineHTML);
}

$('#toggle-timeline').click(function() {
    if ($('#timeline-container').is(':visible')) {
        $('#timeline-container').slideToggle(function() {
            $('#toggle-timeline').text('Show Timeline');
            $('.button-container').animate({bottom: '5px'}, 500);
        });
    } else {
        $('.button-container').animate({bottom: '75px'}, 500, function() {
            $('#toggle-timeline').text('Hide Timeline');
            $('#timeline-container').slideToggle();
        });
    }
});

//dark mode
function toggleDarkmode() {
var prismTheme = document.getElementById('prism-theme');
if ($('body').hasClass('light-mode')) {
        prismTheme.setAttribute('href', 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism-okaidia.min.css');
        $('body').removeClass('light-mode').addClass('dark-mode');
    } else {
        prismTheme.setAttribute('href', 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism.min.css');
        $('body').removeClass('dark-mode').addClass('light-mode');
    }
}

$('#toggle-mode').click(function() {
   toggleDarkmode();
});

//end dark mode
$(document).on('click', '#close-modal', function() {
    $('#score-modal').hide();

});

$(document).on('click', '#show-help', function() {
    ShowHelp();
});

//Handle keyboard shortcuts

$(document).keydown(function(e) {
    switch (e.which) {
        case 37: // left arrow key
            $('#previous').click();
            break;
        case 38: // up arrow key
            $('#toggle-timeline').click();
            break;
        case 39: // right arrow key
            $('#next').click();
            break;
        case 40: // down arrow key
            $('#toggle-timeline').click();
            break;
        case 81: // 'Q' key
            $('#end-exam').click();
            break;
        case 82: // 'R' key
        case 114: // 'r' key
            $('#reveal').click();
            break;
        case 72: // 'H' key
        case 104: // 'h' key
            ShowHelp();
            break;
    }
});
function ShowHelp() {
                Swal.fire({
                title: 'Help',
                html: `
                    <h3>Keyboard Shortcuts:</h3>
                    <p><strong>Left Arrow:</strong> Go to Previous Question</p>
                    <p><strong>Right Arrow:</strong> Go to Next Question</p>
                    <p><strong>Up Arrow:</strong> Show/Hide Timeline</p>
                    <p><strong>Down Arrow:</strong> Show/Hide Timeline</p>
                    <p><strong>Q:</strong> End Exam</p>
                    <p><strong>R:</strong> Show/Hide Answer </p>
                    <br>
                    <h3>Gestures:</h3>
                    <p><strong>Swipe Left:</strong> Go to Previous Question</p>
                    <p><strong>Swipe Right:</strong> Go to Next Question</p>
                    <p><strong>Swipe Down:</strong> Toggle Timeline</p>
                    <p><strong>Two Finger Tap:</strong> Show/Hide Answer</p>                
                `,
                icon: 'info'
            });
    
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
  ev.preventDefault();
  var data = ev.dataTransfer.getData("text");
  ev.target.appendChild(document.getElementById(data));
}

function displayQuestion() {
    let timelineIndex = timeline[currentQuestionIndex] - 1; // Subtract 1 to convert from 1-based to 0-based indexing
    let question = allQuestions[timelineIndex];
    $('#explanation').empty();
    if (question && question.Explanation) {
        $('#explanation').html(question.Explanation);
    } else {
        $('#explanation').append(`<p>No explanation provided.</p>`);
    }
    $('#question-number').text(`Question ${currentQuestionIndex + 1}`); // Display the current index in the timeline + 1
    $('#question-text').html(question.Text);
    $('#options').empty();
    if (question.Type === 'DropdownInText') {
        $('#options').removeClass('dragDropFlex');
        let template = question.Template;
        question.Dropdowns.forEach((dropdown, index) => {
            let select = `<select id="dropdown-${index}" onchange="dropdownSelections[${currentQuestionIndex}][${index}] = this.value;">`;
            select += '<option value=""></option>'; // Add this line
            dropdown.Options.forEach(option => {
                let selected = dropdownSelections[currentQuestionIndex] && dropdownSelections[currentQuestionIndex][index] === option ? ' selected' : '';
                select += `<option value="${option}"${selected}>${option}</option>`;
            });
            select += '</select>';
            template = template.replace(dropdown.Placeholder, select);
        });
        $('#options').html(template);
    } else if (question.Type === 'Dropdown') {
        $('#options').removeClass('dragDropFlex');
        question.Options.forEach(option => {
            let dropdown = `<select id="option-${option.Alphabet}">`;
            dropdown += '<option value=""></option>'; // Add this line
            option.Choices.forEach(choice => {
                let selected = dropdownSelections[currentQuestionIndex] && dropdownSelections[currentQuestionIndex][option.Alphabet] === choice ? ' selected' : '';
                dropdown += `<option value="${choice}"${selected}>${choice}</option>`;
            });
            dropdown += '</select>';
            $('#options').append(`<p>${option.Text}: ${dropdown}</p>`);
        });
    }
     else if (question.Type === 'DragAndDrop') {
        let list = '<ul id="sortable-all" class="noSwipe connectedSortable">';
        let options = question.Options;
        options.forEach((option, index) => {
            list += `<li class="noSwipe ui-state-default" id="option-${index}">${option}</li>`;
        });
        list += '</ul>';
        list += '<ul id="sortable-selected" class="noSwipe connectedSortable"></ul>';
        $('#options').addClass('dragDropFlex');
        $('#options').html(list);
        $('#sortable-all, #sortable-selected').sortable({
            connectWith: ".connectedSortable"
        }).disableSelection();

        // Check if a user's selection has already been stored
        if (dragAndDropSelections[currentQuestionIndex]) {
            // If so, move the selected options from the 'sortable-all' list to the 'sortable-selected' list
            dragAndDropSelections[currentQuestionIndex].forEach(option => {
                let optionElement = $(`#option-${options.indexOf(option)}`);
                optionElement.detach();
                $('#sortable-selected').append(optionElement);
            });
        }
    } else if (question.Type === 'SortList') {
        let list = '<ul id="sortable" class="noSwipe">';
        let options = dragAndDropSelections[currentQuestionIndex] !== null ? dragAndDropSelections[currentQuestionIndex] : question.Options;
        options.forEach((option, index) => {
            list += `<li class="noSwipe ui-state-default" id="option-${index}">${option}</li>`;
        });
        list += '</ul>';
        $('#options').html(list);
        $('#options').removeClass('dragDropFlex');
        $('#sortable').sortable({
            stop: function() {
                let userOrder = Array.from(document.querySelectorAll('#sortable li')).map(li => li.textContent);
                dragAndDropSelections[currentQuestionIndex] = userOrder;
            }
        });
        $('#sortable').disableSelection();
    } else {
        $('#options').removeClass('dragDropFlex');
        question.Options.forEach(option => {
            if (question.IsMultipleAnswer) {
                $('#options').append(`<p><input type="checkbox" id="option-${option.Alphabet}" name="option" value="${option.Alphabet}"><label for="option-${option.Alphabet}">${option.Text}</label></p>`);
            } else {
                $('#options').append(`<p><input type="radio" id="option-${option.Alphabet}" name="option" value="${option.Alphabet}"><label for="option-${option.Alphabet}">${option.Text}</label></p>`);
            }
        });
        checkboxRadioSelections[currentQuestionIndex].forEach(selection => {
            $(`#option-${selection}`).prop('checked', true);
        });
    }
    if (reviewIndexes.includes(currentQuestionIndex)) {
        $('#mark').text('Unmark for Review');
    } else {
        $('#mark').text('Mark for Review');
    }
    // Remove 'current' class from all timeline elements
    $('.timeline-element').removeClass('current');
    // Add 'current' class to the timeline element corresponding to the current question
    $(`.timeline-element:eq(${currentQuestionIndex})`).addClass('current');
    // Scroll the current timeline element into view
    let timelineElements = document.querySelectorAll('.timeline-element');
    timelineElements[currentQuestionIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
}

function arraysEqual(a, b) {
    return a.length === b.length && a.every((value, index) => value === b[index]);
}

$('#reveal').click(function() {
    let timelineIndex = timeline[currentQuestionIndex] - 1; // Subtract 1 to convert from 1-based to 0-based indexing
    let question = allQuestions[timelineIndex];  
    if ($(this).text() === 'Reveal Answer') {
        if (question.Type === 'Dropdown') {
            question.Options.forEach(option => {
                $(`#option-${option.Alphabet}`).val(option.Correct);
                $(`#option-${option.Alphabet}`).css('border', '2px solid green');
            });
        } else if (question.Type === 'DropdownInText') {
            question.Dropdowns.forEach((dropdown, index) => {
                $(`#dropdown-${index}`).val(dropdown.Correct);
                $(`#dropdown-${index}`).css('background-color', 'green');
            });
        } else if (question.Type === 'SortList') {
            userOrder = $('#sortable').html();
            $('#sortable').empty();
            let correctOrderList = '';
            question.CorrectOrder.forEach((option, index) => {
                correctOrderList += `<li class="ui-state-default" id="correct-option-${index}">${option}</li>`;
            });
            $('#sortable').append(correctOrderList);
            $('#sortable').sortable().disableSelection();
        } else if (question.Type === 'DragAndDrop') {
            userAnswers = $('#sortable-selected').html();
            $('#sortable-selected').empty();
            let correctOrderList = '';
            question.CorrectOrder.forEach((option, index) => {
                correctOrderList += `<li class="ui-state-default" id="correct-option-${index}">${option}</li>`;
            });
            $('#sortable-selected').append(correctOrderList);
            $('#sortable-selected').sortable().disableSelection();
        } else if (question.IsMultipleAnswer) {
            question.Answers.forEach(answer => {
                $(`label[for="option-${answer}"]`).css('border', '3px solid green');
                $(`label[for="option-${answer}"]`).css('background-color', 'green');
                $(`label[for="option-${answer}"]`).css('border-radius', '20px');
            });
        } else {
            $(`label[for="option-${question.Answer}"]`).css('border', '3px solid green');
            $(`label[for="option-${question.Answer}"]`).css('background-color', 'green');
            $(`label[for="option-${question.Answer}"]`).css('border-radius', '20px');
        }
        if (question.Explanation) {
            $('#explanation').html(question.Explanation).css('display', 'block');
        }
        $(this).text('Hide Answer');
    } else {
        if (question.IsMultipleAnswer) {
            question.Answers.forEach(answer => {
                $(`label[for="option-${answer}"]`).css('border', '');
                $(`label[for="option-${answer}"]`).css('background-color', '');
            });
        }
        else if (question.Type === 'DragAndDrop') {
            $('#sortable-selected').html(userAnswers);
        } else if (question.Type === 'SortList') {
            $('#sortable').html(userOrder);
        } else {
             $(`label[for="option-${question.Answer}"]`).css('border', '');
            $(`label[for="option-${question.Answer}"]`).css('background-color', '');
        }
        $('#explanation').css('display', 'none');
        $(this).text('Reveal Answer');
    }
});

$('#next').click(function() {
    saveExam();
    $('.timeline-element').removeClass('current');
    $(`.timeline-element:eq(${currentQuestionIndex})`).addClass('current');
    $('#explanation').css('display', 'none');
    $('#reveal').text('Reveal Answer');

    if (reviewIncorrectMode) {
        let currentIndexInReview = incorrectIndexes.indexOf(currentQuestionIndex);
        if (currentIndexInReview < incorrectIndexes.length - 1) {
            currentQuestionIndex = incorrectIndexes[currentIndexInReview + 1];
            displayQuestion();
        } else {
            reviewIncorrectMode = false;
            // Remove the highlighting from the timeline
            $('.timeline-element').removeClass('timeline-incorrect');
            Swal.fire({
            icon: 'info',
            title: 'Oops...',
            text: 'This is the last incorrect answer to review.'
            });
        }
    } else if (reviewMarkedMode) {
        let currentIndexInReview = reviewIndexes.indexOf(currentQuestionIndex);
        if (currentIndexInReview < reviewIndexes.length - 1) {
            currentQuestionIndex = reviewIndexes[currentIndexInReview + 1];
            displayQuestion();
        } else {
            reviewMarkedMode = false;
            Swal.fire({
            icon: 'info',
            title: 'Oops...',
            text: 'This is the last question marked for review.'
            });
        }
    } else {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            displayQuestion();
        } else {
            $('#end-exam').click();
        }
    }
});

$('#previous').click(function() {
    saveExam();
    $('#reveal').text('Reveal Answer');
    $('#explanation').css('display', 'none');

    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        $('.timeline-element').removeClass('current');
        $(`.timeline-element:eq(${currentQuestionIndex})`).addClass('current');
        displayQuestion();
    } else {
        Swal.fire({
            icon: 'info',
            title: 'Oops...',
            text: 'This is the first question.'
        });
    }
});

$('#mark').click(function() {
    let index = reviewIndexes.indexOf(currentQuestionIndex);
    if (index === -1) {
        reviewIndexes.push(currentQuestionIndex);
        $(`.timeline-element:eq(${currentQuestionIndex})`).addClass('marked');
        $('#mark').text('Unmark for Review');
        Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: 'Question marked for review',
            showConfirmButton: false,
            timer: 1500,
            toast: true,
            onOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            },
            customClass: {
                container: 'custom-toast-container',
            }
        });
    } else {
        reviewIndexes.splice(index, 1);
        $(`.timeline-element:eq(${currentQuestionIndex})`).removeClass('marked');
        $('#mark').text('Mark for Review');
        Swal.fire({
            position: 'top-end',
            icon: 'info',
            title: 'Question unmarked for review',
            showConfirmButton: false,
            timer: 1500,
            toast: true,
            onOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            },
            customClass: {
                container: 'custom-toast-container',
            }
        });
    }
});

$('#review').click(function() {
    if (reviewIndexes.length > 0) {
        reviewMode = true;
        currentQuestionIndex = reviewIndexes[0];
        displayQuestion();
    } else {
        Swal.fire({
            icon: 'info',
            title: 'Oops...',
            text: 'No questions marked for review.'
        });
    }
});

$(document).on('click', '#review-mistakes', function() {
    if (incorrectIndexes.length > 0) {
        reviewIncorrectMode = true;
        currentQuestionIndex = incorrectIndexes[0];
        displayQuestion();
        $('#score-modal').hide();
    } else {
        Swal.fire({
            icon: 'info',
            title: 'Oops...',
            text: 'No incorrect answers to review.'
        });
    }
    //highlight incorrect question numbers on the timeline
    incorrectIndexes.forEach(index => {
        $(".timeline-element").filter(function() {
            return $(this).text() == index;
        }).addClass('timeline-incorrect');
    });
    
});

$(document).on('click', '#review-marked', function() {
    if (reviewIndexes.length > 0) {
        reviewMarkedMode = true;
        currentQuestionIndex = reviewIndexes[0];
        displayQuestion();
        $('#score-modal').hide();
    } else {
        Swal.fire({
            icon: 'info',
            title: 'Oops...',
            text: 'No questions marked for review.'
        });
    }
});

$(document).on('click', '.timeline-element', function() {
    currentQuestionIndex = $(this).index(); // Use the timeline element's index as it is
    $('#explanation').css('display', 'none');
    $('#reveal').text('Reveal Answer');
    displayQuestion();
});



