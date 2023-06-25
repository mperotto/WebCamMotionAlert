document.addEventListener('DOMContentLoaded', function() {
	const video = document.getElementById('webcam');
	const alarm = document.getElementById('alarm');
	const sensitivitySlider = document.getElementById('sensitivity');
	const alarmIntervalSlider = document.getElementById('alarmInterval');
	const intervalSlider  = document.getElementById('interval'); 
	const videoContainer = document.getElementById('videoContainer');
	const sensitivityValue = document.getElementById('sensitivityValue');
	const intervalValue = document.getElementById('intervalValue');
	const alarmIntervalValue = document.getElementById('alarmIntervalValue');
	const snapshots = document.getElementById('snapshots');
	const overlay = document.getElementById('overlay');
	const notificationsCheckbox = document.getElementById('notificationsCheckbox');
	const body = document.body;
	let previousFrame = null;
	let alarmTimeout = null;
	let nextAlarmTime = 0;
	let sensitivityRect = null;
	let savedPreference = localStorage.getItem('notifications');
	
	const totalSnapshots = 15;  // Defina o valor inicial aqui. Isso pode ser substituído por uma configuração do usuário.
	let thumbnails = []; // Inicializa a array de thumbnails
	let selectedIndex = -1; // Inicializa o índice selecionado
	let zoomModal = document.getElementById("zoomModal");
	var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
	// Inicializa o índice de visualização
	let viewIndex = -1;

	function dragMouseDown(e) {
		e = e || window.event;
		// obtenha a posição do cursor do mouse no momento do start:
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.onmouseup = closeDragElement;
		// chame a função sempre que o cursor se move:
		document.onmousemove = elementDrag;
	}

	function elementDrag(e) {
		e = e || window.event;
		// calcule a nova posição do cursor:
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		// defina a nova posição do elemento:
		zoomModal.style.top = (zoomModal.offsetTop - pos2) + "px";
		zoomModal.style.left = (zoomModal.offsetLeft - pos1) + "px";
	}

	function closeDragElement() {
		/* pare de mover quando o botão do mouse é solto: */
		document.onmouseup = null;
		document.onmousemove = null;
	}


	async function uploadImage(blob) {
		let formData = new FormData();

		// Cria uma data e formata em uma string de timestamp
		let timestamp = new Date().toISOString().replace(/:/g, '-');

		formData.append("file", blob, "snapshot-" + timestamp + ".png");

		fetch('http://localhost:8000/upload', {
			method: "POST",
			body: formData
		}).then(response => {
			console.log('Success:', response);
		}).catch(error => {
			console.error('Error:', error);
		});
	}



	function checkForMotion() {
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d', { willReadFrequently: true });
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		
		
		context.drawImage(video, 0, 0, canvas.width, canvas.height);
		let currentFrame = context.getImageData(0, 0, canvas.width, canvas.height);

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
					if (diff > sensitivitySlider.value * 2000 && !movementDetectedAt) {
						movementDetectedAt = { x, y };
						break;
					}
				}
			}

			
				// Desenha uma seta apontando para a primeira detecção de movimento
			if (movementDetectedAt) {

				if (Date.now() > nextAlarmTime) {

					// Capturar um novo quadro de vídeo
					context.drawImage(video, 0, 0, canvas.width, canvas.height);
					currentFrame = context.getImageData(0, 0, canvas.width, canvas.height);
					
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
					
					canvas.toBlob(function (blob) {
						const objectURL = URL.createObjectURL(blob);

						const snapshot = new Image();
						snapshot.src = objectURL;
						snapshot.onload = () => {
							thumbnails.push(snapshot); // Adicione a thumbnail à array
							selectedIndex = thumbnails.length - 1;

							while (snapshots.children.length >= totalSnapshots) {
								snapshots.removeChild(snapshots.children[0]);
							}

							snapshot.className = 'fade-in'; // adicione essa linha
							snapshots.appendChild(snapshot); // Use appendChild em vez de insertBefore

							// Inicie o upload da imagem
							uploadImage(blob).then(() => {
								console.log('Upload complete');
							}).catch(err => {
								console.error('Upload failed:', err);
							});

							snapshot.onclick = function () {
								const modalImg = document.getElementById('zoomModal-content');
								const closeBtn = document.getElementsByClassName('close')[0];
								modalImg.src = this.src;
								closeBtn.style.display = 'block';
								zoomModal.style.display = 'flex';

								// Encontre o índice da miniatura que foi clicada
								viewIndex = thumbnails.indexOf(this);

								thumbnails.forEach((thumbnail, index) => {
									if (index === viewIndex) {
										thumbnail.style.border = '3px solid red'; // Adiciona borda vermelha para a miniatura selecionada
									} else {
										thumbnail.style.border = 'none'; // Remove a borda das outras miniaturas
									}
								});
							};

							// Libere o URL do objeto após o uso
							URL.revokeObjectURL(objectURL);
						};
					}, 'image/png');

					movementDetectedAt = null;
				}
			}

					
			
		}


		previousFrame = currentFrame;
		setTimeout(checkForMotion, 200);
	}


	if(savedPreference !== null) { // Se uma preferência foi salva
		notificationsCheckbox.checked = (savedPreference == 'true');
	}

	// Ajuste inicial do ícone do sino
	if (notificationsCheckbox.checked) {
		bellIcon.classList.remove('bell-icon-off');
		bellIcon.classList.add('bell-icon');
	} else {
		bellIcon.classList.remove('bell-icon');
		bellIcon.classList.add('bell-icon-off');
	}
	
	notificationsCheckbox.addEventListener('change', function() {
		if (this.checked) {
			bellIcon.classList.remove('bell-icon-off');
			bellIcon.classList.add('bell-icon');
		} else {
			bellIcon.classList.remove('bell-icon');
			bellIcon.classList.add('bell-icon-off');
		}

		// Salvar a preferência do usuário no localStorage
		localStorage.setItem('notifications', this.checked);
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
              bellIcon.classList.remove('bell-icon-off');
			  bellIcon.classList.add('bell-icon');
        } else {
            bellIcon.classList.add('bell-icon-off');
		    bellIcon.classList.remove('bell-icon');
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
	let mouseMoved = false; // adicionar isso ao topo do código

	video.addEventListener('mousedown', (event) => {
		    if (document.fullscreenElement) {
			return;  // Skip this event if in fullscreen mode
		}
		
		    if (event.button === 0) {
				mouseDown = true;
				const rect = video.getBoundingClientRect();
				startX = event.clientX - rect.left;
				startY = event.clientY - rect.top;
			}
	});

	video.addEventListener('mousemove', (event) => {
		if (mouseDown) {
			mouseMoved = true;
			const rect = video.getBoundingClientRect();
			const mouseX = event.clientX - rect.left;
			const mouseY = event.clientY - rect.top;
			const width = mouseX - startX;
			const height = mouseY - startY;
			// Verifique se o mouse foi movido o suficiente antes de atualizar o overlay e a caixa de sensibilidade
			if (Math.abs(width) > 20 || Math.abs(height) > 20) {
				mouseMoved = true;
				overlay.style.width = `${Math.abs(width)}px`;
				overlay.style.height = `${Math.abs(height)}px`;
				overlay.style.left = `${Math.min(startX, startX + width)}px`;
				overlay.style.top = `${Math.min(startY, startY + height)}px`;
				overlay.style.display = 'block';
			}
		}
	});

	video.addEventListener('mouseup', (event) => {
		if (mouseDown) {
			mouseDown = false;
			if(mouseMoved){
				const rect = video.getBoundingClientRect();
				const mouseX = event.clientX - rect.left;
				const mouseY = event.clientY - rect.top;
				let width = Math.abs(mouseX - startX);
				let height = Math.abs(mouseY - startY);
				if (width < 20) {
					width = 20;
				}
				if (height < 20) {
					height = 20;
				}
				sensitivityRect = {
					x: Math.min(startX, mouseX),
					y: Math.min(startY, mouseY),
					width: width,
					height: height,
				};
				overlay.style.width = `${sensitivityRect.width}px`;
				overlay.style.height = `${sensitivityRect.height}px`;
				overlay.style.left = `${sensitivityRect.x}px`;
				overlay.style.top = `${sensitivityRect.y}px`;
				overlay.style.display = 'block';
				localStorage.setItem('sensitivityRect', JSON.stringify(sensitivityRect));
				mouseMoved = false;
			}
			else{
				// Restaurar a caixa de sensibilidade anterior se o arrasto do mouse foi muito pequeno
				const savedSensitivityRect = localStorage.getItem('sensitivityRect');
				if (savedSensitivityRect) {
					sensitivityRect = JSON.parse(savedSensitivityRect);
					overlay.style.width = `${sensitivityRect.width}px`;
					overlay.style.height = `${sensitivityRect.height}px`;
					overlay.style.left = `${sensitivityRect.x}px`;
					overlay.style.top = `${sensitivityRect.y}px`;
					overlay.style.display = 'block';
				}
			}
		}
	});

	document.addEventListener('keydown', function(event) {
		if (event.key === 'f' || event.key === 'F') { // Press 'F' to toggle fullscreen mode
			if (document.fullscreenElement) {
				exitFullscreen();
			} else {
				enterFullscreen(videoContainer);
			}
		} else if (event.key === 'Escape' || event.key === 'Esc') { // Press 'Esc' to exit fullscreen mode
			if (document.fullscreenElement) {
				exitFullscreen();
			}
		}
	});


	document.addEventListener('fullscreenchange', (event) => {
		if (document.fullscreenElement) {
			// Se entramos em tela cheia, defina o vídeo para ocupar todo o espaço
			video.style.position = 'fixed';
			video.style.top = '0';
			video.style.left = '0';
			video.style.width = '100%';
			video.style.height = '100%';
			
			// Ajuste a posição e o tamanho do retângulo.
			overlay.style.width = `${sensitivityRect.width / video.videoWidth * 100}%`;
			overlay.style.height = `${sensitivityRect.height / video.videoHeight * 100}%`;
			overlay.style.left = `${sensitivityRect.x / video.videoWidth * 100}%`;
			overlay.style.top = `${sensitivityRect.y / video.videoHeight * 100}%`;
		} else {
			// Se sairmos da tela cheia, redefina o estilo do vídeo
			video.style.position = 'static';
			video.style.width = '';
			video.style.height = '';
			
			// Redefina a posição e o tamanho do retângulo.
			overlay.style.width = `${sensitivityRect.width}px`;
			overlay.style.height = `${sensitivityRect.height}px`;
			overlay.style.left = `${sensitivityRect.x}px`;
			overlay.style.top = `${sensitivityRect.y}px`;
		}
	});

	function enterFullscreen(element) {
		if (element.requestFullscreen) {
			element.requestFullscreen();
		} else if (element.mozRequestFullScreen) { // Firefox
			element.mozRequestFullScreen();
		} else if (element.webkitRequestFullscreen) { // Chrome, Safari and Opera
			element.webkitRequestFullscreen();
		} else if (element.msRequestFullscreen) { // IE/Edge
			element.msRequestFullscreen();
		}
	}

	function exitFullscreen() {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.mozCancelFullScreen) { // Firefox
			document.mozCancelFullScreen();
		} else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
			document.webkitExitFullscreen();
		} else if (document.msExitFullscreen) { // IE/Edge
			document.msExitFullscreen();
		}
	}



	var zoomSpan = document.getElementsByClassName('close')[0];
	let zoomImg = document.getElementById('zoomModal-img');

	zoomModal.onmousedown = dragMouseDown;



	zoomSpan.onclick = function() {
		zoomModal.style.display = 'none';
		
		isModalOpen = false; // define the modal as closed

		this.style.display = 'none'; // Hide the close button when the zoom modal is closed
		// Remover a borda da miniatura selecionada
		if(selectedIndex !== -1) {
			thumbnails[selectedIndex].style.border = 'none';
		}		

	};

	// Cria os placeholders.
	for (let i = 0; i < totalSnapshots; i++) {
	  const placeholder = document.createElement('img');
	  placeholder.src = '';  // URL de uma imagem placeholder. Pode ser uma imagem transparente ou um ícone.
	  snapshots.appendChild(placeholder);
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