import { checkAndUpdateNumber, updateName } from './firebase.js';

const nameInput = document.getElementById('name-input');
nameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
    }
});
AFRAME.registerComponent('gallery-handler', {
    init: function () {
        const galleryItems = [
            { type: 'image', id: '#image1', displayId: 'image1-display', textId: 'image1-text' },
            { type: 'image', id: '#image2', displayId: 'image2-display', textId: 'image2-text' },
            { type: 'video', id: '#video1', displayId: 'video1-display', textId: 'video1-text' },
            { type: 'video', id: '#video2', displayId: 'video2-display', textId: 'video2-text' }
        ];

        let currentIndex = 0;
        const playBtn = document.querySelector('#play-btn');
        const video1Overlay = document.querySelector('#video1-overlay');
        const video2Overlay = document.querySelector('#video2-overlay');

        // Next button
        document.querySelector('#next-btn').addEventListener('click', () => {
            console.log('Next clicked');
            hideCurrentItem();
            currentIndex = (currentIndex + 1) % galleryItems.length;
            showCurrentItem();
        });

        // Previous button
        document.querySelector('#prev-btn').addEventListener('click', () => {
            console.log('Prev clicked');
            hideCurrentItem();
            currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
            showCurrentItem();
        });

        // Attach click events to video entities instead
        function toggleVideo() {
            const currentItem = galleryItems[currentIndex];
            if (currentItem.type !== 'video') return;

            const video = document.querySelector(currentItem.id);
            const overlay = getOverlay(currentItem);

            if (video.paused) {
                video.play();
                playBtn.setAttribute('src', '#btn-pause');
                playBtn.emit('fadeOut');
                overlay.setAttribute('visible', false);
            } else {
                video.pause();
                playBtn.setAttribute('src', '#btn-play');
                playBtn.emit('fadeIn');
                overlay.setAttribute('visible', true);
            }
        }

        function getOverlay(item) {
            return item.id === '#video1' ? video1Overlay : video2Overlay;
        }

        // Update hideCurrentItem function
        function hideCurrentItem() {
            const currentItem = galleryItems[currentIndex];
            document.querySelector(`#${currentItem.displayId}`).setAttribute('visible', false);
            document.querySelector(`#${currentItem.textId}`).setAttribute('visible', false);

            // Pause and reset video if current item is a video
            if (currentItem.type === 'video') {
                const videoElementId = currentItem.id.substring(1); // Remove '#' from ID
                const video = document.getElementById(videoElementId);
                if (video) {
                    video.pause();
                    video.currentTime = 0;
                }
            }
        }

        function showCurrentItem() {
            const currentItem = galleryItems[currentIndex];
            document.querySelector(`#${currentItem.displayId}`).setAttribute('visible', true);
            document.querySelector(`#${currentItem.textId}`).setAttribute('visible', true);

            // Reset all overlays first
            video1Overlay.setAttribute('visible', false);
            video2Overlay.setAttribute('visible', false);

            // Show/hide play button and setup video elements
            if (currentItem.type === 'video') {
                const video = document.querySelector(currentItem.id);
                const overlay = getOverlay(currentItem);

                video.currentTime = 0;
                playBtn.setAttribute('visible', true);
                playBtn.setAttribute('src', '#btn-pause');

                // Auto play the video
                video.play();
                overlay.setAttribute('visible', false);

                // Setup click handlers
                overlay.removeEventListener('click', toggleVideo);
                overlay.addEventListener('click', toggleVideo);

                const videoDisplay = document.querySelector('#' + currentItem.displayId);
                videoDisplay.removeEventListener('click', toggleVideo);
                videoDisplay.addEventListener('click', toggleVideo);

                playBtn.emit('fadeOut');
            } else {
                playBtn.setAttribute('visible', false);
            }
        }

        // Show initial item
        showCurrentItem();
    }
});

