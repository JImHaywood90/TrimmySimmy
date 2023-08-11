
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Add this global variable
let optionCount = 0;
let examDetails = {};
var questions = [];
var multipleOptionCount = 0;
var examJSON;
var dataTable;
var dynamicColumns = [];

document.addEventListener('keydown', function(event) {
    // Check if the event target is an input or textarea
    if (event.target.tagName.toLowerCase() === 'input' || event.target.tagName.toLowerCase() === 'textarea') {
        // Check if the key pressed is an arrow key
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            // Stop the event from propagating further
            console.log("stopping arrow key propogation");
            event.stopPropagation();
        }
    }
});

async function performOCR(imageUrl) {
    // Use Tessera.cat or your chosen OCR library to process the image
    const ocrResult = await processImageWithOCR(imageUrl, { mode: 'no-cors' });
    
    // Extract dropdown information from OCR result using the parseDropdownText function
    const { question, options } = parseDropdownText(ocrResult);
    
    // Update your UI with extracted question and options
    document.getElementById('questionText').value = question;
    
    // Join the parsed options into a single string with line breaks
    const optionsText = options.join('\n');
    document.getElementById('allOptionsText').value = optionsText;
}



// Function to call the PHP script and process the OCR result
function processImageWithOCR(imageUrl) {
    $.ajax({
        url: 'PHP/process-dropdown-image.php',
        method: 'GET',
        data: { imageUrl: imageUrl },
        success: function(response) {
            // Handle the parsed data and populate your form
            const parsedQuestion = response.question;
            const parsedOptions = response.options;
            console.log(response);
            console.log(parsedOptions);
            // Populate the question and options fields in your form
            $('#questionField').val(parsedQuestion);
            parsedOptions.forEach(function(optionText, index) {
                // Create and append option elements to your dropdown
                // You can adapt your existing code to add options here
            });
        },
        error: function() {
            // Handle error if AJAX request fails
            console.log('Error fetching data from server.');
        }
    });
}




function parseDropdownText(text) {
    // Split the text into lines
    const lines = text.split('\n');

    // Initialize variables to store parsed question and options
    let parsedQuestion = '';
    const parsedOptions = [];

    // Iterate through each line
    for (const line of lines) {
        // Trim leading and trailing spaces
        const trimmedLine = line.trim();

        // Check if the line contains a colon
        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex !== -1) {
            // Extract question text before colon
            parsedQuestion = trimmedLine.substring(0, colonIndex).trim();
        } else if (trimmedLine !== '') {
            // If line is not empty, assume it's an option and add to parsedOptions array
            parsedOptions.push(trimmedLine);
        }
    }

    return { question: parsedQuestion, options: parsedOptions };
}

// Button click event handler
$('#extractButton').on('click', function() {
    // Get the HTML content of the TinyMCE editor
    const editorContent = tinymce.get('imageEditor').getContent();

    // Parse the HTML content to extract the image URL from the img tag
    const imageUrl = $(editorContent).find('img').attr('src');

    $.ajax({
        url: 'PHP/process-dropdown-image.php', // Your PHP script to handle image processing
        method: 'POST',
        data: { imageUrl: imageUrl },
        success: function(response) {
            // Use Tesseract.js to process the locally saved image
            imagePathLocal = 'PHP/' + response;
            console.log(imagePathLocal);
            Tesseract.recognize(imagePathLocal)
                .then(result => {
                    const extractedText = result.text;
                    console.log(extractedText);
                    // Parse extractedText to generate dropdown
                    // Update the dropdownContainer with the generated dropdown
                })
                .catch(error => {
                    console.error('Error processing image:', error);
                });
        },
        error: function(xhr, status, error) {
            console.error('Image processing error:', error);
        }
    });
    
    
});


function splitOptions() {
    var allOptionsText = $('#allOptionsText').val();
    var optionsLines = allOptionsText.trim().split('\n');

    // Remove existing options
    $('#optionsContainer').empty();

    // Process each line
    optionsLines.forEach(function(line, index) {
        var optionLetter = String.fromCharCode(65 + index); // A, B, C, ...
        var optionText = line.substring(3); // Remove option letter and dot
        addOption(optionLetter, optionText); // Call the modified addOption function
    });

    $('#smartwizard').smartWizard("fixHeight");
}

function splitMultipleOptions() {
    var allOptionsText = $('#allOptionsTextMultiple').val();
    var optionsLines = allOptionsText.trim().split('\n');

    // Remove existing options
    $('#multipleOptionsContainer').empty();

    // Process each line
    optionsLines.forEach(function(line, index) {
        var optionLetter = String.fromCharCode(65 + index); // A, B, C, ...
        var optionText = line.substring(3); // Remove option letter and dot
        addMultipleOption(optionLetter, optionText); // Call the modified addMultipleOption function
    });

    $('#smartwizard').smartWizard("fixHeight");
}

function addMultipleOption(optionLetter, optionText) {
    const optionsContainer = document.getElementById('multipleOptionsContainer');

    if (multipleOptionCount >= alphabet.length) {
        alert('You have reached the maximum number of options.');
        return;
    }

    // Add option text input and checkbox to indicate the correct answer
    const optionDiv = document.createElement('div');
    optionDiv.innerHTML = `
        <input type="checkbox" id="multipleOption${optionLetter}" name="correctOption" value="option${optionLetter}">
        <label for="multipleOption${optionLetter}Text">${optionLetter}. </label>
        <input type="text" id="multipleOption${optionLetter}Text" name="option${optionLetter}Text" value="${optionText}">
        <br>
    `;
    multipleOptionsContainer.appendChild(optionDiv);

    // Increment the multipleOptionCount variable
    multipleOptionCount++;

    // Fix the content height of the current step
    $('#smartwizard').smartWizard("fixHeight");
}

function addOption(optionLetter, optionText) {
    const optionsContainer = document.getElementById('optionsContainer');

    if (optionCount >= alphabet.length) {
        alert('You have reached the maximum number of options.');
        return;
    }

    // Add option text input and radio button to indicate the correct answer
    const optionDiv = document.createElement('div');
    optionDiv.innerHTML = `
        <input type="radio" id="option${optionLetter}" name="correctOption" value="option${optionLetter}">
        <label for="option${optionLetter}Text">${optionLetter}. </label>
        <input type="text" id="option${optionLetter}Text" name="option${optionLetter}Text" value="${optionText}">
        <br>
    `;
    optionsContainer.appendChild(optionDiv);

    // Increment the optionCount variable
    optionCount++;

    // Fix the content height of the current step
    $('#smartwizard').smartWizard("fixHeight");
}


