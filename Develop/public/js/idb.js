// * creating a variable to hold the connection to the db
let db;

// * establish a connection to IndexedDB database called 'budget_tracker' and set it to version 1
const request = indexedDB.open('pizza_hunt', 1);

// * this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded= function(event){
    // * save a reference to the database
    const db = event.target.result;
    // * create an object store (table) called 'new_tracker', set it to have an auto incrementing primary key of sorts
    db.createObjectStore('new_tracker', { autoIncrement: true });
};

// * if it was successful
request.onsuccess = function (event) {
    // * when db is successfully created with its object store (from onupgradeneeded) or simply established a connection, save reference to db in global variable
    db = event.target.result;

    //  * check if app is online, if yes run uploadBudget() function to send all local db data to api
    if(navigator.onLine){
        uploadBudget();
    }
};

request.onerror = function (event){
    // log error here
    console.log(event.target.errorCode);
};

// * This function will be executed if we attempt to submit a new pizza and there's no internet connection
function saveRecord(record){
    // * open a new transaction with database with read and write perms
    const transaction = db.transaction(['new_tracker'], 'readwrite');

    // * access the object store for `new_tracker`
    const trackerObjectStore = transaction.objectStore('new_tracker');

    // * add record to your with add method
    trackerObjectStore.add(record);
};

function uploadBudget(){
    // * open a transaction on your db
    const transaction = db.transaction(['new_tracker'], 'readwrite');

    // * access your object store
    const trackerObjectStore = transaction.objectStore('new_tracker');

    // * get all records from store and set to a variable
    const getAll = trackerObjectStore.getAll();

    // * upon a successful .getAll() execution, run this function
    getAll.onsuccess = function(){
        // * if there was data in indexedDb's store, we will send it the api server
        if(getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message){
                    throw new Error(serverResponse);
                }
                // * open one more transaction
                const transaction = db.transaction(['new_tracker'], 'readwrite');
                // * access to the new_tracker object store
                const trackerObjectStore = transaction.objectStore('new_tracker');
                // * clear all items in your store
                trackerObjectStore.clear();

                alert('Your item has been added to your budget!');
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
};

// * listen for app coming back online
window.addEventListener('online', uploadBudget);