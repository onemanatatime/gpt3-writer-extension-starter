// how do we know which state (`key_needed` or `key_entered`) to show first?
// write a function that runs every time the extension is opened to check for a key stored in our extension storage. If there is already a key show the key_entered UI else show the key_needed UI.
const checkForKey = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['openai-key'], (result) => {
            resolve(result['openai-key']);
        });
    });
};
// All we are doing here is checking for the key in our state. If it’s there go ahead and return it! We use a promise here because we need to wait for the callback to be called in the chrome.storage section. Once it’s called we can resolve our promise.

// add `encode` function
// `btoa` stands for Binary to ASCII: https://developer.mozilla.org/en-US/docs/Web/API/btoa
// We are only changing the format - this is not secure at all!!
const encode = (input) => {
  return btoa(input);
};

// function declaration
const saveKey = () => {
    const input = document.getElementById('key_input');

    if (input) {
        // grab input value from input box itself
        const { value } = input;

        // Encode String (Base64)
        const encodedValue = encode(value);

        // Save to google storage
        chrome.storage.local.set({ 'openai-key': encodedValue }, () => {

            document.getElementById('key_needed').style.display = 'none';
            
            // change CSS to show the "you have entered key" dialog
            document.getElementById('key_entered').style.display = 'block';
        });
  }
}

// enables `key_needed` ui to be shown to enter a new API key if needed.
const changeKey = () => {
    document.getElementById('key_needed').style.display = 'block';
    document.getElementById('key_entered').style.display = 'none';  
}

// listeners to know when buttons are clicked
document.getElementById('save_key_button').addEventListener('click', saveKey);
document
  .getElementById('change_key_button')
  .addEventListener('click', changeKey);


// Finally, call this at the very bottom of your file. Every time your extension is opened this will run:
checkForKey().then((response) => {
  if (response) {
    document.getElementById('key_needed').style.display = 'none';
    document.getElementById('key_entered').style.display = 'block';
  }
});
// We wait for the promise to resolve and then we set it accordingly. If the key is there, show the `key_entered` UI.