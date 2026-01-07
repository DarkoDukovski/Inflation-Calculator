'use strict';

let chartInstance = null;
let calculatorWrapper = null;
let backgroundOverlay = null;

document.addEventListener('DOMContentLoaded', function() {
	const form = document.getElementById('calculatorForm');
	const inputs = document.querySelectorAll('input[type="number"]');
	const calculateBtn = document.getElementById('calculateBtn');
	const currencySelect = document.getElementById('currency');
	calculatorWrapper = document.querySelector('.calculator-wrapper');
	backgroundOverlay = document.querySelector('.background-overlay');
	
	currencySelect.addEventListener('change', function() {
		const resultContainer = document.getElementById('result');
		if (resultContainer.querySelector('.new-value:not(.error)')) {
			inflationCalculator();
		}
	});
	
	form.addEventListener('submit', function(e) {
		e.preventDefault();
		if (calculatorWrapper && calculatorWrapper.classList.contains('has-results')) {
			resetCalculator();
		} else {
			inflationCalculator();
		}
	});
	
	inputs.forEach(input => {
		input.addEventListener('keypress', function(e) {
			if (e.key === 'Enter') {
				e.preventDefault();
				form.requestSubmit();
			}
		});
		
		input.addEventListener('focus', function() {
			this.parentElement.classList.add('focused');
		});
		
		input.addEventListener('blur', function() {
			this.parentElement.classList.remove('focused');
		});
	});
	
	calculateBtn.addEventListener('click', function(e) {
		this.classList.add('clicked');
		setTimeout(() => {
			this.classList.remove('clicked');
		}, 150);
	});
});

function resetCalculator() {
	const resultContainer = document.getElementById('result');
	const chartContainer = document.getElementById('chartContainer');
	const form = document.getElementById('calculatorForm');
	const calculateBtn = document.getElementById('calculateBtn');
	
	if (!resultContainer) {
		console.error('Result container not found');
		return;
	}
	
	resultContainer.innerHTML = '';
	resultContainer.classList.remove('show');
	
	if (chartContainer) {
		chartContainer.classList.remove('show');
		chartContainer.innerHTML = '';
		if (chartInstance) {
			chartInstance.destroy();
			chartInstance = null;
		}
	}
	
	if (calculatorWrapper) {
		calculatorWrapper.classList.remove('has-results');
	}
	if (backgroundOverlay) {
		backgroundOverlay.classList.remove('results-visible');
	}
	
	if (form) {
		form.reset();
	}
	
	if (calculateBtn) {
		const buttonText = calculateBtn.querySelector('.button-text');
		if (buttonText) {
			buttonText.textContent = 'Calculate';
		}
	}
	
	const firstInput = document.getElementById('inflationRate');
	if (firstInput) {
		setTimeout(() => {
			firstInput.focus();
		}, 100);
	}
}

function inflationCalculator() {
	const inflationRateInput = document.querySelector('#inflationRate');
	const moneyInput = document.querySelector('#money');
	const yearsInput = document.querySelector('#years');
	const currencySelect = document.querySelector('#currency');
	
	if (!inflationRateInput || !moneyInput || !yearsInput || !currencySelect) {
		console.error('Required form elements not found');
		return;
	}
	
	const inflationRate = parseFloat(inflationRateInput.value);
	const money = parseFloat(moneyInput.value);
	const years = parseFloat(yearsInput.value);
	const currency = currencySelect.value;

	if (isNaN(inflationRate) || inflationRate <= 0) {
		showError("Please enter a valid inflation rate (greater than 0).");
		inflationRateInput.focus();
		return;
	}

	if (isNaN(money) || money <= 0) {
		showError("Please enter a valid amount (greater than 0).");
		moneyInput.focus();
		return;
	}

	if (isNaN(years) || years <= 0 || !Number.isInteger(years)) {
		showError("Please enter a valid number of years (a positive whole number).");
		yearsInput.focus();
		return;
	}

	const rateDecimal = inflationRate / 100;
	const worth = money * Math.pow(1 + rateDecimal, years);

	
	const purchasingPowerLoss = worth - money;
	const lossPercentage = ((purchasingPowerLoss / money) * 100).toFixed(2);

	const resultContainer = document.getElementById('result');
	resultContainer.innerHTML = '';
	resultContainer.classList.remove('show');

	const newElement = document.createElement('div');
	newElement.className = 'new-value';
	
	const formattedMoney = formatNumber(money.toFixed(2));
	const formattedWorth = formatNumber(worth.toFixed(2));
	const formattedLoss = formatNumber(purchasingPowerLoss.toFixed(2));
	
	newElement.innerHTML = `
		<div class="result-main">
			Today's <strong>${escapeHtml(formattedMoney)}${currency}</strong> will have the same purchasing power as <strong>${escapeHtml(formattedWorth)}${currency}</strong> in <strong>${years} ${years === 1 ? 'year' : 'years'}</strong>.
		</div>
		<div class="result-loss">
			Purchasing power loss: ${escapeHtml(formattedLoss)}${currency} (${lossPercentage}%)
		</div>
	`;

	resultContainer.appendChild(newElement);
	
	if (calculatorWrapper) {
		calculatorWrapper.classList.add('has-results');
	}
	if (backgroundOverlay) {
		backgroundOverlay.classList.add('results-visible');
	}
	
	setTimeout(() => {
		resultContainer.classList.add('show');
	}, 50);
	
	updateChart(money, inflationRate, years, currency);
	
	const calculateBtn = document.getElementById('calculateBtn');
	if (calculateBtn) {
		const buttonText = calculateBtn.querySelector('.button-text');
		if (buttonText) {
			buttonText.textContent = 'Calculate Again';
		}
	}
	
}

