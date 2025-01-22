import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

const firebaseConfig = {

    apiKey: "AIzaSyBSvYwZ5VQ5r42zEXx8aLACkln8HVgjqQE",
    authDomain: "yep2025-3f1d9.firebaseapp.com",
    projectId: "yep2025-3f1d9",
    storageBucket: "yep2025-3f1d9.firebasestorage.app",
    messagingSenderId: "482933449467",
    appId: "1:482933449467:web:d63d2949359905e13b465e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Function to read from a collection
async function getDocuments() {
    try {
        const querySnapshot = await getDocs(collection(db, "default"));
        querySnapshot.forEach((doc) => {
            console.log(`${doc.id} =>`, doc.data());
        });
    } catch (error) {
        console.error("Error getting documents: ", error);
    }
}
// Call the function
getDocuments();

// Function to get random numbers from Firestore
async function getRandomNumbers() {
    try {
        const docRef = doc(db, "default", "numbers");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const numbers = docSnap.data().availableNumbers;
            const randomNumbers = [];
            while (randomNumbers.length < 3) {
                const randomIndex = Math.floor(Math.random() * numbers.length);
                const randomNumber = numbers[randomIndex];
                if (!randomNumbers.includes(randomNumber)) {
                    randomNumbers.push(randomNumber);
                }
            }
            return randomNumbers;
        } else {
            console.log("No such document!");
        }
    } catch (error) {
        console.error("Error getting document: ", error);
    }
}

// Update the updateNumberButtons function
async function updateNumberButtons() {
    const loader = document.getElementById('number-loader');
    const buttonsContainer = document.getElementById('number-buttons');
    
    try {
        // Show loader, hide buttons
        loader.style.display = 'block';
        buttonsContainer.classList.remove('loaded');
        
        // Get random numbers
        const randomNumbers = await getRandomNumbers();
        
        if (!randomNumbers || randomNumbers.length !== 3) {
            throw new Error('Failed to get numbers');
        }

        // Update button values
        document.getElementById('number-btn-1').textContent = randomNumbers[0];
        document.getElementById('number-btn-2').textContent = randomNumbers[1];
        document.getElementById('number-btn-3').textContent = randomNumbers[2];
        
        // Hide loader, show buttons with animation
        loader.style.display = 'none';
        buttonsContainer.classList.add('loaded');
        
    } catch (error) {
        console.error('Error updating numbers:', error);
        loader.style.display = 'none';
        alert('Error loading numbers. Please try again.');
    }
}

// Call the function to update number buttons on load
updateNumberButtons();

// Ensure checkAndUpdateNumber is exported
export async function checkAndUpdateNumber(name, number) {
    try {
        const docRef = doc(db, "default", "numbers");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const pickedNumbers = data.pickedNumber || {};

            if (pickedNumbers[number]) {
                return { success: false, message: `Số ${number} đã được chọn bởi ${pickedNumbers[number]}` };
            }

            const availableNumbers = data.availableNumbers.filter(n => n !== number);
            const newPickedNumbers = { ...pickedNumbers, [number]: name };

            await setDoc(docRef, {
                availableNumbers: availableNumbers,
                pickedNumber: newPickedNumbers
            });

            return { success: true };
        } else {
            return { success: false, message: "Không tìm thấy tài liệu." };
        }
    } catch (error) {
        console.error("Error updating numbers: ", error);
        return { success: false, message: "Có lỗi xảy ra." };
    }
}

// Export the updateName function
export async function updateName(newName, number) {
    try {
        const docRef = doc(db, "default", "numbers");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const pickedNumbers = data.pickedNumber || {};

            if (!pickedNumbers[number]) {
                return { success: false, message: "Số đã được chọn bởi người khác." };
            }

            pickedNumbers[number] = newName;

            await setDoc(docRef, {
                pickedNumber: pickedNumbers
            }, { merge: true });

            return { success: true };
        } else {
            return { success: false, message: "Không tìm thấy tài liệu." };
        }
    } catch (error) {
        console.error("Error updating name: ", error);
        return { success: false, message: "Có lỗi xảy ra." };
    }
}

// Add event listener to reset button
document.getElementById('reset-btn').addEventListener('click', updateNumberButtons);