import { auth } from './auth.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-database.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-storage.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-app.js';

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBuhNVwmplloe2EqKrEdnw2tSKmGVkamD8",
    authDomain: "els-upn-jatim.firebaseapp.com",
    databaseURL: "https://els-upn-jatim-default-rtdb.firebaseio.com",
    projectId: "els-upn-jatim",
    storageBucket: "els-upn-jatim.appspot.com",
    messagingSenderId: "471852831009",
    appId: "1:471852831009:web:de1f97d6769570622bee60"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

let selectedFile; // Declare selectedFile variable

// Hide the btnSubmit button at page initialization
document.querySelector('.btnSubmit').style.display = 'none';

document.getElementById('fileInput').addEventListener('change', function () {
    selectedFile = this.files[0];

    if (selectedFile) {
        var filePath;

        // Check if the browser supports creating object URLs
        if (window.URL) {
            filePath = window.URL.createObjectURL(selectedFile);
        } else {
            // Fallback for browsers that do not support object URLs
            filePath = this.value; // The file path will be exposed in some browsers (may be a fake path)
        }

        alert('File terpilih silahkan klik submit untuk upload file');
        // Show the btnSubmit button after a file is selected
        document.querySelector('.btnSubmit').style.display = 'block';

        // You can add more logic here to handle the selected file or file path
    }
});

const btnPopup = document.querySelector('.btnSubmit');

btnPopup.addEventListener('click', () => {
    const pertemuanSelect = document.getElementById('pertemuanSelect').value;
    // You don't need to sign in with gapi, just upload the file to Firebase Storage
    uploadFileToFirebaseStorage(selectedFile, pertemuanSelect);
});

function uploadFileToFirebaseStorage(file, pertemuanSelect) {
    // Check if the file is a PDF
    if (file.type !== 'application/pdf') {
        alert('File harus format PDF');
        return;
    }

    // Disable user interaction and show loading spinner
    toggleOverlay(true);

    auth.onAuthStateChanged(user => {
        if (user) {
            const uid = user.uid;
            const userRef = ref(getDatabase(), `users/${uid}`);

            onValue(userRef, snapshot => {
                const userData = snapshot.val();
                if (userData) {
                    // Extract 'nim' from user data
                    const nim = userData.nim;
                    const nama = userData.nama;

                    // Specify the main folder path (e.g., 'tugas')
                    const mainFolderPath = 'Tugas';

                    // Create a reference to the user's folder under 'tugas'
                    const userFolderPath = `${mainFolderPath}/${nim}`;

                    // Create a reference to the file in the user's folder
                    const storage = getStorage(firebaseApp);
                    const fileRef = storageRef(storage, `${userFolderPath}/${file.name}`);

                    // Check if the folder exists by attempting to get its download URL
                    getDownloadURL(fileRef)
                        .then(() => {
                            // Folder exists, proceed with uploading the file
                            uploadFile(file, pertemuanSelect, nim, nama, userFolderPath);
                        })
                        .catch(() => {
                            // Folder doesn't exist, create the folder first
                            createFolderAndUpload(file, pertemuanSelect, nim, nama, userFolderPath);
                        });
                } else {
                    toggleOverlay(false);
                    alert('Error, silahkan coba kembali');
                }
            });
        } else {
            toggleOverlay(false);
            window.location.href = "./index.html";
        }
    });
}

function uploadFile(file, pertemuanSelect, nim, nama, userFolderPath) {
    const storage = getStorage(firebaseApp);
    const originalExtension = file.name.split('.').pop();
    const filename = `${pertemuanSelect}-${nim}-${nama}.${originalExtension}`;
    const fileRef = storageRef(storage, `${userFolderPath}/${filename}`);

    uploadBytes(fileRef, file)
        .then(snapshot => {
            console.log('File uploaded successfully');
            toggleOverlay(false);
            alert('Berhasil upload file');
            window.location.href = "./dashboard.html";
        })
        .catch(error => {
            toggleOverlay(false);
            alert('Gagal upload file:', error.message);
        });
}

function createFolderAndUpload(file, pertemuanSelect, nim, nama, userFolderPath) {
    const storage = getStorage(firebaseApp);
    const fileRef = storageRef(storage, userFolderPath);

    // Create the folder by uploading an empty file
    uploadBytes(fileRef, new Uint8Array())
        .then(() => {
            // Proceed with uploading the file after creating the folder
            uploadFile(file, pertemuanSelect, nim, nama, userFolderPath);
        })
        .catch(error => {
            toggleOverlay(false);
            alert('Gagal membuat folder:', error.message);
            // You can add error handling logic here
            
        });
}

function toggleOverlay(show) {
    const overlay = document.querySelector('.overlay');

    if (show) {
        // Show overlay
        overlay.style.display = 'block';

        // Create container for loading spinner and text
        const container = document.createElement('div');
        container.className = 'loading-container';

        // Create loading spinner
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        container.appendChild(spinner);

        // Create loading text
        const loadingText = document.createElement('p');
        loadingText.className = 'loading-text';
        loadingText.textContent = 'Sedang memproses file...';
        container.appendChild(loadingText);

        // Append container to overlay
        overlay.appendChild(container);
    } else {
        // Hide overlay
        overlay.style.display = 'none';

        // Remove loading spinner and text container
        overlay.innerHTML = '';
    }
}
