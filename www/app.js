(function(){
    

  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyCwXGlKyUdx_UqAlduL-6EYq9o4EUjmRek",
    authDomain: "supermeow-teamc.firebaseapp.com",
    databaseURL: "https://supermeow-teamc.firebaseio.com",
    projectId: "supermeow-teamc",
    storageBucket: "supermeow-teamc.appspot.com",
    messagingSenderId: "664299558478"
  };
  firebase.initializeApp(config);

    //get elements
    const txtEmail=document.getElementById('txtEmail');
    const txtPassword=document.getElementById('txtPassword');
    const btnLogin=document.getElementById('btnLogin');
    const btnSignUp=document.getElementById('btnSignUp');
    const btnLogout=document.getElementById('btnLogout');
    
    //add login event
    btnLogin.addEventListener('click',e =>{
        //get email and pass
        const email=txtEmail.value;
        const pass=txtPassword.value;
        const auth=firebase.auth();
        
    //sign in
        const promise=auth.signInWithEmailAndPassword(email,pass);
        promise.catch(e =>console.log(e.message));
    });
    //add signup event
    btnSignUp.addEventListener('click', e=>{
        //get email and pass
        const email=txtEmail.value;
        const pass=txtPassword.value;
        const auth=firebase.auth();
        
    //sign in
        const promise=auth.createUserWithEmailAndPassword(email,pass);
        promise.catch(e =>console.log(e.message));
        
    });
    // logout
    btnLogout.addEventListener('click',e=>{
        firebase.auth().signOut();
    });

    //add a realtime listener

    firebase.auth().onAuthStateChanged(firebaseUser=>{
        if(firebaseUser){
            console.log(firebaseUser);
            console.log('logged in');
            alert("You are logged in! Welcome back!");
            btnLogout.classList.remove('logoutbtn-hide');


        }else{
            console.log('not logged in');
            btnLogout.classList.add('logoutbtn-hide');
}
});


}());