function updateChart(initialAmount, inflationRate, years, currency) {
	const chartContainer = document.getElementById('chartContainer');
	
	if (!chartContainer) {
		console.error('Chart container not found');
		return;
	}
	
	const labels = [];
	const data = [];
	const rateDecimal = inflationRate / 100;
	
	for (let year = 0; year <= years; year++) {
		labels.push(year);
		const value = initialAmount * Math.pow(1 + rateDecimal, year);

		data.push(parseFloat(value.toFixed(2)));
	}
	
	if (chartInstance) {
		chartInstance.destroy();
	}
	
	let canvas = chartContainer.querySelector('canvas');
	if (!canvas) {
		canvas = document.createElement('canvas');
		canvas.id = 'purchasingPowerChart';
		chartContainer.innerHTML = '';
		chartContainer.appendChild(canvas);
	}
	
	const ctx = canvas.getContext('2d');
	chartInstance = new Chart(ctx, {
		type: 'line',
		data: {
			labels: labels,
			datasets: [{
				label: `Purchasing Power (${currency})`,
				data: data,
				borderColor: '#f093fb',
				backgroundColor: 'rgba(240, 147, 251, 0.1)',
				borderWidth: 3,
				fill: true,
				tension: 0.4,
				pointRadius: 4,
				pointHoverRadius: 6,
				pointBackgroundColor: '#f093fb',
				pointBorderColor: '#ffffff',
				pointBorderWidth: 2
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: true,
			aspectRatio: 2,
			plugins: {
				legend: {
					display: true,
					position: 'top',
					labels: {
						color: '#ffffff',
						font: {
							family: 'Inter',
							size: 14,
							weight: '600'
						},
						padding: 18
					}
				},
				tooltip: {
					backgroundColor: 'rgba(26, 26, 46, 0.95)',
					titleColor: '#ffffff',
					bodyColor: '#ffffff',
					borderColor: 'rgba(102, 126, 234, 0.5)',
					borderWidth: 1,
					padding: 12,
					displayColors: false,
					callbacks: {
						label: function(context) {
							return `${formatNumber(context.parsed.y.toFixed(2))}${currency}`;
						}
					}
				}
			},
			scales: {
				x: {
					title: {
						display: true,
						text: 'Years',
						color: '#b8b8d4',
						font: {
							family: 'Inter',
							size: 14,
							weight: '600'
						}
					},
					ticks: {
						color: '#b8b8d4',
						font: {
							family: 'Inter',
							size: 13
						}
					},
					grid: {
						color: 'rgba(255, 255, 255, 0.1)',
						drawBorder: false
					}
				},
				y: {
					title: {
						display: true,
						text: `Value in ${currency}`,
						color: '#b8b8d4',
						font: {
							family: 'Inter',
							size: 14,
							weight: '600'
						}
					},
					ticks: {
						color: '#b8b8d4',
						font: {
							family: 'Inter',
							size: 13
						},
						callback: function(value) {
							return formatNumber(value.toFixed(0)) + currency;
						}
					},
					grid: {
						color: 'rgba(255, 255, 255, 0.1)',
						drawBorder: false
					}
				}
			},
			animation: {
				duration: 1000,
				easing: 'easeInOutQuart'
			}
		}
	});
	
	setTimeout(() => {
		chartContainer.classList.add('show');
	}, 100);
}

function formatNumber(num) {
	if (typeof num !== 'number' && typeof num !== 'string') {
		return '0';
	}
	const numStr = typeof num === 'string' ? num : num.toString();
	// Split by decimal point to format integer and decimal parts separately
	const parts = numStr.split('.');
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	return parts.join('.');
}

function showError(message) {
	const resultContainer = document.getElementById('result');
	const chartContainer = document.getElementById('chartContainer');
	const calculateBtn = document.getElementById('calculateBtn');
	
	if (!resultContainer) {
		console.error('Result container not found');
		return;
	}
	
	if (calculatorWrapper) {
		calculatorWrapper.classList.add('has-results');
	}
	if (backgroundOverlay) {
		backgroundOverlay.classList.add('results-visible');
	}
	
	resultContainer.innerHTML = '';
	resultContainer.classList.remove('show');
	
	if (chartContainer) {
		chartContainer.classList.remove('show');
		chartContainer.innerHTML = '';
		if (chartInstance) {
			chartInstance.destroy();
			chartInstance = null;
		}
	}
	
	if (calculateBtn) {
		const buttonText = calculateBtn.querySelector('.button-text');
		if (buttonText) {
			buttonText.textContent = 'Calculate Again';
		}
	}
	
	const errorElement = document.createElement('div');
	errorElement.className = 'new-value error';
	errorElement.setAttribute('role', 'alert');
	errorElement.innerHTML = `<span class="error-message">⚠️ ${escapeHtml(message)}</span>`;
	
	resultContainer.appendChild(errorElement);
	
	setTimeout(() => {
		resultContainer.classList.add('show');
	}, 50);
}

function escapeHtml(text) {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}
