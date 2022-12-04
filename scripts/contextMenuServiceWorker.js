// Function to get + decode API key
const getKey = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['openai-key'], (result) => {
            if (result['openai-key']) {
                const decodedKey = atob(result['openai-key']);
                resolve(decodedKey);
            }
        });
    });
}

// This block of code is doing a few things —
// First, we’re looking for which tab is currently active. In order to send a message we need to do it in an active tab
// We then use a fancy sendMessage function given to us from chrome. This takes 3 things — tab, payload, and callback. Our payload is going to include a message called inject and the content of whatever we have passed in
// Finally, our message will respond with a status, to let us know things are working well 
const sendMessage = (content) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0].id;

    chrome.tabs.sendMessage(
      activeTab,
      { message: 'inject', content },
      (response) => {
        if (response.status === 'failed') {
          console.log('injection failed.');
        }
      }
    );
  });
};

// Setup our generate function
const generate = async (prompt) => {
    // Get your API key from storage
    const key = await getKey();
    const url = 'https://api.openai.com/v1/completions';
        
    // Call completions endpoint
    const completionResponse = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: 'text-davinci-003',
            prompt: prompt,
            max_tokens: 1000,
            temperature: 0.8,
        }),
    });
	
    // Select the top choice and send back
    const completion = await completionResponse.json();
    return completion.choices.pop();
}

// everytime generateCompletionAction is called, our listener passed over an info object. This has our selectionText property in it (which is what you highlighted).
const generateCompletionAction = async (info) => {
    try {
        // Send mesage with generating text (this will be like a loading indicator)
        sendMessage('generating...');

        const { selectionText } = info;
        const basePromptPrefix = `
        Write me a detailed table of contents for a tweet thread with the title below, written in the style of Elon Musk.

        Title: 
        `;

        // Add this to call GPT-3
        const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`);

        // Let's see what we get!
        console.log(baseCompletion.text)

        // Add your second prompt here
        const secondPrompt = `
        Take the table of contents and title of the tweet thread below and generate a tweet thread written in the style of Changpeng Zhao. Make it feel like a story. Don't just list the points. Go deep into each one. Explain why. Do not reveal who you are.
        
        Title: ${selectionText}
        
        Table of Contents: ${baseCompletion.text}
        
        Tweet Thread:
        `;

        // Call your second prompt
        const secondPromptCompletion = await generate(secondPrompt);
        console.log(secondPromptCompletion.text)

        // Send the output when we're all done
        sendMessage(secondPromptCompletion.text);

    } catch (error) {
        console.log(error);
        
        // Add this here as well to see if we run into any errors!
        sendMessage(error.toString());
    }
}

chrome.contextMenus.create({
    id: 'context-run',
    title: 'Generate thread',
    contexts: ['selection'],
});

// Add listener
chrome.contextMenus.onClicked.addListener(generateCompletionAction);