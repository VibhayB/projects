// Ask the active tab for selected text
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        func: () => window.getSelection().toString()
    }, function(results) {
        const selectedText = results?.[0]?.result?.trim();
        if (!selectedText) {
            document.getElementById('response').innerText = 'No text selected.';
            return;
        }
        fetchGeminiResponse(selectedText);
    });
});

function fetchGeminiResponse(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=apiKey`;

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    })
    .then(response => response.json())
    .then(data => {
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
        document.getElementById('response').innerText = reply;
    })
    .catch(err => {
        document.getElementById('response').innerText = `Error: ${err.message}`;
    });
}
