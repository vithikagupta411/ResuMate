
  const firebaseConfig = {
    apiKey: "AIzaSyCrJOdX7nNMtpmYWUhl2Bs6AeTVukle3gw",
    authDomain: "lastresumatedb.firebaseapp.com",
    databaseURL: "https://lastresumatedb-default-rtdb.firebaseio.com",
    projectId: "lastresumatedb",
    storageBucket: "lastresumatedb.firebasestorage.app",
    messagingSenderId: "485061271384",
    appId: "1:485061271384:web:b2a339dc0b38e003238f2d",
    measurementId: "G-X07XGHT3NC"
  };


 
  // Initialize Firebase
 firebase.initializeApp(firebaseConfig)

// referemce

const db=firebase.database().ref('LastresumateDB')


document.getElementById('register').addEventListener('submit',submitForm)

function submitForm(e)
{
  e.preventDefault();

 
  var FirstName=getElementval('first')
  
  var LastName=getElementval('last')
  
  var UserName=getElementval('user')

  var email=getElementval('email')

  var phoneno=getElementval('phoneno')

  var password=getElementval('password')

  var confirm=getElementval('confirm')



  console.log(FirstName,LastName,phoneno,password,phoneno,confirm)


}
const getElementval=(id)=>
{
  return document.getElementById(id).value;
}