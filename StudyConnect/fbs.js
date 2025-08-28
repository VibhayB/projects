// fbs.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, getRedirectResult } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getStorage, ref, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBG8yLFh6Nk6tc5VoR2HEVF-fHUOkLBIq8",
  authDomain: "aiml-studyconnect.firebaseapp.com",
  projectId: "aiml-studyconnect",
  storageBucket: "aiml-studyconnect.appspot.com",
  messagingSenderId: "321987757540",
  appId: "1:321987757540:web:0de99f3f3bebe719bf73f1",
  measurementId: "G-C7ZRZR37K2"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); 

let isSignInInProgress = false;
window.signInWithGoogle = async function(val = false, onpurpose = false) {
  if(val){
    await auth.signOut();
    console.log("signed out");
    if(!onpurpose){
      showAlert('Your email is not allowed to sign in.',"https://cdn-icons-png.flaticon.com/512/675/675564.png");
    }
    localStorage.setItem("tabcurrentx","home");
    localStorage.setItem("tabcurrenty","AIML StudyConnect");
    localStorage.removeItem("xebiacontent");
    localStorage.removeItem('clanlinks');
    localStorage.removeItem("courseInfo");
    localStorage.removeItem("semesters");
    return null;
  }
  if (isSignInInProgress) {
    return null; 
  }
  
  isSignInInProgress = true;
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  let popupWindow = null;
  const checkPopupInterval = 1000; 
  let popupChecker;

  try {
    const result = await new Promise((resolve, reject) => {
      popupWindow = signInWithPopup(auth, provider);
      
      popupChecker = setInterval(() => {
        if (popupWindow && popupWindow.closed) {
          clearInterval(popupChecker);
          isSignInInProgress = false; 
          showAlert('Sign-in was canceled.',"https://cdn-icons-png.flaticon.com/512/675/675564.png");
          reject(new Error('Popup closed by user'));
        }
      }, checkPopupInterval);
      
      popupWindow.then(resolve).catch(reject);
    });

    clearInterval(popupChecker); 

    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    const user = result.user;
    
    localStorage.setItem("efusereId", user.email);
    console.log("your email: ");
    console.log(user.email);
    console.log("Successfully signed")
    return user;

  } catch (error) {
    showAlert('Your email is not allowed to sign in.',"https://cdn-icons-png.flaticon.com/512/675/675564.png");
    return null;
  
  } finally {
    clearInterval(popupChecker); 
    isSignInInProgress = false; 
  }
}; 
window.loadCollectionData = async function(collectionName) {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data;
  } catch (error) {
    console.error('Error loading', error);
    return [];
  }

}; 