function updateImage() {
    var certLevel = parseInt(document.getElementById('certLevel').value);
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
    document.getElementById('certImage').src = certLevelImage;
}

function addBreaksToQuestionText(questionText) {
    return questionText.replace(/\./g, '.<br>');
}

function removeChildRowsFromQuestions() {
  for (var i = 0; i < questions.length; i++) {
    delete questions[i].ChildRows;
  }
}

function UpdateQuestionDisplay() {
      // Find all elements with the class "revQ"
      var revQElements = $(".revQ");
      var revQBasicElements = $(".revQB");
      // Update the text content for each element
      revQElements.each(function (index) {
        // Change the text to "review <number of questions> Questions"
        $(this).text("Review " + questions.length + " Questions");
      });
      revQBasicElements.each(function (index) {
        // Change the text to "review <number of questions> Questions"
        $(this).text(questions.length + " Questions");
      });
}

function saveQuestions() {
localStorage.setItem('questionData', JSON.stringify({
    userQuestions: questions,
    examDetails: examDetails
}));   
}

function loadQuestions() {
  let savedState = JSON.parse(localStorage.getItem('questionData'));
  if (savedState) {
      console.log("loading saved questions from local d")
      questions = savedState.userQuestions;
      examDetails = savedState.examDetails;
      UpdateQuestionDisplay;
  }
    
}

