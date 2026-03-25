document.getElementById('testBtn').addEventListener('click', function() {
    // Test if Firebase is connected
    if (typeof firebase !== 'undefined' && firebase.app()) {
        document.getElementById('result').textContent = '✅ Firebase Connected Successfully!';
        document.getElementById('result').style.color = '#2ecc71';
    } else {
        document.getElementById('result').textContent = '❌ Firebase Connection Failed';
        document.getElementById('result').style.color = '#e74c3c';
    }
});