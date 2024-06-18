function inflationCalculator() {
	let inflationRate = parseFloat(document.querySelector('#inflationRate').value);
	let money = parseFloat(document.querySelector('#money').value);
	let years = parseFloat(document.querySelector('#years').value);

	if (isNaN(inflationRate) || isNaN(money) || isNaN(years)) {
		alert("Please enter valid numbers.");
		return;
	}

	let worth = money * Math.pow((1 + inflationRate / 100), years);

	let existingResult = document.querySelector('.new-value');
	if (existingResult) {
		existingResult.remove();
	}

	let newElement = document.createElement('div');
	newElement.className = 'new-value';
	newElement.innerText = `Today's ${money}€ will be worth the same as ${worth.toFixed(2)}€ in ${years} years.`;

	document.querySelector('.container').appendChild(newElement);
}