$(document).ready(() => {
    loadAvailableExams();
    UpdateQuestionDisplay();
    // Check if the questions array is empty or has questions
    const hasQuestions = questions && questions.length > 0;

    $("#smartwizard").smartWizard({
      transitionEffect:'fade',
      theme: 'arrows', // theme for the wizard, related css need to include for other than default theme
      justified: true, // Nav menu justification. true/false
      autoAdjustHeight: true,
      selected: 0, // Set default step to 0 (step 1)
      hashNavigation: false, // Disable hash navigation
      disabledSteps: hasQuestions ? [] : [1, 2, 3], // Enable or disable steps based on the questions array
    });
    
    timeout = setTimeout(function() {
        $('#smartwizard').smartWizard("theme", "arrows");
    }, 250); // Adjust the delay as needed
    

    // Handle URL hash change manually and update the step
    $(window).on("hashchange", function (event) {
      const stepNumber = parseInt(window.location.hash.replace("#step-", ""));
      if (!isNaN(stepNumber)) {
        $("#smartwizard").smartWizard("goToStep", stepNumber - 1); // SmartWizard uses 0-based index for steps
      }
    });
    
  // Custom formatter for "Options" column
  function optionsFormatter(cell, formatterParams, onRendered) {
    console.log("options1 is: " + options1);
    var options1 = cell.getValue();
    if (Array.isArray(options1)) {
      // Handle Single and Multiple Answer questions
      return options1.map((option) => option.Text).join(", ");
    } else if (options1 && Array.isArray(options1.Choices)) {
      // Handle Dropdown questions
      return options1.Choices.join(", ");
    } else if (options1 && options1.Text) {
      // Handle DropdownInText questions
      return options1.Text;
    } else {
      return "";
    }
  }

    // Create columns for the parent table
    var parentColumns = [
        { title: "No.", field: "No" },
        { title: "Type", field: "Type"},
        {
            title: "Question Text (Click to Edit)",
            field: "Text",
            headerFilter: true,
            editor: "textarea",
            formatter: "textarea",
            cssClass: "wrap-text", // Add a custom CSS class to handle text wrapping
        },
    ];
    
    var childColumns = [
      { title: "Answer(s)", field: "Answer", editor: "textarea", visible: true },
      {
        title: "Options",
        field: "Options",
        formatter: optionsFormatter, // Use the custom formatter for "Options" column
        editor: "textarea",
        visible: true,
      },
      { title: "Correct Order", field: "CorrectOrder", editor: "textarea", visible: true },
      { title: "Explanation", field: "Explanation", editor: "textarea", visible: true },
      { title: "Dropdowns", field: "Dropdowns", editor: "textarea", visible: true },
      { title: "Template", field: "Template", editor: "textarea", visible: true },
    ];
    
    var contextMenu = [
      {
        label: 'Delete',
        action: function(e, row) {
          var rowData = row.getData();
          deleteQuestion(rowData);
        }
      }
    ];


            var table = new Tabulator("#questions-list", {
                data: [], // no data yet
                rowContextMenu: contextMenu,
                layout: "fitDataStretch",
                pagination: "local", // enable local pagination
                paginationSize: 12, // set the number of rows per page to 25
                movableColumns:true,
                paginationCounter:"rows",
                renderComplete: function() {
                    console.log("Render complete");
                    // Call the fixHeight function for SmartWizard after a delay
                    timeout = setTimeout(function() {
                        console.log("Fixing smart wizard height");
                        $("#smartwizard").smartWizard("fixHeight");
                    }, 1000); // Adjust the delay as needed
                },
                pageLoaded: function() {
                    // Call the fixHeight function for SmartWizard after a delay
                    console.log("page loaded");
                    timeout = setTimeout(function() {
                        $("#smartwizard").smartWizard("fixHeight");
                    }, 300); // Adjust the delay as needed
                },
                // Callback triggered when the pagination size is changed
                pageSizeChanged: function(size) {
                    console.log("pagesize changed");
                    // Call the fixHeight function for SmartWizard after a delay
                    timeout = setTimeout(function() {
                        $("#smartwizard").smartWizard("fixHeight");
                    }, 300); // Adjust the delay as needed
                },
                responsiveLayout: "collapse",
                columns: parentColumns,
                cellEdited: function (cell) {
                    setTimeout(function () {
                        $("#smartwizard").smartWizard("fixHeight");
                    }, 150);
                },
                cellEditing: function (cell) {
                    if (cell.getColumn().getField() === "Text") {
                        setTimeout(function () {
                            var textarea = cell._cell.element.getElementsByTagName("textarea")[0];
                            if (textarea) {
                                textarea.style.height = "auto";
                                textarea.style.height = textarea.scrollHeight + "px";
                            }
                        }, 100);
                    }
                    setTimeout(function () {
                        $("#smartwizard").smartWizard("fixHeight");
                    }, 150);
                },
                dataLoaded: function (data) {
                    setTimeout(function () {
                        $("#smartwizard").smartWizard("fixHeight");
                    }, 150);
                },
                dataTree: function(data){
                    return data.ChildRows && data.ChildRows.length > 0; // Only create a child row if ChildRows is not empty
                },
                dataTreeStartExpanded: false, // Collapse all child rows by default
                dataTreeChildField: "ChildRows", // Field name for child rows
                dataTreeChildIndent: 20, // Child row indentation in pixels
                dataTreeRowCollapsed: function (data) {
                    setTimeout(function () {
                        $("#smartwizard").smartWizard("fixHeight");
                    }, 150);
                },
                dataTreeRowExpanded: function (row) {
                  // Check if row has child rows
                  if (row.getData().ChildRows && row.getData().ChildRows.length > 0) {
                    // Create a container element for the subTable
                    var subTableContainer = document.createElement("div");

                    // Clear the dynamicColumns array
                    dynamicColumns = [];

                    // Set up the dynamic columns for the subTable based on data availability
                    if (row.getData().ChildRows.some((childRow) => childRow.Answer)) {
                      dynamicColumns.push({
                        title: "Answer(s)",
                        field: "Answer",
                        editor: "textarea",
                      });
                    }

                    if (row.getData().ChildRows.some((childRow) => childRow.Options)) {
                      dynamicColumns.push({
                        title: "Options",
                        field: "Options",
                        editor: "textarea",
                      });
                    }
                      
                    if (row.getData().ChildRows.some((childRow) => childRow.Dropdowns)) {
                      dynamicColumns.push({
                        title: "Dropdowns",
                        field: "Dropdowns",
                        editor: "textarea",
                      });
                    }
                      
                    if (row.getData().ChildRows.some((childRow) => childRow.Template)) {
                      dynamicColumns.push({
                        title: "Template",
                        field: "Template",
                        editor: "textarea",
                      });
                    }

                    if (row.getData().ChildRows.some((childRow) => childRow.CorrectOrder)) {
                      dynamicColumns.push({
                        title: "Correct Order",
                        field: "CorrectOrder",
                        editor: "textarea",
                      });
                    }

                    if (row.getData().ChildRows.some((childRow) => childRow.Explanation)) {
                      dynamicColumns.push({
                        title: "Explanation",
                        field: "Explanation",
                        editor: "textarea",
                      });
                    }
                      
                    row.getData().ChildRows.forEach(function (childRow) {
                      childRow.parentRow = row.getData();
                    });
                      
                    // Add the child table when the row is expanded
                    var subTable = new Tabulator(subTableContainer, {
                          layout: "fitDataStretch",
                          columns: dynamicColumns,
                          data: row.getData().ChildRows,
                    cellEdited: function (cell) {
                      // Get the edited value from the cell
                      var editedValue = cell.getValue();

                      // Get the parent row data and the child row data
                      var parentRowData = cell.getRow().getData().parentRow;
                      var childRowData = cell.getRow().getData();

                      // Find the index of the child row in the parent's ChildRows array
                      var childRowIndex = parentRowData.ChildRows.findIndex((row) => row === childRowData);

                      if (childRowIndex !== -1) {
                        // If the child row is found in the parent's ChildRows array,
                        // update the corresponding property in the parent's data
                        parentRowData.ChildRows[childRowIndex][cell.getField()] = editedValue;

                        // Find the index of the parent row in the questions array
                        var parentRowIndex = questions.findIndex((row) => row === parentRowData);

                        if (parentRowIndex !== -1) {
                          // If the parent row is found in the questions array,
                          // update the corresponding property in the questions array
                          questions[parentRowIndex][cell.getField()] = editedValue;
                        }
                      }
                    },

                        });

                    // Append the subTable container to the cell
                    row.getElement().appendChild(subTableContainer);
                      
                    setTimeout(function () {
                        $("#smartwizard").smartWizard("fixHeight");
                    }, 200);

                  }
                },
            });



            // function to update the table when the questions data changes
            window.updateQuestionsTable = function () {
                // Add the child rows for each question
                questions.forEach(function (question) {
                    question.ChildRows = [
                        {
                            Answer: question.Answer !== "\u0000" ? question.Answer : question.Answers,
                            Options: Array.isArray(question.Options) ? question.Options.map(option => option.Text).join(", ") : question.Options || "",
                            CorrectOrder: question.CorrectOrder || "",
                            Explanation: question.Explanation || "",
                            Dropdowns:  Array.isArray(question.Dropdowns) ? question.Dropdowns.map(Dropdown => Dropdown.Text).join(", ") : question.Dropdowns || "",
                            Template: question.Template || "",
                        },
                    ];
                    
                    if (!question.Type) {
                        // If "Type" is not defined or null, use "IsMultipleAnswer" to set the type
                        question.Type = question.IsMultipleAnswer ? "MultipleAnswer" : "SingleAnswer";
                    }
                    
                });
                

                table.setData(questions);
                setTimeout(function () {
                    $("#smartwizard").smartWizard("fixHeight");
                }, 150);
            };

            // Call the updateQuestionsTable function to populate the table initially
            updateQuestionsTable();
        });

// Function to load available exams
function loadAvailableExams() {
    $.ajax({
        url: './PHP/list-exams.php', // URL to your existing script
        success: (data) => {
            const examButtonsDiv = document.getElementById('examButtons');
            examButtonsDiv.innerHTML = ''; // Clear existing buttons

            // Populate the examButtons div with available exams as buttons
            data.forEach((fileName) => {
                const button = document.createElement('button');
                button.textContent = fileName;
                button.onclick = () => loadSelectedExam(fileName); // Add onclick event to load the selected exam
                examButtonsDiv.appendChild(button);
            });
        }
    });
}

// Function to handle Upload Custom Exam button click
function uploadCustomExam() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = (event) => handleFileUpload(event.target.files[0]);
    fileInput.click();
    setTimeout(function () {
        $("#smartwizard").smartWizard("fixHeight");
    }, 500);
}

