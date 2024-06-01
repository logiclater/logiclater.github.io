// Function that flattens a json object and returns the number of keys
function flatten(obj) {
    let result = [];
    for (let key in obj) {
        if (obj[key] instanceof Object) {
            result = result.concat(flatten(obj[key]));
        } else {
            result.push(obj[key]);
        }
    }
    return result;
}

// Assume the URL is "http://example.com/?token=value1"
let params = new URLSearchParams(window.location.search);
let lastRunTime = null;
let token = params.get('token');
const currentDate = new Date();
const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
const startDate = startOfMonth.toISOString().split('T')[0];
const endDate = endOfMonth.toISOString().split('T')[0];

// Function that initializes the token form
function initializeTokenForm() {
    const tokenForm = document.createElement('form');
    const tokenInput = document.createElement('input');
    const submitButton = document.createElement('button');
    
    tokenForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const newToken = tokenInput.value;
        if (isValidToken(newToken)) {
            // Redirect to the same page with the new token as a query parameter
            window.location.href = `${window.location.origin}${window.location.pathname}?token=${btoa(newToken)}`;
        } else {
            alert('Invalid token. Please try again.');
        }
    });
    // Add label for the token input
    const tokenLabel = document.createElement('label');
    tokenLabel.textContent = 'Enter Lunch Money Token:';
    tokenLabel.setAttribute('for', 'token-input');
    tokenForm.appendChild(tokenLabel);
    
    tokenInput.setAttribute('type', 'text');
    submitButton.setAttribute('type', 'submit');
    submitButton.textContent = 'Submit';
    
    tokenForm.appendChild(tokenInput);
    tokenForm.appendChild(submitButton);
    
    document.querySelector('.container').appendChild(tokenForm);
}

// Function that updates the budget information
function updateBudget() {
    if (lastRunTime && (Date.now() - lastRunTime) < 30000) {
        console.log('Skipping update request.  Last update was within the last 30s');
        return; // Don't do anything if the function has run within the last 30 seconds
    }
    lastRunTime = Date.now(); // Update the last run time
    fetch(`https://dev.lunchmoney.app/v1/budgets?start_date=${startDate}&end_date=${endDate}`, {
        headers: {
            'Authorization': `Bearer ${atob(token)}`,
            'Content-Type': 'application/json'
        }
    }).then(response => response.json())
    .then(data => {
        $('#refresh').css('transition', 'none');
        $('#refresh').css('transform', 'rotate(0deg)');
        $('#refresh').css('transition', 'transform 3s');
        $('#refresh').css('transform', 'rotate(-1080deg)');
        let budgets = data.filter(budget => !budget.exclude_from_budget && !budget.exclude_from_total && flatten(budget.data).length > 3);
        let income = budgets.filter(budget => budget.is_income === true);
        let expenses = budgets.filter(budget => budget.is_income === false);
        console.log("Income: ", income);
        console.log("Expenses: ", expenses);
        // Clear existing income and expense panels
        document.querySelector('div.income').innerHTML = '';
        document.querySelector('div.expenses').innerHTML = '';
        income.forEach(income => {
            const incomePanel = document.createElement('div');
            incomePanel.classList.add('income', 'container');
            if (!income.is_group) {
                incomePanel.classList.add('subgroup')
            }
            incomePanel.innerHTML = `
                <div class="header" style="width:100%;">
                    <span class="cat-title" style="float: left;">${income.category_name}</span>
                    <span class="amount" style="float: right;">${income.data[startDate]["budget_amount"]}</span>
                </div>
            `;
            const progressBar = document.createElement('div');
            progressBar.classList.add('progress', 'mb-3');
            const progressBarInner = document.createElement('div');
            progressBarInner.classList.add('progress-bar');
            progressBarInner.setAttribute('role', 'progressbar');
            progressBarInner.setAttribute('aria-valuenow', `${(income.data[startDate]["budget_amount"] / income.data[startDate]["spending_to_base"]) * 100}`);
            progressBarInner.setAttribute('aria-valuemin', '0');
            progressBarInner.setAttribute('aria-valuemax', '100');
            progressBarInner.style.width = `${(income.data[startDate]["budget_amount"] === 0 ? 100 : (income.data[startDate]["budget_amount"] / income.data[startDate]["spending_to_base"]) * 100)}%`;
            progressBar.appendChild(progressBarInner);
            incomePanel.appendChild(progressBar);
            document.querySelector('.income').appendChild(incomePanel);
        });
        expenses.forEach(expense => {
            const expensePanel = document.createElement('div');
            expensePanel.classList.add('expense', 'container');
            if (!income.is_group) {
                expensePanel.classList.add('subgroup')
            }
            expensePanel.innerHTML = `
                <div class="header" style="width:100%;">
                    <span class="cat-title" style="float: left;">${expense.category_name}</span>
                    <span class="amount" style="float: right;">${expense.data[startDate]["budget_amount"]}</span>
                </div>
            `;
            const progressBar = document.createElement('div');
            progressBar.classList.add('progress', 'mb-3');
            const progressBarInner = document.createElement('div');
            progressBarInner.classList.add('progress-bar');
            progressBarInner.setAttribute('role', 'progressbar');
            progressBarInner.setAttribute('aria-valuenow', `${(expense.data[startDate]["budget_amount"] / expense.data[startDate]["spending_to_base"]) * 100}`);
            progressBarInner.setAttribute('aria-valuemin', '0');
            progressBarInner.setAttribute('aria-valuemax', 100);
            progressBarInner.style.width = `${(expense.data[startDate]["budget_amount"] / expense.data[startDate]["spending_to_base"]) * 100}%`;
            progressBar.appendChild(progressBarInner);
            expensePanel.appendChild(progressBar);
            document.querySelector('.expenses').appendChild(expensePanel);
        });
    })
    .catch(error => { 
        console.error(error);
        initializeTokenForm();

    });
}

// Function that checks if a token is valid
function isValidToken(t) {
    // Return true if the value of `t` is > 0 chars
    return t && t.length > 0;
}


// Function that initializes the script
function initializeScript() {
    // Call the initializeScript function to start the script
    lastRunTime = null;
    if (!isValidToken(token)) {
        initializeTokenForm();
    } else { 
        updateBudget();
    }
    setInterval(() => {updateBudget()}, 300000); // 5 min in milliseconds
}

function _init() {
    // Wait for the DOM content to load before initializing the script
    document.addEventListener('DOMContentLoaded', initializeScript());
}

_init();