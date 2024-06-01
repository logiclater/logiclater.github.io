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

let token = params.get('token');
if (!isValidToken(token)) {
    const tokenForm = document.createElement('form');
    const tokenInput = document.createElement('input');
    const submitButton = document.createElement('button');
    
    tokenForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const newToken = tokenInput.value;
    if (isValidToken(newToken)) {
        // Redirect to the same page with the new token as a query parameter
        window.location.href = `${window.location.origin}${window.location.pathname}?token=${newToken}`;
    } else {
        alert('Invalid token. Please try again.');
    }
    });
    
    tokenInput.setAttribute('type', 'text');
    submitButton.setAttribute('type', 'submit');
    submitButton.textContent = 'Submit';
    
    tokenForm.appendChild(tokenInput);
    tokenForm.appendChild(submitButton);
    
    document.querySelector('.container').appendChild(tokenForm);
}

function isValidToken(token) {
    // Add your token validation logic here
    // Return true if the token is valid, false otherwise
    return token && token.length > 0;
}

const currentDate = new Date();
const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

const startDate = startOfMonth.toISOString().split('T')[0];
const endDate = endOfMonth.toISOString().split('T')[0];

let incomeData;

fetch(`https://dev.lunchmoney.app/v1/budgets?start_date=${startDate}&end_date=${endDate}`, {
    headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
    }
}).then(response => response.json())
.then(data => {
    let budgets = data.filter(budget => !budget.exclude_from_budget && !budget.exclude_from_total && flatten(budget.data).length > 3);
    let income = budgets.filter(budget => budget.is_income === true);
    let expenses = budgets.filter(budget => budget.is_income === false);
    console.log(budgets);
    console.log(income);
    console.log(expenses);
    income.forEach(income => {
        const incomePanel = document.createElement('div');
        incomePanel.classList.add('income', 'container');
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
.catch(error => console.error(error));