// Function to load selected exam
function loadSelectedExam(fileName) {
    $.ajax({
        url: './PHP/get-exam.php', // URL to the server-side script to get the selected exam
        data: { fileName: fileName },
        dataType: 'json', // Ensure that the response is treated as JSON
        success: (data) => {
            // Extract properties from the data
            const properties = data.Properties;
            const sections = data.Sections;

            // Populate the examDetails var
            examDetails.title = properties.Title;
            examDetails.certLevel = properties.CertLevel;
            examDetails.code = properties.Code;
            examDetails.version = properties.Version;
            examDetails.passmark = properties.Passmark;
            examDetails.timeLimit = properties.TimeLimit;

            // Fill in the relevant UI fields with loaded data
            document.getElementById('title').value = examDetails.title;
            document.getElementById('certLevel').value = examDetails.certLevel;
            document.getElementById('code').value = examDetails.code;
            document.getElementById('version').value = examDetails.version;
            document.getElementById('passmark').value = examDetails.passmark;
            document.getElementById('timeLimit').value = examDetails.timeLimit;

            // Call your function to update the image based on the certLevel
            updateImage();

            // Assuming that the questions are within the first section
            if (sections && sections.length > 0 && sections[0].Questions) {
                // Populate the questions array and render the questions
                questions = sections[0].Questions;
            }

            // Hide the initial form and show the Create New Exam form
            document.getElementById('initial-form').classList.add('hidden');
            document.getElementById('create-new-form').classList.remove('hidden');
            $("#NexExamTitleText").text("Loaded the " + examDetails.code + " exam...");
            $('#smartwizard').smartWizard("fixHeight");
            UpdateQuestionDisplay();
            
        }
    });
}

function updatePaginationMessage(message) {
    // Check if the pagination message div already exists
    var paginationDiv = document.getElementById("pagination-message");

    if (!paginationDiv) {
        // If the div doesn't exist, create a new one
        paginationDiv = document.createElement("div");
        paginationDiv.id = "pagination-message";
        paginationDiv.classList.add("toolbar-item");

        // Append the div to the toolbar
        var toolbar = table.getHeaderContent();
        toolbar.appendChild(paginationDiv);
    }

    // Set the message as the inner text of the div
    paginationDiv.innerText = message;
}

// Function to handle the file upload
function handleFileUpload(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const jsonString = event.target.result;
        const examJSON = JSON.parse(jsonString);

        // Populate the examDetails var
        const properties = examJSON.Properties;
        examDetails.title = properties.Title;
        examDetails.certLevel = properties.CertLevel;
        examDetails.code = properties.Code;
        examDetails.version = properties.Version;
        examDetails.passmark = properties.Passmark;
        examDetails.timeLimit = properties.TimeLimit;

        // Fill in the relevant UI fields with loaded data
        document.getElementById('title').value = examDetails.title;
        document.getElementById('certLevel').value = examDetails.certLevel;
        document.getElementById('code').value = examDetails.code;
        document.getElementById('version').value = examDetails.version;
        document.getElementById('passmark').value = examDetails.passmark;
        document.getElementById('timeLimit').value = examDetails.timeLimit;

        // Assuming that the questions are within the first section
        const sections = examJSON.Sections;
        if (sections && sections.length > 0 && sections[0].Questions) {
            // Populate the questions array and render the questions
            questions = sections[0].Questions;
        }

        // Hide the initial form and show the Create New Exam form
        document.getElementById('initial-form').classList.add('hidden');
        document.getElementById('create-new-form').classList.remove('hidden');
    };
    reader.readAsText(file);
    setTimeout(function () {
        $("#smartwizard").smartWizard("fixHeight");
        UpdateQuestionDisplay();
    }, 150);
}

// Function to handle the Create New Exam button click
function createNewExam() {
    // Show the Create New Exam form and hide the initial form
    document.getElementById('initial-form').classList.add('hidden');
    document.getElementById('create-new-form').classList.remove('hidden');
    $('#smartwizard').smartWizard("fixHeight");
}

// Function to show the Modify Existing Exam form
function showModifyExistingForm() {
    document.getElementById('initial-form').classList.add('hidden');
    document.getElementById('modify-existing-form').classList.remove('hidden');

    // Load available exams for modification
    loadAvailableExams();
    setTimeout(function () {
        $("#smartwizard").smartWizard("fixHeight");
    }, 150);
}

// Function to handle the Modify Existing Exam button click
function modifyExistingExam() {
    // Hide the initial form and show the Modify Existing Exam form
    showModifyExistingForm();
    setTimeout(function () {
        $("#smartwizard").smartWizard("fixHeight");
        UpdateQuestionDisplay();   
    }, 150);
}

// Function to load available exams
function loadAvailableExams() {
  $.ajax({
    url: './PHP/list-exams.php', // URL to your existing script
    success: (data) => {
      const examSelectorDiv = document.getElementById('examSelector');
      examSelectorDiv.innerHTML = ''; // Clear existing options

      // Populate the examSelector div with available exams as buttons
      data.forEach((fileName) => {
        const button = document.createElement('button');
        button.textContent = fileName;
        button.onclick = () => loadSelectedExam(fileName); // Add onclick event to load the selected exam
        examSelectorDiv.appendChild(button);
      });
    }
  });
}

function validateInitialForm() {
    var isValid = true;

    // List all required fields in the initial form
    var requiredFields = ['#title', '#certLevel', '#code', '#version', '#passmark', '#timeLimit'];

    // Loop through the required fields and check if they are filled
    requiredFields.forEach(function (field) {
        if ($(field).val() === "") {
            isValid = false;
            $(field).css('border', '1px solid red'); // Highlight the field in red if it's empty
        } else {
            $(field).css('border', ''); // Reset border if filled
        }
    });

    if (!isValid) {
        console.log("Please fill in all the required fields in the initial form.");
    }

    return isValid; // Return the validation result
}

function reviewQuestions() {
    UpdateQuestionDisplay();
    updateQuestionsTable(); // This will update the table with the latest questions data
    $('#smartwizard').smartWizard("fixHeight"); // Adjust the Smart Wizard height
}

function generateExamJSON() {
    UpdateQuestionDisplay();
    removeChildRowsFromQuestions();
    examJSON = {
        NumberOfQuestions: questions.length,
        Properties: {
            Title: examDetails.title,
            CertLevel: parseInt(examDetails.certLevel),
            Code: examDetails.code,
            Version: examDetails.version,
            Passmark: examDetails.passmark,
            TimeLimit: examDetails.timeLimit,
            Instructions: "" // You can add instructions if you have them
        },
        Sections: [{
            Title: "Exam Questions",
            Questions: questions
        }]
    };
    return examJSON;
}

