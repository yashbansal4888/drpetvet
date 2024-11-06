// logout.js

// Function to log the user out
function logout() {
    fetch('/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Logged out successfully.') {
            // Redirect to the login page
            window.location.href = '/login.html';
        } else {
            alert('Failed to log out. Please try again.');
        }
    })
    .catch((error) => {
        console.error('Error logging out:', error);
        alert('An error occurred during logout.');
    });
}

// Call the logout function as soon as the page loads
window.onload = logout;
