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
	const notificationsCheckbox = document.getElementById('notificationsCheckbox');

	let previousFrame = null;
	let alarmTimeout = null;
	let nextAlarmTime = 0;
	let sensitivityRect = null;
	let savedPreference = localStorage.getItem('notifications');

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

						
						// Adicione essa verificação para notificações aqui
						if (notificationsCheckbox.checked) {
							alarm.play();
						}						
											
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
						// Criar um timestamp e desenhá-lo na imagem
						const timestamp = new Date().toLocaleString();
						context.font = '20px Arial';
						context.fillStyle = 'red';
						context.fillText(timestamp, 10, 30);

						const snapshot = new Image();
						snapshot.src = canvas.toDataURL();
						snapshot.onload = () => {
							while (snapshots.children.length >= 15) {
								snapshots.removeChild(snapshots.children[0]);
							}
							//snapshots.appendChild(snapshot);
							 snapshots.insertBefore(snapshot, snapshots.firstChild);
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


	notificationsCheckbox.addEventListener('change', function () {
		const bellIcon = document.getElementById('bellIcon');
		if (this.checked) {
			bellIcon.innerHTML = `<path d="M224 0c-17.7 0-32 14.3-32 32V51.2C119 66 64 130.6 64 208v18.8c0 47-17.3 92.4-48.5 127.6l-7.4 8.3c-8.4 9.4-10.4 22.9-5.3 34.4S19.4 416 32 416H416c12.6 0 24-7.4 29.2-18.9s3.1-25-5.3-34.4l-7.4-8.3C401.3 319.2 384 273.9 384 226.8V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32zm45.3 493.3c12-12 18.7-28.3 18.7-45.3H224 160c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7z"/>`;
		} else {
			bellIcon.innerHTML = `<path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7l-87.5-68.6c.5-1.7 .7-3.5 .7-5.4c0-27.6-11-54.1-30.5-73.7L512 320c-20.5-20.5-32-48.3-32-77.3V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32s-32 14.3-32 32V51.2c-42.6 8.6-79 34.2-102 69.3L38.8 5.1zM160 242.7c0 29-11.5 56.8-32 77.3l-1.5 1.5C107 341 96 367.5 96 395.2c0 11.5 9.3 20.8 20.8 20.8H406.2L160 222.1v20.7zM384 448H320 256c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7s18.7-28.3 18.7-45.3z"/>`;
		}		
		// Salvar a preferência do usuário no localStorage
		localStorage.setItem('notifications', notificationsCheckbox.checked);
	});


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


	// Carregar a preferência do usuário do localStorage
    if(savedPreference !== null) { // Se uma preferência foi salva
        // Definir o estado do checkbox de acordo com a preferência salva
        notificationsCheckbox.checked = (savedPreference == 'true');
        
        // Alternar o ícone do sino de acordo com a preferência salva
        const bellIcon = document.getElementById('bellIcon');
        if (notificationsCheckbox.checked) {
            bellIcon.innerHTML = `<path d="M224 0c-17.7 0-32 14.3-32 32V51.2C119 66 64 130.6 64 208v18.8c0 47-17.3 92.4-48.5 127.6l-7.4 8.3c-8.4 9.4-10.4 22.9-5.3 34.4S19.4 416 32 416H416c12.6 0 24-7.4 29.2-18.9s3.1-25-5.3-34.4l-7.4-8.3C401.3 319.2 384 273.9 384 226.8V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32zm45.3 493.3c12-12 18.7-28.3 18.7-45.3H224 160c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7z"/>`;
        } else {
            bellIcon.innerHTML = `<path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7l-87.5-68.6c.5-1.7 .7-3.5 .7-5.4c0-27.6-11-54.1-30.5-73.7L512 320c-20.5-20.5-32-48.3-32-77.3V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32s-32 14.3-32 32V51.2c-42.6 8.6-79 34.2-102 69.3L38.8 5.1zM160 242.7c0 29-11.5 56.8-32 77.3l-1.5 1.5C107 341 96 367.5 96 395.2c0 11.5 9.3 20.8 20.8 20.8H406.2L160 222.1v20.7zM384 448H320 256c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7s18.7-28.3 18.7-45.3z"/>`;
        }
    }

	
	
	
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