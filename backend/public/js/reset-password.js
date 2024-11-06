document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const passwordInput = document.getElementById('password');

    // Extract the token from the URL query string
    const token = new URLSearchParams(window.location.search).get('token');

    // Check if token is present in the URL
    if (!token) {
        alert('Invalid or missing token.');
        window.location.href = '/forgot-password.html';  // Redirect to forgot password page if token is missing
        return;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const password = passwordInput.value;

        if (!password) {
            alert('Please enter a new password.');
            return;
        }

        try {
            // Make a POST request to the /reset-password endpoint
            const response = await fetch('/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,  // Use the token extracted from the URL
                    password: password,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                alert('Password reset successfully!');
                window.location.href = '/login.html';  // Redirect to login page after success
            } else {
                alert(result.message || 'Error resetting password.');
            }
        } catch (error) {
            console.error('Error during password reset:', error);
            alert('An error occurred. Please try again.');
        }
    });
});