function toggleCodeBlock() {
    var codeBlock = document.getElementById("result-json");
    codeBlock.classList.toggle("expanded");
    
      var showMoreButton = document.getElementById('show-more-button');
      if (codeBlock.classList.contains('expanded')) {
        showMoreButton.textContent = 'Show Less';
      } else {
        showMoreButton.textContent = 'Show More';
      }
    
    Prism.highlightElement(document.getElementById('json-output'));
    $('#smartwizard').smartWizard("fixHeight");
}

function showCreateNewForm() {
    document.getElementById('initial-form').classList.add('hidden');
    document.getElementById('create-new-form').classList.remove('hidden');
    $('#smartwizard').smartWizard("fixHeight");
}

function uploadExamJSON() { 
    examJSON = {
        NumberOfQuestions: questions.length,
        Properties: {
            Title: examDetails.title,
            CertLevel: parseInt(examDetails.certLevel),
            Code: examDetails.code,
            Version: examDetails.version,
            Passmark: examDetails.passmark,
            TimeLimit: examDetails.timeLimit,
            Instructions: "" 
        },
        Sections: [{
            Title: "Exam Questions",
            Questions: questions
        }]
    };
    var ExamCode = examDetails.code
    var examFile = ExamCode + ".json";  
    $.ajax({
        type: 'POST',
        url: './PHP/upload-exam.php', 
        data: JSON.stringify({ data: examJSON, fileName: examFile }),
        contentType: 'application/json',
        success: () => {
            Swal.fire({
                position: 'top-end',
                icon: 'success',
                title: examFile + ' uploaded successfully',
                showConfirmButton: false,
                timer: 1500,
                toast: true
            });
        },
        error: () => {
            Swal.fire({
                position: 'top-end',
                icon: 'error',
                title: 'An error occurred uploading ' + examFile,
                showConfirmButton: false,
                timer: 1500,
                toast: true
            });
        }
    });
}

function addDragAndDropOption() {
    const optionsContainer = document.getElementById('AddOptionsContainer');
    const optionDiv = document.createElement('div');
    const input = document.createElement('input');
    input.type = "text";
    optionDiv.appendChild(input);

    const addButton = document.createElement('button');
    addButton.innerHTML = "Add Option to List";
    addButton.onclick = function() {
        createClickableOption(input.value);
        // Hide the input and button
        input.style.display = 'none';
        addButton.style.display = 'none';
    };
    optionDiv.appendChild(addButton);

    optionsContainer.appendChild(optionDiv);
    $('#smartwizard').smartWizard("fixHeight");
}

function createClickableOption(optionText) {
    const optionsContainer = document.getElementById('dragAndDropOptionsContainer');
    const availableOptionsContainer = document.getElementById('AvailableOptionsDAD');
    availableOptionsContainer.classList.remove('hidden');
    availableOptionsContainer.classList.add('visible');
    const optionSpan = document.createElement('span');
    optionSpan.innerHTML = optionText;
    optionSpan.className = 'clickable-option'; // You can style this class as needed
    optionSpan.onclick = function() { addCorrectOrderOption(optionText); };
    optionsContainer.appendChild(optionSpan);
}

function addCorrectOrderOption(optionText) {
    const correctOrderContainer = document.getElementById('CorrectOrderDAD');
    const correctOrderContainer1 = document.getElementById('correctOrderContainer');
    
    // Check if the container is empty and set it to visible
    if (correctOrderContainer1.innerHTML.trim() === '') {
        correctOrderContainer.classList.remove('hidden');
        correctOrderContainer.classList.add('visible');
    }

    // Add the correct order item as usual
    const orderDiv = document.createElement('div');
    orderDiv.innerHTML = optionText;
    orderDiv.className = 'correct-order-item';
    correctOrderContainer1.appendChild(orderDiv);

    $('#smartwizard').smartWizard("fixHeight");
}

function saveOptions() {
  const options = [];
  for (const input of generatedOptions) {
    options.push(input.value);
  }

  // Clear the options container
  const optionsContainer = document.getElementById('AddOptionsContainer');
  optionsContainer.innerHTML = '';
  generatedOptions = []; // Clear the generated options array

  // Display the saved options in the available options container
  const availableOptionsContainer = document.getElementById('AvailableOptionsDAD');
  availableOptionsContainer.innerHTML = ''; // Clear existing options
  availableOptionsContainer.classList.remove('hidden');
  availableOptionsContainer.classList.add('visible');

  for (const option of options) {
    const optionSpan = document.createElement('span');
    optionSpan.innerHTML = option;
    optionSpan.className = 'clickable-option'; // You can style this class as needed
    optionSpan.onclick = function() { addCorrectOrderOption(option); };
    availableOptionsContainer.appendChild(optionSpan);
  }
  $('#SaveDADOptions').hide();
  // Fix the content height of the current step
  $('#smartwizard').smartWizard('fixHeight');
}


function saveDragAndDropQuestion(hideContainer) {
    var questionHTML = tinymce.get('dragAndDropQuestionText').getContent();
    var explanationHTML = tinymce.get('dragAndDropExplanationText').getContent();
    var availableOptions = [];
    $('#AvailableOptionsDAD span').each(function() {
        availableOptions.push($(this).text());
    });

    // Gather the correct order options
    var correctOrder = [];
    $('.correct-order-item').each(function() {
        correctOrder.push($(this).text());
    });

    // Create question object
    var question = {
        No: questions.length + 1,
        Text: questionHTML,
        Type: 'DragAndDrop',
        Options: availableOptions,
        Explanation: explanationHTML,
        RequiredOptions: correctOrder.length,
        CorrectOrder: correctOrder // Add the correct order to the question object
    };

    // Check the initial length of the questions array
    var initialLength = questions.length;
    // Push the question into the global questions array
    questions.push(question);
    // Check if the question has been successfully added
    if (questions.length > initialLength) {
        Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: 'Question has been successfully added.',
            showConfirmButton: false,
            timer: 1500,
            toast: true
        });
        UpdateQuestionDisplay();
    } else {
        Swal.fire({
            position: 'top-end',
            icon: 'error',
            title: 'There was a problem adding the question.',
            showConfirmButton: false,
            timer: 1500,
            toast: true
        });
    }

    console.log("Drag And Drop Question saved:", question);

    $('#dragAndDropQuestionText').val('');
    tinymce.get('dragAndDropQuestionText').setContent('');
    tinymce.get('dragAndDropExplanationText').setContent('');
    $('#requiredOptions').val('');
    $('#dragAndDropOptionsContainer').empty();
    $('#correctOrderContainer').empty();
    $('#dragAndDropExplanationText').val('');

    if (hideContainer) {
        $('#GenerateDragAndDrop').hide();
        $('#smartwizard').smartWizard("fixHeight");
    }

    UpdateQuestionDisplay();
    saveQuestions();

}