AFRAME.registerComponent('scene-handler', {
    init: function () {
        let userData = {
            name: '',
            number: ''
        };

        const nameOverlay = document.getElementById('name-input-overlay');
        const confirmationOverlay = document.getElementById('confirmation-overlay');
        const welcomeText = document.getElementById('welcome-text');
        const galleryContainer = document.getElementById('gallery-container');
        const galleryToggle = document.getElementById('gallery-toggle');

        // Get AR system reference
        const sceneEl = document.querySelector('a-scene');
        const arSystem = sceneEl.systems["mindar-image-system"];

        // Initial form submission
        document.getElementById('name-submit').addEventListener('click', () => {
            userData.name = document.getElementById('name-input').value.trim();

            if (userData.name && userData.number) {
                document.getElementById('confirm-name').textContent = userData.name;
                document.getElementById('confirm-number').textContent = userData.number;

                nameOverlay.style.opacity = '0';
                setTimeout(() => {
                    nameOverlay.style.display = 'none';
                    confirmationOverlay.style.display = 'flex';
                    setTimeout(() => confirmationOverlay.style.opacity = '1', 50);
                }, 500);
            }
        });

        // Confirmation handlers
        document.getElementById('cancel-btn').addEventListener('click', () => {
            confirmationOverlay.style.opacity = '0';
            setTimeout(() => {
                confirmationOverlay.style.display = 'none';
                nameOverlay.style.display = 'flex';
                setTimeout(() => nameOverlay.style.opacity = '1', 50);
            }, 500);
        });

        // Modify the continue button click handler
        document.getElementById('continue-btn').addEventListener('click', async () => {
            const name = document.getElementById('confirm-name').textContent;
            const number = document.getElementById('confirm-number').textContent;

            // Show loading state
            document.getElementById('continue-btn').disabled = true;
            document.getElementById('continue-btn').textContent = 'Đang xử lý...';

            const result = await checkAndUpdateNumber(name, number);

            if (result.success) {
                // Continue with existing flow
                confirmationOverlay.style.opacity = '0';
                setTimeout(() => {
                    confirmationOverlay.style.display = 'none';

                    // Update welcome text
                    const personalMessage = document.querySelector('#personal-message');
                    personalMessage.setAttribute('troika-text', `value:${name} đã chọn số ${number}`);

                    // Show welcome text and start fireworks
                    welcomeText.setAttribute('visible', true);
                    document.querySelector('#firework-left').components.firework.play();
                    document.querySelector('#firework-right').components.firework.play();

                    galleryToggle.setAttribute('visible', true);

                    // Start AR system
                    const arSystem = document.querySelector('a-scene').systems["mindar-image-system"];
                    if (arSystem) {
                        arSystem.start();
                    }
                }, 500);
            } else {
                // Show error message
                alert(result.message || 'Có lỗi xảy ra, vui lòng thử lại');

                // Reset buttons and go back to number selection
                document.getElementById('continue-btn').disabled = false;
                document.getElementById('continue-btn').textContent = 'Tiếp tục';

                // Return to name input screen
                confirmationOverlay.style.opacity = '0';
                setTimeout(() => {
                    confirmationOverlay.style.display = 'none';
                    nameOverlay.style.display = 'flex';
                    setTimeout(() => nameOverlay.style.opacity = '1', 50);
                }, 500);
            }
        });

        // Gallery toggle handler
        galleryToggle.addEventListener('click', function () {
            const isGalleryVisible = galleryContainer.getAttribute('visible');
            galleryContainer.setAttribute('visible', !isGalleryVisible);
            welcomeText.setAttribute('visible', isGalleryVisible);
        });

        // Add handlers to stop AR when editing
        document.getElementById('edit-name').addEventListener('click', () => {
            arSystem.stop();
        });
    }
});

// Add name handling logic
document.addEventListener('DOMContentLoaded', function () {
    const overlay = document.getElementById('name-input-overlay');
    const nameInput = document.getElementById('name-input');
    const submitBtn = document.getElementById('name-submit');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const editBtn = document.getElementById('edit-name');
    const scene = document.querySelector('a-scene');

    // Wait for scene to load before getting arSystem
    let arSystem;
    scene.addEventListener('loaded', function () {
        arSystem = scene.systems["mindar-image-system"];
    });

    function showNameInput() {
        overlay.style.opacity = '1';
        overlay.style.display = 'flex';
        nameInput.focus();
        // Only stop AR if system is initialized
        if (arSystem) {
            arSystem.stop();
        }
    }

    function hideNameInput() {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 500);
    }

    function showUserInfo() {
        userInfo.style.display = 'block';
        setTimeout(() => {
            userInfo.style.opacity = '1';
        }, 100);
    }

    function submitName() {
        const name = nameInput.value.trim();
        if (name && selectedNumber) {  // Check for both name and number
            userName.textContent = name;
            document.getElementById('user-number').textContent = selectedNumber;  // Set number here
            hideNameInput();
            showUserInfo();
        } else {
            alert("Please enter your name and select a number.");
        }
    }

    // Event listeners
    submitBtn.addEventListener('click', submitName);
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitName();
    });

    editBtn.addEventListener('click', () => {
        const currentName = document.getElementById('user-name').textContent;
        document.getElementById('edit-name-input').value = currentName;

        document.getElementById('user-info').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('user-info').style.display = 'none';
            document.getElementById('edit-name-overlay').style.display = 'flex';
            setTimeout(() => document.getElementById('edit-name-overlay').style.opacity = '1', 50);
        }, 500);
    });

    // Show input on load
    showNameInput();
});

