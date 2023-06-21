document.addEventListener('DOMContentLoaded', function() {
	const video = document.getElementById('webcam');
	const alarm = document.getElementById('alarm');
	const sensitivitySlider = document.getElementById('sensitivity');
	const alarmIntervalSlider = document.getElementById('alarmInterval');
	const intervalSlider  = document.getElementById('interval'); 

	const sensitivityValue = document.getElementById('sensitivityValue');
	const intervalValue = document.getElementById('intervalValue');
	const alarmIntervalValue = document.getElementById('alarmIntervalValue');
	const snapshots = document.getElementById('snapshots');
	const overlay = document.getElementById('overlay');

	let previousFrame = null;
	let alarmTimeout = null;
	let nextAlarmTime = 0;
	let sensitivityRect = null;

	function checkForMotion() {
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		context.drawImage(video, 0, 0, canvas.width, canvas.height);
		const currentFrame = context.getImageData(0, 0, canvas.width, canvas.height);

		let movementDetectedAt = null;
		
		if (previousFrame && sensitivityRect) {
			let diff = 0;
			for (let y = sensitivityRect.y; y < sensitivityRect.y + sensitivityRect.height; y++) {
				for (let x = sensitivityRect.x; x < sensitivityRect.x + sensitivityRect.width; x++) {
					const i = (y * canvas.width + x) * 4;
					const r = Math.abs(currentFrame.data[i] - previousFrame.data[i]);
					const g = Math.abs(currentFrame.data[i + 1] - previousFrame.data[i + 1]);
					const b = Math.abs(currentFrame.data[i + 2] - previousFrame.data[i + 2]);
					const pixelDiff = r + g + b;
					diff += pixelDiff;

					// Se movimento foi detectado e ainda não tínhamos a posição inicial
					if (pixelDiff > sensitivitySlider.value && !movementDetectedAt) {
						movementDetectedAt = { x, y };
					}
				}
			}


			if (diff > sensitivitySlider.value * 5000) {

				
				// Desenha uma seta apontando para a primeira detecção de movimento
				if (movementDetectedAt) {

					if (Date.now() > nextAlarmTime) {
						alarm.play();
						nextAlarmTime = Date.now() + alarmIntervalSlider.value * 1000;
							 // início da linha da seta
						context.beginPath();
						context.moveTo(movementDetectedAt.x, movementDetectedAt.y); 
						// desenhar linha central da seta para a direita
						context.lineTo(movementDetectedAt.x + 30, movementDetectedAt.y); 
						// desenhar linha superior da ponta da seta
						context.lineTo(movementDetectedAt.x + 20, movementDetectedAt.y - 10);
						// mover para a base da ponta da seta
						context.moveTo(movementDetectedAt.x + 20, movementDetectedAt.y + 10);
						// concluir a ponta da seta
						context.lineTo(movementDetectedAt.x + 30, movementDetectedAt.y);
						context.strokeStyle = 'red';
						context.lineWidth = 3;
						context.stroke();

						const snapshot = new Image();
						snapshot.src = canvas.toDataURL();
						snapshot.onload = () => {
							while (snapshots.children.length >= 15) {
								snapshots.removeChild(snapshots.children[0]);
							}
							snapshots.appendChild(snapshot);
							snapshot.onclick = function() {
									const modal = document.getElementById('modal');
									const modalImg = document.getElementById('modal-content');
									modal.style.display = 'block';
									modalImg.src = this.src;
								};						
						};
					}	
					
					
				}

					
			}
		}


		previousFrame = currentFrame;
		setTimeout(checkForMotion, 200);
	}


	// Salvar valores no localStorage quando eles mudam
	sensitivitySlider.addEventListener('input', () => {
		sensitivityValue.textContent = sensitivitySlider.value;
		localStorage.setItem('sensitivity', sensitivitySlider.value);
	});

	alarmIntervalSlider.addEventListener('input', () => {
		alarmIntervalValue.textContent = alarmIntervalSlider.value;
		localStorage.setItem('alarmInterval', alarmIntervalSlider.value);
	});

	intervalSlider.addEventListener('input', () => {
		intervalValue.textContent = intervalSlider.value;
		localStorage.setItem('interval', intervalSlider.value);
	});

	// Para carregar do localStorage (adicione isso após a definição dos elementos do DOM)
	// Carregar valores do localStorage
	sensitivitySlider.value = localStorage.getItem('sensitivity') || 500;
	alarmIntervalSlider.value = localStorage.getItem('alarmInterval') || 10;
	intervalSlider.value = localStorage.getItem('interval') || 200;

	sensitivityValue.textContent = sensitivitySlider.value;
	alarmIntervalValue.textContent = alarmIntervalSlider.value;
	intervalValue.textContent = intervalSlider.value;

	let mouseDown = false;
	let startX, startY;

	video.addEventListener('mousedown', (event) => {
		if (event.button === 0) {
			mouseDown = true;
			const rect = video.getBoundingClientRect();
			startX = event.clientX - rect.left;
			startY = event.clientY - rect.top;
			overlay.style.width = '0';
			overlay.style.height = '0';
			overlay.style.left = `${startX}px`;
			overlay.style.top = `${startY}px`;
			overlay.style.display = 'block';
		}
	});

	video.addEventListener('mousemove', (event) => {
		if (mouseDown) {
			const rect = video.getBoundingClientRect();
			const mouseX = event.clientX - rect.left;
			const mouseY = event.clientY - rect.top;
			const width = mouseX - startX;
			const height = mouseY - startY;
			overlay.style.width = `${Math.abs(width)}px`;
			overlay.style.height = `${Math.abs(height)}px`;
			overlay.style.left = `${Math.min(startX, startX + width)}px`;
			overlay.style.top = `${Math.min(startY, startY + height)}px`;
		}
	});

	video.addEventListener('mouseup', (event) => {
		if (mouseDown) {
			mouseDown = false;
			const rect = video.getBoundingClientRect();
			const mouseX = event.clientX - rect.left;
			const mouseY = event.clientY - rect.top;
			sensitivityRect = {
				x: Math.min(startX, mouseX),
				y: Math.min(startY, mouseY),
				width: Math.abs(mouseX - startX),
				height: Math.abs(mouseY - startY),
			};
			localStorage.setItem('sensitivityRect', JSON.stringify(sensitivityRect));
		}
	});


	// Adicione isso ao final do arquivo
	const modal = document.getElementById('modal');
	const span = document.getElementsByClassName('close')[0];

	span.onclick = function() {
		modal.style.display = 'none';
	}

	navigator.mediaDevices.getUserMedia({ video: true })
		.then(stream => {
			video.srcObject = stream;
			// Carregar a região selecionada do localStorage quando o vídeo é carregado
			video.onloadedmetadata = () => {
				const savedSensitivityRect = localStorage.getItem('sensitivityRect');
				if (savedSensitivityRect) {
					sensitivityRect = JSON.parse(savedSensitivityRect);
					overlay.style.width = `${sensitivityRect.width}px`;
					overlay.style.height = `${sensitivityRect.height}px`;
					overlay.style.left = `${sensitivityRect.x}px`;
					overlay.style.top = `${sensitivityRect.y}px`;
					overlay.style.display = 'block';
				}
				setTimeout(checkForMotion, intervalSlider.value);
			};
		})
		.catch(console.error);
});