let generatedOptions = [];

function generateOptions() {
  const numOptions = parseInt($('#numOptions').val());
  const optionsContainer = document.getElementById('AddOptionsContainer');
  optionsContainer.innerHTML = ''; // Clear existing options
  generatedOptions = []; // Clear previously generated options

  for (let i = 0; i < numOptions; i++) {
    const optionDiv = document.createElement('div');
    const input = document.createElement('input');
    input.type = 'text';
    optionDiv.appendChild(input);
    optionsContainer.appendChild(optionDiv);
    generatedOptions.push(input); // Store the generated input in the array
  }
  $('#SaveDADOptions').show();
  // Fix the content height of the current step
  $('#smartwizard').smartWizard('fixHeight');
}


function deleteQuestion(question) {
  Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
    if (result.isConfirmed) {
      // Find the index of the question in the questions array
      var index = questions.indexOf(question);

      // Remove the question at the given index from the questions array
      if (index !== -1) {
        questions.splice(index, 1);

        // Update the display
        reviewQuestions();

        Swal.fire(
          'Deleted!',
          'Your question has been deleted.',
          'success'
        );
      }
      saveQuestions();
    }
  });
}


function editQuestion(index) {
  // Get the question to edit
  var questionToEdit = questions[index];

  // Determine the type of question and pre-fill a form accordingly
  switch (questionToEdit.Type) {
    case 'SingleAnswer':
      renderSingleAnswerForm(questionToEdit);
      break;
    case 'MultipleAnswer':
      renderMultipleAnswerForm(questionToEdit);
      break;
    case 'Dropdown':
      renderDropdownForm(questionToEdit);
      break;
    case 'DropdownInText':
      renderDropdownInTextForm(questionToEdit);
      break;
    case 'DragAndDrop':
      renderDragAndDropForm(questionToEdit);
      break;
    case 'SortList':
      renderSortListForm(questionToEdit);
      break;
  }

  // Display the form to the user (this will depend on your UI design)
  showEditForm();
}

function addDropdownOption() {
    const dropdownOptionsContainer = document.getElementById('dropdownOptionsContainer');
    const optionDiv = document.createElement('div');
    const optionLetter = alphabet[optionCount];
    optionCount++;

    optionDiv.innerHTML = `
        <label for="dropdownOption${optionLetter}Text">Dropdown ${optionCount}:</label>
        <input type="text" id="dropdownOption${optionLetter}Text" name="dropdownOption${optionLetter}Text">
        <button type="button" onclick="addChoice(this)">Add Choice</button>
        <div class="choicesContainer"></div>
        <br><br>
    `;

    dropdownOptionsContainer.appendChild(optionDiv);
    $('#smartwizard').smartWizard("fixHeight");
}

function addChoice(buttonElement) {
    const choicesContainer = buttonElement.nextElementSibling; // Get the choices container
    const choiceDiv = document.createElement('div');
    choiceDiv.innerHTML = `
        <input type="text" class="dropdownChoice">
        <input type="checkbox" class="dropdownCorrectChoice"> Correct<br>
    `;

    choicesContainer.appendChild(choiceDiv);
    $('#smartwizard').smartWizard("fixHeight");
}

function saveDropdownQuestion(hideContainer) {
    var questionHTML = tinymce.get('dropdownQuestionText').getContent();
    var explanationHTML = tinymce.get('dropdownExplanationText').getContent();

    var options = [];

    $('#dropdownOptionsContainer > div').each(function(index) {
        var optionText = $(this).find('input[type="text"]').eq(0).val();
        var choices = [];
        var correctChoice = null;

        $(this).find('.choicesContainer div').each(function(choiceIndex) {
            var choiceText = $(this).find('input[type="text"]').val();
            var isCorrect = $(this).find('input[type="checkbox"]').prop('checked');

            choices.push(choiceText);
            if (isCorrect) {
                correctChoice = choiceText; // Set the correct choice text instead of the index
            }
        });

        if (optionText && choices.length > 0) { // Make sure the option text and choices are not empty
            options.push({
                Alphabet: alphabet[index],
                Text: optionText,
                Choices: choices,
                Correct: correctChoice
            });
        }
    });

    var question = {
        No: questions.length + 1,
        Type: "Dropdown",
        Text: questionHTML,
        Options: options,
        Explanation: explanationHTML
    };

    // Check the initial length of the questions array 
    var initialLength = questions.length;  
    // Push the question into the global questions array 
    questions.push(question);  
    // Check if the question has been successfully added 
    if (questions.length > initialLength) {
        Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: 'Question has been successfully added.',
            showConfirmButton: false,
            timer: 1500,
            toast: true
        });
    } else {
        Swal.fire({
            position: 'top-end',
            icon: 'error',
            title: 'There was a problem adding the question.',
            showConfirmButton: false,
            timer: 1500,
            toast: true
        });
    }
    
    console.log("Dropdown Question saved:", question);
    tinymce.get('dropdownQuestionText').setContent('');
    tinymce.get('dropdownExplanationText').setContent('');
    $('#dropdownExplanationText').val('');
    $('#dropdownOptionsContainer').empty();
    optionCount = 0;
    
    if (hideContainer) {
        $('#GenerateDropdown').hide();
        $('#smartwizard').smartWizard("fixHeight");
    }

    UpdateQuestionDisplay();
    saveQuestions();
}

function addSortListOption() {
    const sortListOptionsContainer = document.getElementById('sortListOptionsContainer');
    const optionDiv = document.createElement('div');
    optionDiv.innerHTML = `<input type="text" class="sortListOption"><br>`;
    sortListOptionsContainer.appendChild(optionDiv);
    $('#smartwizard').smartWizard("fixHeight");
}

function GenerateSortList() {
    $('#GenerateSortList').show();
    $('#GenerateSingleAnswer').hide();
    $('#GenerateMultipleAnswer').hide();
    $('#smartwizard').smartWizard("fixHeight");
}