AFRAME.registerComponent('firework', {
    init: function () {
        this.el.addEventListener('animationcomplete', () => {
            // Reset animation when complete
            this.el.object3D.visible = true;
            this.el.setAttribute('animation-mixer', 'loop: repeat');
        });
    },
    play: function () {
        this.el.object3D.visible = true;
        this.el.setAttribute('animation-mixer', 'loop: repeat');
    },
    pause: function () {
        this.el.object3D.visible = false;
        this.el.removeAttribute('animation-mixer');
    }
});

let selectedNumber = null;

document.querySelectorAll('.number-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.number-btn').forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        selectedNumber = button.textContent;
    });
});

// Then modify the name-submit click handler to only handle transition
document.getElementById('name-submit').addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (name && selectedNumber) {
        document.getElementById('confirm-name').textContent = name;
        document.getElementById('confirm-number').textContent = selectedNumber;

        document.getElementById('name-input-overlay').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('name-input-overlay').style.display = 'none';
            document.getElementById('confirmation-overlay').style.display = 'flex';
            setTimeout(() => document.getElementById('confirmation-overlay').style.opacity = '1', 50);
        }, 500);
    } else {
        alert("Please enter your name and select a number.");
    }
});

// Update continue-btn click handler to avoid setting values again
document.getElementById('continue-btn').addEventListener('click', () => {
    document.getElementById('confirmation-overlay').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('confirmation-overlay').style.display = 'none';
        document.getElementById('user-info').style.display = 'block';
        setTimeout(() => document.getElementById('user-info').style.opacity = '1', 50);
    }, 500);
});

document.getElementById('edit-name').addEventListener('click', () => {
    const currentName = document.getElementById('user-name').textContent;
    document.getElementById('edit-name-input').value = currentName;

    document.getElementById('user-info').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('user-info').style.display = 'none';
        document.getElementById('edit-name-overlay').style.display = 'flex';
        setTimeout(() => document.getElementById('edit-name-overlay').style.opacity = '1', 50);
    }, 500);
});

// Edit Name Cancel Button
document.getElementById('edit-name-cancel-btn').addEventListener('click', () => {
    const editNameOverlay = document.getElementById('edit-name-overlay');
    const userInfo = document.getElementById('user-info');
    const arSystem = document.querySelector('a-scene').systems["mindar-image-system"];

    // Hide edit-name overlay
    editNameOverlay.style.opacity = '0';
    setTimeout(() => {
        editNameOverlay.style.display = 'none';
        
        // Show user info
        userInfo.style.display = 'block';
        setTimeout(() => {
            userInfo.style.opacity = '1';
            
            // Restart AR system
            if (arSystem) {
                arSystem.start();
            }
        }, 50);
    }, 500);
});

// Edit Name Save Button
document.getElementById('edit-name-save-btn').addEventListener('click', async () => {
    const newName = document.getElementById('edit-name-input').value.trim();
    const number = document.getElementById('user-number').textContent.trim();

    if (newName && number) {
        try {
            // Call updateName function
            const result = await updateName(newName, number);

            if (result.success) {
                document.getElementById('user-name').textContent = newName;
                // Update welcome text with new name
                const personalMessage = document.querySelector('#personal-message');
                personalMessage.setAttribute('troika-text', `value:${newName} đã chọn số ${number}`);

                const editNameOverlay = document.getElementById('edit-name-overlay');
                const userInfo = document.getElementById('user-info');
                const arSystem = document.querySelector('a-scene').systems["mindar-image-system"];

                // Hide edit-name overlay
                editNameOverlay.style.opacity = '0';
                setTimeout(() => {
                    editNameOverlay.style.display = 'none';
                    
                    // Show user info
                    userInfo.style.display = 'block';
                    setTimeout(() => {
                        userInfo.style.opacity = '1';
                        
                        // Restart AR system
                        if (arSystem) {
                            arSystem.start();
                        }
                    }, 50);
                }, 500);
            } else {
                alert(result.message || 'Error updating name. Please try again.');
            }
        } catch (error) {
            console.error('Error updating name:', error);
            alert('Có lỗi xảy ra, vui lòng thử lại.');
        }
    } else {
        alert("Please enter a valid name.");
    }
});