function saveSortListQuestion(hideContainer) {
    var questionHTML = tinymce.get('sortListQuestionText').getContent();
    var explanationHTML = tinymce.get('sortListExplanationText').getContent();

    var correctOrder = [];
    $('.sortListOption').each(function() {
        correctOrder.push($(this).val());
    });

    // Shuffle the options for displaying to the user
    var options = [...correctOrder];
    options = options.sort(() => Math.random() - 0.5);

    var question = {
        No: questions.length + 1,
        Type: "SortList",
        Text: questionHTML,
        Options: options,
        CorrectOrder: correctOrder,
        Explanation: explanationHTML
    };

    // Check the initial length of the questions array 
    var initialLength = questions.length;  
    // Push the question into the global questions array 
    questions.push(question);  
    // Check if the question has been successfully added 
    if (questions.length > initialLength) {
        Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: 'Question has been successfully added.',
            showConfirmButton: false,
            timer: 1500,
            toast: true
        });
    } else {
        Swal.fire({
            position: 'top-end',
            icon: 'error',
            title: 'There was a problem adding the question.',
            showConfirmButton: false,
            timer: 1500,
            toast: true
        });
    }
    console.log("SortList Question saved:", question);
    
    tinymce.get('sortListQuestionText').setContent('');
    tinymce.get('sortListExplanationText').setContent('');
    $('#sortListExplanationText').val('');
    $('#sortListOptionsContainer').empty();
    optionCount = 0;
    
    if (hideContainer) {
        $('#GenerateSortList').hide();
        $('#smartwizard').smartWizard("fixHeight");
    }

    UpdateQuestionDisplay();
    saveQuestions();
}


function saveMultipleQuestion(hideContainer) {
    var questionHTML = tinymce.get('multipleQuestionText').getContent();
    var explanationHTML = tinymce.get('MultipleAnswerExplanationText').getContent();
    var correctOptions = [];

    // Gather the selected checkboxes and get the option letter from the options array
    $('input[name="correctOption"]:checked').each(function() {
        var index = $('input[name="correctOption"]').index(this);
        correctOptions.push(alphabet[index]);
    });

    var options = [];

    // Gather the options
    $('#multipleOptionsContainer input[type="text"]').each(function(index) {
        options.push({
            Alphabet: alphabet[index],
            Text: $(this).val()
        });
    });

    // Create question object
    var question = {
        No: questions.length + 1, // Incremented by 1 since the array is 0-indexed
        Text: questionHTML,
        Type: "MultipleAnswer",
        Image: null,
        Answer: "\u0000",
        IsMultipleAnswer: true,
        Answers: correctOptions,
        Options: options,
        Explanation: explanationHTML
    };

    // Check the initial length of the questions array 
    var initialLength = questions.length;  
    // Push the question into the global questions array 
    questions.push(question);  
    // Check if the question has been successfully added 
    if (questions.length > initialLength) {
        Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: 'Question has been successfully added.',
            showConfirmButton: false,
            timer: 1500,
            toast: true
        });
    } else {
        Swal.fire({
            position: 'top-end',
            icon: 'error',
            title: 'There was a problem adding the question.',
            showConfirmButton: false,
            timer: 1500,
            toast: true
        });
    }
    
    console.log("Question saved:", question);

    tinymce.activeEditor.setContent(''); // Clear question text
    var questionHTML = tinymce.get('multipleQuestionText').getContent();
    var explanationHTML = tinymce.get('MultipleAnswerExplanationText').getContent();
    $('input[name="correctOption"]:checked').prop('checked', false); // Uncheck checkboxes
    $('#multipleOptionsContainer').empty(); // Remove all option inputs
    multipleOptionCount = 0;
    
    if (hideContainer) {
        $('#GenerateMultipleAnswer').hide();
        $('#smartwizard').smartWizard("fixHeight");
    }
    
     UpdateQuestionDisplay();
     saveQuestions();

}

function renderSingleAnswerForm(question) {
  // Get a reference to the container where you want to render the form
  var container = $('#editQuestionContainer');

  // Clear any existing content
  container.empty();

  // Create HTML elements for editing
  var questionText = $('<input type="text" id="editQuestionText" value="' + question.Text + '">');
  var explanationHTML = $('<input type="text" id="editExplanationText" value="' + question.Explanation + '">');
  
  container.append('<label for="editQuestionText">Question Text:</label>');
  container.append(questionText);
  container.append('<label for="editExplanationText">Explanation Text:</label>');
  container.append(explanationHTML);
  
  // Iterate through the options and create input fields for them
  var optionsContainer = $('<div id="editOptionsContainer"></div>');
  question.Options.forEach(function(option, index) {
    var optionInput = $('<input type="text" value="' + option.Text + '">');
    var radioBtn = $('<input type="radio" name="editCorrectOption" value="' + option.Alphabet + '">');
    if (question.Answer === option.Alphabet) {
      radioBtn.prop('checked', true);
    }
    optionsContainer.append(optionInput);
    optionsContainer.append(radioBtn);
  });

  container.append(optionsContainer);

  // You can add buttons or other controls to handle saving, deleting, etc.
  $('#smartwizard').smartWizard("fixHeight");
   UpdateQuestionDisplay();
}

function saveQuestion(hideContainer) {
//    var questionHTML = $('#questionHTML').val();
//    questionHTML = addBreaksBeforeLastQuestion(questionHTML);
//    questionHTML = addBreaksToQuestionText(questionHTML);
    var questionHTML = tinymce.get('questionText').getContent();
    var explanationHTML = tinymce.get('explanationText').getContent();

    var correctOption = $('input[name="correctOption"]:checked').val().substring(6); // Get the letter from the selected radio box
    console.log("selected answer is " + correctOption);
    var options = [];

    // Gather the options
    $('#optionsContainer input[type="text"]').each(function(index) {
        options.push({
            Alphabet: alphabet[index],
            Text: $(this).val()
        });
    });

    // Create question object
    var question = {
        No: questions.length + 1, // Incremented by 1 since array is 0-indexed
        Text: questionHTML,
        Type: "SingleAnswer",
        Image: null,
        Answer: correctOption,
        IsMultipleAnswer: false,
        Answers: null,
        Options: options,
        Explanation: explanationHTML
    };

    // Check the initial length of the questions array 
    var initialLength = questions.length;  
    // Push the question into the global questions array 
    questions.push(question);  
    // Check if the question has been successfully added 
    if (questions.length > initialLength) {
        Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: 'Question has been successfully added.',
            showConfirmButton: false,
            timer: 1500,
            toast: true
        });
    } else {
        Swal.fire({
            position: 'top-end',
            icon: 'error',
            title: 'There was a problem adding the question.',
            showConfirmButton: false,
            timer: 1500,
            toast: true
        });
    }
    
    console.log("Question saved:", question);

    tinymce.get('questionText').setContent('');
    tinymce.get('explanationText').setContent('');
    $('input[name="correctOption"]:checked').prop('checked', false); // Uncheck radio buttons
    $('#optionsContainer').empty(); // Remove all option inputs
    $('#questionType').val('');
    optionCount = 0;
    
    if (hideContainer) {
        $('#GenerateSingleAnswer').hide();
        $('#smartwizard').smartWizard("fixHeight");
    }
    
    UpdateQuestionDisplay();
    saveQuestions();
}


function callGenerateFunction(selectedValue) {
    const functionName = 'Generate' + selectedValue;
    if (typeof window[functionName] === 'function') {
      window[functionName]();
    }
}

function initTinyMCE(selector) {
    tinymce.init({
        selector: selector,
        valid_styles: {
            '*': 'text-align,font-size,font-weight,font-family,text-decoration' // Exclude color-related styles
        },
        toolbar: 'undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | outdent indent | link image',
        menubar: false,
        plugins: 'autoresize',
        autoresize_min_height: 100,
        autoresize_max_height: 500,
        init_instance_callback: function (editor) {
            editor.on('ResizeEditor', function (e) {
                $('#smartwizard').smartWizard("fixHeight");
            });
        }
    });
}

function GenerateDragAndDrop(){
    $('#GenerateSortList').hide();
    $('#GenerateSingleAnswer').hide();
    $('#GenerateDropdown').hide();    
    $('#GenerateMultipleAnswer').hide();
    $('#GenerateDragAndDrop').show();
    initTinyMCE('#dragAndDropExplanationText');
    initTinyMCE('#dragAndDropQuestionText'); 
    timeout = setTimeout(function() {
        console.log("Fixing smart wizard height");
        $("#smartwizard").smartWizard("fixHeight");
    }, 200); // Adjust the delay as needed
}

function GenerateMultipleAnswer(){
    $('#GenerateSingleAnswer').hide();
    $('#GenerateMultipleAnswer').show();
    $('#GenerateDragAndDrop').hide();
    $('#GenerateSortList').hide();
    $('#GenerateDropdown').hide();
    initTinyMCE('#multipleQuestionText');
    initTinyMCE('#MultipleAnswerExplanationText');
    timeout = setTimeout(function() {
        console.log("Fixing smart wizard height");
        $("#smartwizard").smartWizard("fixHeight");
    }, 200); // Adjust the delay as needed
}
function GenerateSingleAnswer(){
    $('#GenerateSingleAnswer').show();
    $('#GenerateMultipleAnswer').hide();
    $('#GenerateDragAndDrop').hide();
    $('#GenerateSortList').hide();
    $('#GenerateDropdown').hide();
    initTinyMCE('#questionText');
    initTinyMCE('#explanationText');
    timeout = setTimeout(function() {
        console.log("Fixing smart wizard height");
        $("#smartwizard").smartWizard("fixHeight");
    }, 200); // Adjust the delay as needed
}
function GenerateDropdown(){
    $('#GenerateSingleAnswer').hide();
    $('#GenerateMultipleAnswer').hide();
    $('#GenerateSortList').hide();
    $('#GenerateDragAndDrop').hide();
    $('#GenerateDropdown').show();
    initTinyMCE('#dropdownQuestionText');
    initTinyMCE('#dropdownExplanationText');
    initTinyMCE('#imageEditor');
    timeout = setTimeout(function() {
        console.log("Fixing smart wizard height");
        $("#smartwizard").smartWizard("fixHeight");
    }, 200); // Adjust the delay as needed
}
function GenerateSortList(){
    $('#GenerateSingleAnswer').hide();
    $('#GenerateMultipleAnswer').hide();
    $('#GenerateDragAndDrop').hide();
    $('#GenerateDropdown').hide();
    $('#GenerateSortList').show();
    initTinyMCE('#sortListQuestionText');
    initTinyMCE('#sortListExplanationText'); 
    timeout = setTimeout(function() {
        console.log("Fixing smart wizard height");
        $("#smartwizard").smartWizard("fixHeight");
    }, 200); // Adjust the delay as needed
}


$('#smartwizard').smartWizard().on("leaveStep", function(e, anchorObject, stepNumber, stepDirection) {
console.log("Navigating to next step from... " + stepNumber + " (type: " + typeof stepNumber + ") In direction... " + stepDirection + " (type: " + typeof stepDirection + ")");
if (stepNumber === 0 && stepDirection === 1) {
    // Collecting data from the first step
    var isValid = validateInitialForm();
    if (isValid) {
        console.log("Storing exam data in examDetails var");
        examDetails.title = $('#title').val();
        examDetails.certLevel = $('#certLevel').val();
        examDetails.code = $('#code').val();
        examDetails.version = $('#version').val();
        examDetails.passmark = $('#passmark').val();
        examDetails.timeLimit = $('#timeLimit').val();
        return true;
    }
    else {
        return false;
    }
} else if (stepNumber === 1 && stepDirection === 2) {
    reviewQuestions();
} else if (stepNumber === 3 && stepDirection === 2) {
    reviewQuestions();
} else if (stepNumber === 2 && stepDirection === 3) {
    var examJSON = generateExamJSON();
    console.log(JSON.stringify(examJSON, null, 2)); // Pretty prints the JSON to the console
    //save Exam JSON
    var examJSON = generateExamJSON();
    var jsonString = JSON.stringify(examJSON, null, 2); // Pretty prints the JSON
    // Assign the JSON string to the code block
    $('#json-output').text(jsonString);
    //Syntax highlighting
    Prism.highlightElement(document.getElementById('json-output'));
    //resize wizard to accomodate Jasons large size.
    $('#smartwizard').smartWizard("fixHeight");
}

else {
    console.log("Condition not met: stepNumber=" + stepNumber + ", stepDirection=" + stepDirection);
}

});

